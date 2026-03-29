import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import cron from 'node-cron';
import dotenv from 'dotenv';

// Import services
import { dbOperations } from './src/database/database.js';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import pbxRoutes from './src/routes/pbxRoutes.js';
import notesRoutes from './src/routes/notesRoutes.js';
import announcementsRoutes from './src/routes/announcementsRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8547;
const server = createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    } 
});

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/health', (req, res) => res.status(200).send('OK'));
app.use('/api', authRoutes);
app.use('/api/pbx', pbxRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/announcements', announcementsRoutes);

// Make Socket.io available to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Send current PBX data to new client
    try {
        const pbxInstances = dbOperations.getAllPBX();
        socket.emit('pbx-update', pbxInstances);
    } catch (error) {
        console.error('❌ Failed to send initial data to client:', error.message);
    }
    
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and migrate from JSON if needed
async function initializePBXData() {
    try {
        dbOperations.init();
        console.log('✅ Database initialized successfully.');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error.message);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

// Start server with database initialization
server.listen(PORT, async () => {
    console.log(`\n🚀 MSP Link Manager - v3.0 (Simplified)`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✓ Dashboard:  http://localhost:${PORT}`);
    console.log(`✓ Socket.io:  Connected`);
    console.log(`✓ Database:   SQLite`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    // Initialize database
    await initializePBXData();
    
    console.log('🎯 Server ready.');
});

export { io };