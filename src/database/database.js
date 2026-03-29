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
    
    // PBX instances table
    db.exec(`
        CREATE TABLE IF NOT EXISTS pbx_instances (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            app_id TEXT,
            app_secret TEXT,
            is_shared BOOLEAN DEFAULT 0,
            status TEXT DEFAULT 'pending',
            last_check DATETIME,
            health_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Health check history table
    db.exec(`
        CREATE TABLE IF NOT EXISTS health_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pbx_id TEXT NOT NULL,
            status TEXT NOT NULL,
            response_time INTEGER,
            error_message TEXT,
            extensions_count INTEGER,
            trunks_count INTEGER,
            checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (pbx_id) REFERENCES pbx_instances (id) ON DELETE CASCADE
        )
    `);

    // API rate limiting table
    db.exec(`
        CREATE TABLE IF NOT EXISTS api_rate_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pbx_url TEXT NOT NULL,
            api_calls INTEGER DEFAULT 0,
            window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(pbx_url)
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
        CREATE INDEX IF NOT EXISTS idx_pbx_status ON pbx_instances(status);
        CREATE INDEX IF NOT EXISTS idx_health_pbx_id ON health_history(pbx_id);
        CREATE INDEX IF NOT EXISTS idx_health_checked_at ON health_history(checked_at);
        CREATE INDEX IF NOT EXISTS idx_rate_limit_url ON api_rate_limits(pbx_url);
        CREATE INDEX IF NOT EXISTS idx_notes_pbx_id ON pbx_notes(pbx_id);
        CREATE INDEX IF NOT EXISTS idx_notes_created_at ON pbx_notes(created_at);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Initialize prepared statements after tables are created
    statements = {
        // PBX instances
        insertPBX: db.prepare(`
            INSERT INTO pbx_instances (id, name, url, app_id, app_secret, is_shared)
            VALUES (?, ?, ?, ?, ?, ?)
        `),
        
        updatePBX: db.prepare(`
            UPDATE pbx_instances 
            SET name = ?, url = ?, app_id = ?, app_secret = ?, is_shared = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `),
        
        updatePBXHealth: db.prepare(`
            UPDATE pbx_instances 
            SET status = ?, last_check = CURRENT_TIMESTAMP, health_data = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `),
        
        deletePBX: db.prepare(`DELETE FROM pbx_instances WHERE id = ?`),
        
        getPBXById: db.prepare(`SELECT * FROM pbx_instances WHERE id = ?`),
        
        getAllPBX: db.prepare(`SELECT * FROM pbx_instances ORDER BY name`),
        
        // Health history
        insertHealthCheck: db.prepare(`
            INSERT INTO health_history (pbx_id, status, response_time, error_message, extensions_count, trunks_count)
            VALUES (?, ?, ?, ?, ?, ?)
        `),
        
        getHealthHistory: db.prepare(`
            SELECT * FROM health_history 
            WHERE pbx_id = ? 
            ORDER BY checked_at DESC 
            LIMIT ?
        `),
        
        // Rate limiting
        upsertRateLimit: db.prepare(`
            INSERT INTO api_rate_limits (pbx_url, api_calls, window_start)
            VALUES (?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(pbx_url) DO UPDATE SET
                api_calls = CASE 
                    WHEN datetime('now', '-30 minutes') > window_start 
                    THEN 1 
                    ELSE api_calls + 1 
                END,
                window_start = CASE 
                    WHEN datetime('now', '-30 minutes') > window_start 
                    THEN CURRENT_TIMESTAMP 
                    ELSE window_start 
                END
        `),
        
        getRateLimit: db.prepare(`
            SELECT api_calls, window_start 
            FROM api_rate_limits 
            WHERE pbx_url = ? AND datetime('now', '-30 minutes') <= window_start
        `),
        
        // Cleanup old data
        cleanupOldHealthHistory: db.prepare(`
            DELETE FROM health_history 
            WHERE checked_at < datetime('now', '-30 days')
        `),
        
        cleanupOldRateLimits: db.prepare(`
            DELETE FROM api_rate_limits 
            WHERE window_start < datetime('now', '-1 hour')
        `),

        // Notes operations
        insertNote: db.prepare(`
            INSERT INTO pbx_notes (id, pbx_id, content, author, priority)
            VALUES (?, ?, ?, ?, ?)
        `),
        
        updateNote: db.prepare(`
            UPDATE pbx_notes 
            SET content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND pbx_id = ?
        `),
        
        deleteNote: db.prepare(`
            DELETE FROM pbx_notes 
            WHERE id = ? AND pbx_id = ?
        `),
        
        getNotesByPBX: db.prepare(`
            SELECT * FROM pbx_notes 
            WHERE pbx_id = ? 
            ORDER BY created_at DESC
        `),
        
        getAllNotes: db.prepare(`
            SELECT n.*, p.name as pbx_name 
            FROM pbx_notes n 
            JOIN pbx_instances p ON n.pbx_id = p.id 
            ORDER BY n.created_at DESC
        `),

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
};

// Database operations
export const dbOperations = {
    // Initialize database
    init: initDatabase,
    
    // PBX operations
    createPBX: (pbx) => {
        return statements.insertPBX.run(
            pbx.id, pbx.name, pbx.url, pbx.appId, pbx.appSecret, pbx.isShared ? 1 : 0
        );
    },
    
    updatePBX: (id, pbx) => {
        return statements.updatePBX.run(
            pbx.name, pbx.url, pbx.appId, pbx.appSecret, pbx.isShared ? 1 : 0, id
        );
    },
    
    updatePBXHealth: (id, status, healthData) => {
        return statements.updatePBXHealth.run(status, JSON.stringify(healthData), id);
    },
    
    deletePBX: (id) => {
        return statements.deletePBX.run(id);
    },
    
    getPBXById: (id) => {
        const row = statements.getPBXById.get(id);
        if (row) {
            // Map database fields to application fields
            const pbx = {
                id: row.id,
                name: row.name,
                url: row.url,
                appId: row.app_id,
                appSecret: row.app_secret,
                isShared: Boolean(row.is_shared),
                status: row.status,
                lastCheck: row.last_check,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
            
            if (row.health_data) {
                try {
                    pbx.health = JSON.parse(row.health_data);
                } catch (e) {
                    pbx.health = {};
                }
            }
            
            return pbx;
        }
        return null;
    },
    
    getAllPBX: () => {
        const rows = statements.getAllPBX.all();
        return rows.map(row => {
            // Map database fields to application fields
            const pbx = {
                id: row.id,
                name: row.name,
                url: row.url,
                appId: row.app_id,
                appSecret: row.app_secret,
                isShared: Boolean(row.is_shared),
                status: row.status,
                lastCheck: row.last_check,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
            
            if (row.health_data) {
                try {
                    pbx.health = JSON.parse(row.health_data);
                } catch (e) {
                    pbx.health = {};
                }
            }

            // Add notes for this PBX
            pbx.notes = dbOperations.getNotesByPBX(row.id);
            
            return pbx;
        });
    },
    
    // Health history operations
    recordHealthCheck: (pbxId, status, responseTime, errorMessage, extensionsCount, trunksCount) => {
        return statements.insertHealthCheck.run(
            pbxId, status, responseTime, errorMessage, extensionsCount, trunksCount
        );
    },
    
    getHealthHistory: (pbxId, limit = 50) => {
        return statements.getHealthHistory.all(pbxId, limit);
    },
    
    // Rate limiting operations
    recordAPICall: (pbxUrl) => {
        return statements.upsertRateLimit.run(pbxUrl);
    },
    
    getRateLimit: (pbxUrl) => {
        return statements.getRateLimit.get(pbxUrl);
    },
    
    // Maintenance operations
    cleanup: () => {
        const healthDeleted = statements.cleanupOldHealthHistory.run();
        const rateLimitDeleted = statements.cleanupOldRateLimits.run();
        console.log(`🧹 Cleanup: Removed ${healthDeleted.changes} old health records, ${rateLimitDeleted.changes} old rate limits`);
    },
    
    // Migration from JSON file
    migrateFromJSON: (jsonData) => {
        const transaction = db.transaction((data) => {
            for (const pbx of data) {
                try {
                    statements.insertPBX.run(
                        pbx.id, pbx.name, pbx.url, pbx.appId, pbx.appSecret, pbx.isShared ? 1 : 0
                    );
                    
                    if (pbx.status && pbx.health) {
                        statements.updatePBXHealth.run(pbx.id, pbx.status, JSON.stringify(pbx.health));
                    }
                } catch (error) {
                    if (!error.message.includes('UNIQUE constraint failed')) {
                        console.error(`Error migrating PBX ${pbx.name}:`, error.message);
                    }
                }
            }
        });
        
        transaction(jsonData);
        console.log(`📦 Migrated ${jsonData.length} PBX instances to database`);
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
};

// Export database instance for advanced operations
export { db };

// Note: Database initialization is called explicitly in server.js
