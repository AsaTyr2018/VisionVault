const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'visionvault.db');
const dbDir = path.dirname(dbPath);
fs.mkdirSync(dbDir, { recursive: true });
const db = new Database(dbPath);

db.prepare(`CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  prompt TEXT,
  tags TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user'
)`).run();

let admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!admin) {
  const bcrypt = require('bcrypt');
  const hash = bcrypt.hashSync('admin', 10);
  const info = db
    .prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run('admin', hash, 'admin');
  admin = { id: info.lastInsertRowid, username: 'admin', role: 'admin' };
}
if (admin) {
  db.prepare('UPDATE images SET user_id = NULL WHERE user_id = ?').run(admin.id);
}

const uploadDir = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(uploadDir, { recursive: true });

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
    .map((t) => t.trim().replace(/^"|"$/g, '').toLowerCase())
    .filter((t) => t && t !== 'raw');
}

function refresh() {
  const files = fs.readdirSync(uploadDir).filter((f) => /\.(png|jpe?g)$/i.test(f));
  const selectStmt = db.prepare('SELECT id, prompt, tags, metadata, created_at FROM images WHERE filename = ?');
  const insertStmt = db.prepare('INSERT INTO images (filename, prompt, tags, metadata, created_at, user_id) VALUES (?, ?, ?, ?, ?, NULL)');
  const updateStmt = db.prepare('UPDATE images SET prompt = ?, tags = ?, metadata = ?, created_at = ? WHERE id = ?');
  let inserted = 0;
  let updated = 0;

  files.forEach((filename) => {
    const filePath = path.join(uploadDir, filename);
    const row = selectStmt.get(filename);
    const metaString = extractParameters(filePath);
    const prompt = parsePrompt(metaString);
    const tags = toTags(prompt).join(',');
    let createdAt;
    try {
      const stats = fs.statSync(filePath);
      const dt = stats.birthtime || stats.mtime;
      createdAt = dt.toISOString().replace('T', ' ').split('.')[0];
    } catch {
      createdAt = new Date().toISOString().replace('T', ' ').split('.')[0];
    }

    if (!row) {
      insertStmt.run(filename, prompt, tags, metaString, createdAt);
      inserted++;
    } else if (!row.prompt || !row.tags || !row.metadata) {
      const newPrompt = row.prompt || prompt;
      const newTags = row.tags || tags;
      const newMeta = row.metadata || metaString;
      const newDate = row.created_at || createdAt;
      updateStmt.run(newPrompt, newTags, newMeta, newDate, row.id);
      updated++;
    }
  });

  console.log(`Refresh complete. Inserted ${inserted} new images. Updated ${updated} images.`);
}

refresh();
