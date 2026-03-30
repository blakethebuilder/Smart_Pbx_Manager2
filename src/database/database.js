import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcrypt';

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

const normalizeTagsInput = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map(tag => String(tag).trim())
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed
                    .map(tag => String(tag).trim())
                    .filter(Boolean);
            }
        } catch (error) {
            // ignore JSON parse errors, fallback to CSV parsing
        }
        return trimmed
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean);
    }
    return [];
};

const serializeTags = (value) => {
    const normalized = normalizeTagsInput(value);
    return normalized.length ? JSON.stringify(normalized) : null;
};

const formatPBXRow = (row) => {
    if (!row) return null;
    const tags = normalizeTagsInput(row.tags);
    const extensionCount = row.extension_count !== null && row.extension_count !== undefined
        ? Number(row.extension_count)
        : null;

    return {
        id: row.id,
        name: row.name,
        url: row.url,
        tags,
        nickname: row.nickname || '',
        extensionCount,
        siteInfo: row.site_info || '',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
};

// Create tables
const initDatabase = () => {
    console.log('🗄️ Initializing SQLite database...');
    
    // PBX instances table (Simplified for hotlinks)
    db.exec(`
        CREATE TABLE IF NOT EXISTS pbx_instances (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            tags TEXT,
            nickname TEXT,
            extension_count INTEGER,
            site_info TEXT,
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
            password TEXT NOT NULL,
            role TEXT DEFAULT 'tech', -- 'admin' or 'tech'
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Schema migrations for existing installations
    const pbxTableInfo = db.prepare("PRAGMA table_info(pbx_instances)").all();
    const pbxColumns = new Set(pbxTableInfo.map(col => col.name));
    if (!pbxColumns.has('tags')) {
        console.log('📦 Migrating pbx_instances table: adding tags column...');
        db.exec("ALTER TABLE pbx_instances ADD COLUMN tags TEXT");
    }
    if (!pbxColumns.has('nickname')) {
        console.log('📦 Migrating pbx_instances table: adding nickname column...');
        db.exec("ALTER TABLE pbx_instances ADD COLUMN nickname TEXT");
    }
    if (!pbxColumns.has('extension_count')) {
        console.log('📦 Migrating pbx_instances table: adding extension_count column...');
        db.exec("ALTER TABLE pbx_instances ADD COLUMN extension_count INTEGER DEFAULT 0");
    }
    if (!pbxColumns.has('site_info')) {
        console.log('📦 Migrating pbx_instances table: adding site_info column...');
        db.exec("ALTER TABLE pbx_instances ADD COLUMN site_info TEXT");
    }

    let usersTableInfo = db.prepare("PRAGMA table_info(users)").all();
    let userColumns = new Set(usersTableInfo.map(col => col.name));
    if (!userColumns.has('password')) {
        console.log('📦 Migrating users table: adding password column...');
        db.exec("ALTER TABLE users ADD COLUMN password TEXT");
        db.exec("UPDATE users SET password = '' WHERE password IS NULL");
    }
    if (!userColumns.has('role')) {
        console.log('📦 Migrating users table: adding role column...');
        db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'tech'");
        db.exec("UPDATE users SET role = 'tech' WHERE role IS NULL OR role = ''");
    }

    // Refresh metadata after migrations
    usersTableInfo = db.prepare("PRAGMA table_info(users)").all();
    userColumns = new Set(usersTableInfo.map(col => col.name));
    if (!userColumns.has('password')) {
        throw new Error('Users table migration failed: missing password column');
    }

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
            insertPBX: db.prepare(`INSERT INTO pbx_instances (id, name, url, tags, nickname, extension_count, site_info) VALUES (?, ?, ?, ?, ?, ?, ?)`),
            updatePBX: db.prepare(`UPDATE pbx_instances SET name = ?, url = ?, tags = ?, nickname = ?, extension_count = ?, site_info = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`),
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
            insertUser: db.prepare(`INSERT OR IGNORE INTO users (id, username, password, role) VALUES (?, ?, ?, ?)`),
            getUserByUsername: db.prepare(`SELECT * FROM users WHERE username = ?`),
            getAllUsers: db.prepare(`SELECT * FROM users ORDER BY username ASC`),
            deleteUser: db.prepare(`DELETE FROM users WHERE id = ?`),
        };

        const ensureDefaultAdminUser = () => {
            const defaultUsername = (process.env.DEFAULT_ADMIN_USERNAME || 'blakeAdmin').trim();
            const masterPassword = (process.env.MASTER_PASSWORD || '').trim();
            const passwordIsPlaceholder = masterPassword === '' || masterPassword === 'CHANGE_ME_IN_PRODUCTION';
            const activePassword = passwordIsPlaceholder ? 'admin' : masterPassword;

            if (passwordIsPlaceholder) {
                console.warn('⚠️ MASTER_PASSWORD is not set or is using the default placeholder. Update it for production deployments.');
            }

            const existingAdmin = statements.getUserByUsername.get(defaultUsername);

            const updateAdminCredentials = (id) => {
                const hashedPassword = bcrypt.hashSync(activePassword, 10);
                db.prepare(`UPDATE users SET password = ?, role = 'admin' WHERE id = ?`).run(hashedPassword, id);
                return hashedPassword;
            };

            if (!existingAdmin) {
                const hashedPassword = bcrypt.hashSync(activePassword, 10);
                statements.insertUser.run('admin-id-1', defaultUsername, hashedPassword, 'admin');
                console.log(`✅ Default admin user created (username: ${defaultUsername}).`);
                return;
            }

            let passwordNeedsUpdate = false;
            if (!existingAdmin.password || existingAdmin.password.length < 10 || !existingAdmin.password.startsWith('$2')) {
                passwordNeedsUpdate = true;
            } else if (!passwordIsPlaceholder) {
                try {
                    if (!bcrypt.compareSync(activePassword, existingAdmin.password)) {
                        passwordNeedsUpdate = true;
                    }
                } catch (error) {
                    console.warn('⚠️ Unable to verify existing admin password hash, refreshing it.');
                    passwordNeedsUpdate = true;
                }
            }

            if (passwordNeedsUpdate) {
                updateAdminCredentials(existingAdmin.id);
                console.log(`🔄 Admin password hash refreshed for user '${defaultUsername}'.`);
            } else if (existingAdmin.role !== 'admin') {
                db.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(existingAdmin.id);
            }
        };

        ensureDefaultAdminUser();
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
        return statements.insertPBX.run(
            pbx.id,
            pbx.name,
            pbx.url,
            serializeTags(pbx.tags),
            pbx.nickname || null,
            typeof pbx.extensionCount === 'number' ? pbx.extensionCount : null,
            pbx.siteInfo || null
        );
    },
    
    updatePBX: (id, pbx) => {
        return statements.updatePBX.run(
            pbx.name,
            pbx.url,
            serializeTags(pbx.tags),
            pbx.nickname || null,
            typeof pbx.extensionCount === 'number' ? pbx.extensionCount : null,
            pbx.siteInfo || null,
            id
        );
    },
    
    deletePBX: (id) => {
        return statements.deletePBX.run(id);
    },
    
    getPBXById: (id) => {
        const row = statements.getPBXById.get(id);
        if (!row) return null;
        const pbx = formatPBXRow(row);
        pbx.notes = dbOperations.getNotesByPBX(id);
        return pbx;
    },
    
    getAllPBX: () => {
        const rows = statements.getAllPBX.all();
        return rows.map(row => {
            const pbx = formatPBXRow(row);
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
    createUser: (user) => {
        return statements.insertUser.run(user.id, user.username, user.password, user.role);
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
