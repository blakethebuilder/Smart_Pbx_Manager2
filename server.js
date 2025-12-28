import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import axios from 'axios';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Simple in-memory storage for PBX instances
let pbxInstances = [];

// Load PBX data from file if it exists
const dataFile = 'pbx-data.json';
if (fs.existsSync(dataFile)) {
    try {
        const data = fs.readFileSync(dataFile, 'utf8');
        pbxInstances = JSON.parse(data);
        console.log(`📊 Loaded ${pbxInstances.length} PBX instances`);
    } catch (error) {
        console.log('📊 Starting with empty PBX list');
        pbxInstances = [];
    }
}

// Save PBX data to file
function savePBXData() {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(pbxInstances, null, 2));
    } catch (error) {
        console.error('❌ Failed to save PBX data:', error.message);
    }
}

// API Routes
app.get('/api/pbx', (req, res) => {
    res.json(pbxInstances.map(pbx => ({
        id: pbx.id,
        name: pbx.name,
        url: pbx.url,
        status: pbx.status || 'unknown',
        lastCheck: pbx.lastCheck
    })));
});

app.post('/api/pbx', (req, res) => {
    const { name, url, appId, appSecret } = req.body;
    
    if (!name || !url || !appId || !appSecret) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newPBX = {
        id: Date.now().toString(),
        name,
        url,
        appId,
        appSecret,
        status: 'unknown',
        lastCheck: null,
        createdAt: new Date().toISOString()
    };

    pbxInstances.push(newPBX);
    savePBXData();
    
    res.json({ success: true, pbx: newPBX });
});

app.delete('/api/pbx/:id', (req, res) => {
    const { id } = req.params;
    const index = pbxInstances.findIndex(pbx => pbx.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'PBX not found' });
    }

    pbxInstances.splice(index, 1);
    savePBXData();
    
    res.json({ success: true });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        pbxCount: pbxInstances.length
    });
});

// Simple PBX health check function
async function checkPBXHealth(pbx) {
    try {
        // Try to get a token first
        const tokenResponse = await axios.post(`${pbx.url}/api/v2.0.0/token`, {
            client_id: pbx.appId,
            client_secret: pbx.appSecret
        }, {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' }
        });

        if (!tokenResponse.data || !tokenResponse.data.access_token) {
            throw new Error('No access token received');
        }

        const token = tokenResponse.data.access_token;

        // Get basic system info
        const systemResponse = await axios.get(`${pbx.url}/api/v2.0.0/system/info`, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 10000
        });

        return {
            status: 'healthy',
            connected: true,
            systemInfo: systemResponse.data,
            lastCheck: new Date().toISOString()
        };

    } catch (error) {
        return {
            status: 'error',
            connected: false,
            error: error.message,
            lastCheck: new Date().toISOString()
        };
    }
}

// Check all PBX instances
async function checkAllPBX() {
    if (pbxInstances.length === 0) {
        console.log('📊 No PBX instances to check');
        return;
    }

    console.log(`📊 Checking ${pbxInstances.length} PBX instances...`);

    for (const pbx of pbxInstances) {
        try {
            const health = await checkPBXHealth(pbx);
            pbx.status = health.status;
            pbx.lastCheck = health.lastCheck;
            pbx.health = health;
            
            console.log(`  ${pbx.name}: ${health.status}`);
        } catch (error) {
            pbx.status = 'error';
            pbx.lastCheck = new Date().toISOString();
            console.log(`  ${pbx.name}: error - ${error.message}`);
        }
    }

    // Save updated data
    savePBXData();

    // Broadcast to all connected clients
    io.emit('pbx-update', pbxInstances.map(pbx => ({
        id: pbx.id,
        name: pbx.name,
        url: pbx.url,
        status: pbx.status,
        lastCheck: pbx.lastCheck,
        health: pbx.health
    })));

    console.log('📡 Broadcasted update to all clients');
}

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Send current data to new client
    socket.emit('pbx-update', pbxInstances.map(pbx => ({
        id: pbx.id,
        name: pbx.name,
        url: pbx.url,
        status: pbx.status,
        lastCheck: pbx.lastCheck,
        health: pbx.health
    })));

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Check PBX health every 2 minutes
cron.schedule('*/2 * * * *', checkAllPBX);

// Initial check after 10 seconds
setTimeout(checkAllPBX, 10000);

// Start server
server.listen(PORT, () => {
    console.log(`\n🚀 MSP PBX Dashboard - SIMPLE VERSION`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Dashboard:  http://localhost:${PORT}`);
    console.log(`🔌 Socket.io:  Connected`);
    console.log(`🔄 Health Check: Every 2 minutes`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});