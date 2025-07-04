const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new Database(path.join(__dirname, '..', 'visionvault.db'));
db.prepare(`CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  prompt TEXT,
  tags TEXT,
  metadata TEXT
)`)
  .run();

// File upload configuration
const uploadDir = path.join(__dirname, '..', 'public', 'images');
const upload = multer({ dest: uploadDir });

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
  return m ? m[1].trim() : '';
}

function toTags(prompt) {
  return prompt
    .split(/[ ,]+/)
    .map((t) => t.toLowerCase())
    .filter((t) => t);
}

app.post('/api/upload', upload.single('image'), (req, res) => {
  const { file } = req;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const metaString = extractParameters(file.path);
  const prompt = parsePrompt(metaString);
  const tags = toTags(prompt).join(',');

  db.prepare(
    'INSERT INTO images (filename, prompt, tags, metadata) VALUES (?, ?, ?, ?)'
  ).run(path.basename(file.path), prompt, tags, metaString);

  res.json({ success: true });
});

app.get('/api/images', (req, res) => {
  const { tag } = req.query;
  let rows;
  if (tag) {
    rows = db
      .prepare('SELECT * FROM images WHERE tags LIKE ? ORDER BY id DESC')
      .all(`%${tag.toLowerCase()}%`);
  } else {
    rows = db.prepare('SELECT * FROM images ORDER BY id DESC').all();
  }

  const images = rows.map((r) => ({
    id: r.id,
    url: `/images/${r.filename}`,
    prompt: r.prompt,
    tags: r.tags ? r.tags.split(',') : [],
    metadata: r.metadata,
  }));
  res.json(images);
});

app.listen(PORT, () => {
  console.log(`VisionVault server running on port ${PORT}`);
});
