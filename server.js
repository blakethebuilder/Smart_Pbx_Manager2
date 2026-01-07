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
import { migrateToDatabase } from './scripts/migrate-to-database.js';
import { healthCheckService } from './src/services/HealthCheckService.js';
import { tokenService } from './src/services/TokenService.js';
import { sharedPBXService } from './src/services/SharedPBXService.js';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import pbxRoutes from './src/routes/pbxRoutes.js';
import systemRoutes from './src/routes/systemRoutes.js';

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
app.use('/api', authRoutes);
app.use('/api/pbx', pbxRoutes);
app.use('/', systemRoutes);

// Make Socket.io available to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Send current PBX data to new client
    try {
        const pbxInstances = dbOperations.getAllPBX();
        socket.emit('pbx-update', pbxInstances.map(pbx => ({
            id: pbx.id,
            name: pbx.name,
            url: pbx.url,
            appId: pbx.appId,
            appSecret: pbx.appSecret,
            status: pbx.status,
            lastCheck: pbx.last_check,
            health: pbx.health,
            isShared: pbx.isShared
        })));
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
        // Initialize database first
        dbOperations.init();
        
        // Import data from export file if database is empty
        try {
            const { execSync } = await import('child_process');
            execSync('node scripts/import-db-data.js', { stdio: 'inherit' });
        } catch (importError) {
            console.log('📝 Database import completed or not needed');
        }
        
        // Check if we need to migrate from JSON (legacy)
        const dataFile = 'pbx-data.json';
        if (fs.existsSync(dataFile)) {
            console.log('📦 Found existing pbx-data.json, migrating to database...');
            await migrateToDatabase();
        }
        
        console.log('✅ PBX data initialization completed');
        
    } catch (error) {
        console.error('❌ Failed to initialize PBX data:', error.message);
    }
}

// Health check scheduler
async function runHealthChecks() {
    try {
        const pbxInstances = dbOperations.getAllPBX();
        
        if (pbxInstances.length === 0) {
            console.log('📊 No PBX instances to check');
            return;
        }

        console.log(`📊 Starting health check for ${pbxInstances.length} PBX instances...`);
        
        // Run optimized health checks
        await healthCheckService.checkAllPBX(pbxInstances);
        
        // Broadcast updated data to all connected clients
        const updatedInstances = dbOperations.getAllPBX();
        io.emit('pbx-update', updatedInstances.map(pbx => ({
            id: pbx.id,
            name: pbx.name,
            url: pbx.url,
            appId: pbx.appId,
            appSecret: pbx.appSecret,
            status: pbx.status,
            lastCheck: pbx.last_check,
            health: pbx.health,
            isShared: pbx.isShared
        })));
        
        console.log('📡 Broadcasted update to all clients');
        
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

// Maintenance tasks
function runMaintenance() {
    console.log('🧹 Running maintenance tasks...');
    
    // Clean up database
    dbOperations.cleanup();
    
    // Clean up service caches
    tokenService.cleanupExpiredTokens();
    sharedPBXService.cleanupCache();
    
    console.log('✅ Maintenance completed');
}

// Cron jobs
cron.schedule('0 * * * *', runHealthChecks);    // Every 60 minutes (hourly)
cron.schedule('0 2 * * *', runMaintenance);     // Daily at 2 AM
cron.schedule('0 */6 * * *', () => {            // Every 6 hours
    tokenService.cleanupExpiredTokens();
    sharedPBXService.cleanupCache();
});

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
    console.log(`\n🚀 MSP PBX Dashboard - PRODUCTION VERSION v2.0`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Dashboard:  http://localhost:${PORT}`);
    console.log(`🔌 Socket.io:  Connected`);
    console.log(`🗄️ Database:   SQLite (better-sqlite3)`);
    console.log(`🔄 Health Check: Every 60 minutes (optimized for shared servers)`);
    console.log(`⏱️ Rate Limiting: Max 6 API calls per 30 minutes per hostname`);
    console.log(`🏢 Shared Server: Optimized API calls for shared PBX instances`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    
    // Initialize database and load PBX data
    await initializePBXData();
    
    // Initial health check after 2 minutes
    setTimeout(runHealthChecks, 120000);
    
    console.log('🎯 Server ready and monitoring PBX instances');
});

export { io };