import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const DB_PATH = path.join(process.cwd(), 'data', 'pbx-dashboard.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Prepared statements - will be initialized after tables are created
let statements = {};

// Create tables
const initDatabase = () => {
    console.log('🗄️ Initializing SQLite database...');
    
    // Check if migration is needed for pbx_instances
    const tableInfo = db.prepare("PRAGMA table_info(pbx_instances)").all();
    if (tableInfo.length > 0) {
        const hasTags = tableInfo.some(col => col.name === 'tags');
        if (!hasTags) {
            console.log('📦 Migrating pbx_instances table: adding tags column...');
            db.exec("ALTER TABLE pbx_instances ADD COLUMN tags TEXT");
        }
    }

    // PBX instances table (Simplified for hotlinks)
    db.exec(`
        CREATE TABLE IF NOT EXISTS pbx_instances (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Notes table
    db.exec(`
        CREATE TABLE IF NOT EXISTS pbx_notes (
            id TEXT PRIMARY KEY,
            pbx_id TEXT NOT NULL,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            priority TEXT DEFAULT 'medium',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pbx_id) REFERENCES pbx_instances (id) ON DELETE CASCADE
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS announcements (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            author TEXT NOT NULL,
            pinned INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Users table for multi-tech support and admin
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            role TEXT DEFAULT 'tech', -- 'admin' or 'tech'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create indexes for better performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_notes_pbx_id ON pbx_notes(pbx_id);
        CREATE INDEX IF NOT EXISTS idx_notes_created_at ON pbx_notes(created_at);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Initialize prepared statements after tables are created
    try {
        statements = {
            // PBX instances
            insertPBX: db.prepare(`INSERT INTO pbx_instances (id, name, url, tags) VALUES (?, ?, ?, ?)`),
            updatePBX: db.prepare(`UPDATE pbx_instances SET name = ?, url = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`),
            deletePBX: db.prepare(`DELETE FROM pbx_instances WHERE id = ?`),
            getPBXById: db.prepare(`SELECT * FROM pbx_instances WHERE id = ?`),
            getAllPBX: db.prepare(`SELECT * FROM pbx_instances ORDER BY name ASC`),

            // Notes operations
            insertNote: db.prepare(`INSERT INTO pbx_notes (id, pbx_id, content, author, priority) VALUES (?, ?, ?, ?, ?)`),
            updateNote: db.prepare(`UPDATE pbx_notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND pbx_id = ?`),
            deleteNote: db.prepare(`DELETE FROM pbx_notes WHERE id = ? AND pbx_id = ?`),
            getNotesByPBX: db.prepare(`SELECT * FROM pbx_notes WHERE pbx_id = ? ORDER BY created_at DESC`),
            getAllNotes: db.prepare(`SELECT n.*, p.name as pbx_name FROM pbx_notes n JOIN pbx_instances p ON n.pbx_id = p.id ORDER BY n.created_at DESC`),

            // Announcements
            insertAnnouncement: db.prepare(`INSERT INTO announcements (id, content, author, pinned) VALUES (?, ?, ?, ?)`),
            deleteAnnouncement: db.prepare(`DELETE FROM announcements WHERE id = ?`),
            getAllAnnouncements: db.prepare(`SELECT * FROM announcements ORDER BY pinned DESC, created_at DESC`),

            // User management
            insertUser: db.prepare(`INSERT OR IGNORE INTO users (id, username, role) VALUES (?, ?, ?)`),
            getUserByUsername: db.prepare(`SELECT * FROM users WHERE username = ?`),
            getAllUsers: db.prepare(`SELECT * FROM users ORDER BY username ASC`),
            deleteUser: db.prepare(`DELETE FROM users WHERE id = ?`),
        };

        // Create default admin
        statements.insertUser.run('admin-id-1', 'blakeAdmin', 'admin');
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize prepared statements:', error.message);
        throw error;
    }
};

// Database operations
export const dbOperations = {
    // Initialize database
    init: initDatabase,
    
    // PBX operations
    createPBX: (pbx) => {
        return statements.insertPBX.run(pbx.id, pbx.name, pbx.url, pbx.tags);
    },
    
    updatePBX: (id, pbx) => {
        return statements.updatePBX.run(pbx.name, pbx.url, pbx.tags, id);
    },
    
    deletePBX: (id) => {
        return statements.deletePBX.run(id);
    },
    
    getPBXById: (id) => {
        return statements.getPBXById.get(id);
    },
    
    getAllPBX: () => {
        const rows = statements.getAllPBX.all();
        return rows.map(row => {
            const pbx = { ...row };
            try {
                if (pbx.tags) pbx.tags = JSON.parse(pbx.tags);
            } catch (e) { pbx.tags = []; }
            pbx.notes = dbOperations.getNotesByPBX(row.id);
            return pbx;
        });
    },


    // Notes operations
    createNote: (note) => {
        return statements.insertNote.run(
            note.id, note.pbxId, note.content, note.author, note.priority
        );
    },
    
    updateNote: (noteId, pbxId, content) => {
        return statements.updateNote.run(content, noteId, pbxId);
    },
    
    deleteNote: (noteId, pbxId) => {
        return statements.deleteNote.run(noteId, pbxId);
    },
    
    getNotesByPBX: (pbxId) => {
        const rows = statements.getNotesByPBX.all(pbxId);
        return rows.map(row => ({
            id: row.id,
            content: row.content,
            author: row.author,
            priority: row.priority,
            timestamp: row.created_at,
            updatedAt: row.updated_at
        }));
    },
    
    getAllNotes: () => {
        const rows = statements.getAllNotes.all();
        return rows.map(row => ({
            id: row.id,
            pbxId: row.pbx_id,
            pbxName: row.pbx_name,
            content: row.content,
            author: row.author,
            priority: row.priority,
            timestamp: row.created_at,
            updatedAt: row.updated_at
        }));
    },

    // Announcements
    createAnnouncement: ({ id, content, author, pinned }) => {
        return statements.insertAnnouncement.run(id, content, author, pinned);
    },
    deleteAnnouncement: (id) => {
        return statements.deleteAnnouncement.run(id);
    },
    getAllAnnouncements: () => {
        return statements.getAllAnnouncements.all().map(row => ({
            id: row.id,
            content: row.content,
            author: row.author,
            pinned: Boolean(row.pinned),
            createdAt: row.created_at
        }));
    },

    // User operations
    getUserByUsername: (username) => {
        return statements.getUserByUsername.get(username);
    },
    createUser: (id, username, role = 'tech') => {
        return statements.insertUser.run(id, username, role);
    },
    getAllUsers: () => {
        return statements.getAllUsers.all();
    },
    deleteUser: (id) => {
        return statements.deleteUser.run(id);
    },

    // Deduplication
    deduplicatePBX: () => {
        const result = db.exec(`
            DELETE FROM pbx_instances 
            WHERE rowid NOT IN (
                SELECT MIN(rowid) 
                FROM pbx_instances 
                GROUP BY name
            )
        `);
        return result;
    },
};

// Export database instance for advanced operations
export { db };

// Note: Database initialization is called explicitly in server.js
