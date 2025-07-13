const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Database = require('better-sqlite3');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup. Allow overriding the location for Docker or custom setups.
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'visionvault.db');
// Ensure the directory for the database exists (useful for Docker volumes)
const dbDir = path.dirname(dbPath);
fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(dbPath);
db.prepare(`CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  prompt TEXT,
  tags TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`)
  .run();

// Backwards compatibility: older versions of the database might miss the
// `created_at` column. Check and add it if necessary so inserts won't fail.
const cols = db.prepare('PRAGMA table_info(images)').all();
if (!cols.some((c) => c.name === 'created_at')) {
  db.prepare(
    "ALTER TABLE images ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
  ).run();
  // Give existing rows a timestamp so sort/order queries remain consistent
  db.prepare(
    "UPDATE images SET created_at = datetime('now') WHERE created_at IS NULL"
  ).run();
}

// File upload configuration
const uploadDir = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(uploadDir, { recursive: true });
function getDirectorySize(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const p = path.join(dir, entry.name);
    return total + (entry.isDirectory() ? getDirectorySize(p) : fs.statSync(p).size);
  }, 0);
}

function getStorageStats() {
  try {
    const info = execSync(`df -kP "${uploadDir}"`).toString().split('\n')[1].trim().split(/\s+/);
    const total = parseInt(info[1], 10) * 1024;
    const used = parseInt(info[2], 10) * 1024;
    return { total, used };
  } catch {
    const used = getDirectorySize(uploadDir);
    return { total: used, used };
  }
}
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    let ext = path.extname(file.originalname);
    if (!ext) {
      const map = { 'image/jpeg': '.jpg', 'image/png': '.png' };
      ext = map[file.mimetype] || '';
    }
    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function extractParameters(imagePath) {
  const buf = fs.readFileSync(imagePath);
  let offset = 8; // skip PNG signature
  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if ((type === 'tEXt' || type === 'iTXt') && length > 0) {
      const data = buf.slice(offset + 8, offset + 8 + length);
      const nullIdx = data.indexOf(0);
      if (nullIdx !== -1) {
        const keyword = data.slice(0, nullIdx).toString();
        let text = data.slice(nullIdx + 1).toString();
        if (type === 'iTXt') {
          // iTXt has extra fields separated by null bytes
          const parts = text.split('\u0000');
          text = parts.pop();
        }
        if (keyword.toLowerCase() === 'parameters') {
          return text;
        }
      }
    }
    offset += 12 + length;
  }
  return '';
}

function parsePrompt(params) {
  const m = /Prompt:(.*?)(?:Negative prompt:|$)/i.exec(params);
  if (!m) return '';
  return m[1].trim().replace(/^"|"$/g, '');
}

function toTags(prompt) {
  return prompt
    .split(',')
    .map((t) =>
      t
        .trim()
        .replace(/^"|"$/g, '')
        .toLowerCase()
    )
    .filter((t) => t && t !== 'raw');
}

function extractLoras(meta) {
  const names = new Set();
  const angle = /<lora:([^:>]+)(?::[\d.]+)?>/gi;
  let m;
  while ((m = angle.exec(meta))) {
    names.add(m[1]);
  }
  const plain = /\b[Ll]ora:([^,\n]+)(?::[\d.]+)?/g;
  while ((m = plain.exec(meta))) {
    names.add(m[1].trim());
  }
  const hashMatch = /Lora hashes?:\s*("([^"]+)"|[^\n]+)/i.exec(meta);
  if (hashMatch) {
    let list = hashMatch[2] || hashMatch[1];
    list = list.replace(/^"|"$/g, '');
    list.split(',').forEach((entry) => {
      const [name] = entry.split(':');
      if (name) names.add(name.trim());
    });
  }
  return Array.from(names);
}

function parseMetadata(meta) {
  const m = {
    model: /Model:(.*?)(?:,|$)/i,
    seed: /Seed:\s*(\d+)/i,
    steps: /Steps:\s*(\d+)/i,
    cfg: /CFG scale:\s*([\d.]+)/i,
    sampler: /Sampler:(.*?)(?:,|$)/i,
    size: /Size:\s*(\d+)x(\d+)/i,
  };
  const res = {};
  if (m.model.test(meta)) res.model = m.model.exec(meta)[1].trim();
  if (m.seed.test(meta)) res.seed = parseInt(m.seed.exec(meta)[1], 10);
  if (m.steps.test(meta)) res.steps = parseInt(m.steps.exec(meta)[1], 10);
  if (m.cfg.test(meta)) res.cfg = parseFloat(m.cfg.exec(meta)[1]);
  if (m.sampler.test(meta)) res.sampler = m.sampler.exec(meta)[1].trim();
  if (m.size.test(meta)) {
    const [, w, h] = m.size.exec(meta);
    res.width = parseInt(w, 10);
    res.height = parseInt(h, 10);
  }
  const neg = /Negative prompt:(.*?)(Steps:|$)/i.exec(meta);
  if (neg) res.negativePrompt = neg[1].trim();
  const prompt = /Prompt:(.*?)(Negative prompt:|Steps:|$)/i.exec(meta);
  if (prompt) res.prompt = prompt[1].trim();
  res.hasLora = /lora/i.test(meta);
  res.hasControl = /controlnet/i.test(meta);
  res.loras = extractLoras(meta);
  return res;
}

app.post('/api/upload', upload.array('images'), (req, res) => {
  const files = req.files || [];
  if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

  const stmt = db.prepare(
    'INSERT INTO images (filename, prompt, tags, metadata, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))'
  );
  files.forEach((file) => {
    const metaString = extractParameters(file.path);
    const prompt = parsePrompt(metaString);
    const tags = toTags(prompt).join(',');
    stmt.run(path.basename(file.path), prompt, tags, metaString);
  });

  res.json({ success: true, count: files.length });
});

app.get('/api/images', (req, res) => {
  const {
    tag,
    model,
    offset = 0,
    limit = 50,
    lora,
    loraName,
    width,
    height,
    year,
    month,
    sort = 'date_desc'
  } = req.query;
  const conditions = [];
  const params = [];
  if (tag) {
    conditions.push('tags LIKE ?');
    params.push(`%${tag.toLowerCase()}%`);
  }
  if (model) {
    conditions.push('metadata LIKE ?');
    params.push(`%${model}%`);
  }
  if (lora === 'true') {
    conditions.push('metadata LIKE ?');
    params.push('%lora%');
  }
  if (loraName) {
    conditions.push('metadata LIKE ?');
    params.push(`%${loraName}%`);
  }
  if (width && height) {
    conditions.push('metadata LIKE ?');
    params.push(`%${width}x${height}%`);
  }
  if (year) {
    conditions.push("strftime('%Y', created_at) = ?");
    params.push(String(year));
  }
  if (month) {
    conditions.push("strftime('%m', created_at) = ?");
    params.push(String(month).padStart(2, '0'));
  }
  let query = 'SELECT * FROM images';
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');

  let orderClause = 'ORDER BY created_at DESC';
  if (sort === 'date_asc') orderClause = 'ORDER BY created_at ASC';
  else if (sort === 'trigger_asc') {
    orderClause =
      "ORDER BY LOWER(CASE WHEN instr(tags, ',')>0 THEN substr(tags,1,instr(tags,',')-1) ELSE tags END) ASC";
  }
  query += ` ${orderClause} LIMIT ? OFFSET ?`;
  params.push(Number(limit));
  params.push(Number(offset));
  const rows = db.prepare(query).all(...params);

  const images = rows.map((r) => {
    const meta = parseMetadata(r.metadata || '');
    const tagSource =
      r.tags && r.tags.includes(',') ? r.tags : r.prompt || r.tags || '';
    return {
      id: r.id,
      url: `/images/${r.filename}`,
      prompt: meta.prompt || r.prompt,
      tags: toTags(tagSource),
      metadata: r.metadata,
      model: meta.model,
      seed: meta.seed,
      width: meta.width,
      height: meta.height,
      hasLora: meta.hasLora,
      loras: meta.loras
    };
  });
  res.json(images);
});

// Aggregate tag counts for tag cloud
app.get('/api/tags', (_req, res) => {
  const rows = db.prepare('SELECT tags, prompt FROM images').all();
  const counts = {};
  rows.forEach((r) => {
    const source =
      r.tags && r.tags.includes(',') ? r.tags : r.prompt || r.tags || '';
    const tagList = toTags(source);
    tagList.forEach((t) => {
      if (t) counts[t] = (counts[t] || 0) + 1;
    });
  });
  const tags = Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  res.json(tags);
});

// List unique models for filter UI
app.get('/api/models', (_req, res) => {
  const rows = db.prepare('SELECT metadata FROM images').all();
  const models = new Set();
  rows.forEach((r) => {
    const meta = parseMetadata(r.metadata || '');
    if (meta.model) models.add(meta.model);
  });
  res.json(Array.from(models).sort());
});

// List unique LoRAs for filter UI
app.get('/api/loras', (_req, res) => {
  const rows = db.prepare('SELECT metadata FROM images').all();
  const loras = new Set();
  rows.forEach((r) => {
    const meta = parseMetadata(r.metadata || '');
    if (meta.loras) meta.loras.forEach((l) => loras.add(l));
  });
  res.json(Array.from(loras).sort());
});

// List unique resolutions for filter UI
app.get('/api/resolutions', (_req, res) => {
  const rows = db.prepare('SELECT metadata FROM images').all();
  const resolutions = new Set();
  rows.forEach((r) => {
    const meta = parseMetadata(r.metadata || '');
    if (meta.width && meta.height) {
      resolutions.add(`${meta.width}x${meta.height}`);
    }
  });
  const list = Array.from(resolutions).sort((a, b) => {
    const [aw, ah] = a.split('x').map(Number);
    const [bw, bh] = b.split('x').map(Number);
    return aw * ah - bw * bh;
  });
  res.json(list);
});

// List unique years for creation date filter
app.get('/api/years', (_req, res) => {
  const rows = db.prepare("SELECT DISTINCT strftime('%Y', created_at) AS y FROM images ORDER BY y DESC").all();
  res.json(rows.map((r) => r.y));
});

// Basic statistics for dashboard
app.get('/api/stats', (_req, res) => {
  const imgCount = db.prepare('SELECT COUNT(*) AS count FROM images').get().count;
  const rows = db.prepare('SELECT tags, prompt, metadata FROM images').all();
  const tagCounts = {};
  const triggerCounts = {};
  const models = new Set();
  const loras = new Set();
  rows.forEach((r) => {
    const src = r.tags && r.tags.includes(',') ? r.tags : r.prompt || r.tags || '';
    const list = toTags(src);
    list.forEach((t, i) => {
      if (t) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
        if (i === 0) triggerCounts[t] = (triggerCounts[t] || 0) + 1;
      }
    });
    const meta = parseMetadata(r.metadata || '');
    if (meta.model) models.add(meta.model);
    if (meta.loras) meta.loras.forEach((l) => loras.add(l));
  });
  const totalTags = Object.keys(tagCounts).length;
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
  const loraList = Array.from(loras).sort();
  const storage = getStorageStats();
  storage.images = getDirectorySize(uploadDir);
  res.json({
    images: imgCount,
    tags: totalTags,
    models: models.size,
    topTags,
    topTriggers,
    loras: loraList,
    storage
  });
});

// Remove a single image by id
app.delete('/api/images/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) return res.status(400).json({ error: 'Invalid id' });
  const row = db.prepare('SELECT filename FROM images WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const filePath = path.join(uploadDir, row.filename);
  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    // ignore missing files
  }
  db.prepare('DELETE FROM images WHERE id = ?').run(id);
  res.json({ success: true });
});

// Bulk removal endpoint
app.post('/api/images/delete', (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (!ids.length) return res.status(400).json({ error: 'No ids provided' });
  const getStmt = db.prepare('SELECT filename FROM images WHERE id = ?');
  const delStmt = db.prepare('DELETE FROM images WHERE id = ?');
  ids.forEach((id) => {
    const row = getStmt.get(id);
    if (row) {
      const filePath = path.join(uploadDir, row.filename);
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        // ignore
      }
      delStmt.run(id);
    }
  });
  res.json({ success: true, count: ids.length });
});

app.listen(PORT, () => {
  console.log(`VisionVault server running on port ${PORT}`);
});
