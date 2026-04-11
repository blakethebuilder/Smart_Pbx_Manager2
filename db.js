const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

// SQLite DB lives under /app/data/pbx-dashboard.db in Docker containers
const DB_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DB_DIR, 'pbx-dashboard.db')

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

const db = new Database(DB_FILE)

function init() {
  // Ensure foreign keys are enforced
  db.exec('PRAGMA foreign_keys = ON')

  // Clients table: one row per client
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Services table: one-to-many relation to clients; data stored as JSON string
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `)
}

module.exports = { db, init }
