import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import axios from 'axios';
import cron from 'node-cron';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DASHBOARD_PASSWORD = process.env.MASTER_PASSWORD || 'Smart@2026!';
const server = createServer(app);
const io = new Server(server, { 
    cors: { 
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"]
    } 
});

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
}));
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
} else {
    // Add dummy data for UI demonstration
    pbxInstances = [
        {
            id: 'demo-1',
            name: 'Main Office PBX',
            url: 'https://main.pbx.yeastar.com',
            appId: 'demo-client-id-1',
            appSecret: 'demo-secret-1',
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            health: {
                status: 'healthy',
                connected: true,
                systemInfo: {
                    extensions: 45,
                    activeCalls: 7,
                    uptime: '15 days',
                    version: 'K2 v2.0.1'
                },
                lastCheck: new Date().toISOString(),
                apiType: 'K2 VoIP PBX v2.0'
            }
        },
        {
            id: 'demo-2',
            name: 'Branch Office PBX',
            url: 'https://branch.pbx.yeastar.com',
            appId: 'demo-client-id-2',
            appSecret: 'demo-secret-2',
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            health: {
                status: 'healthy',
                connected: true,
                systemInfo: {
                    extensions: 28,
                    activeCalls: 4,
                    uptime: '8 days',
                    version: 'K2 v2.0.0'
                },
                lastCheck: new Date().toISOString(),
                apiType: 'K2 VoIP PBX v2.0'
            }
        },
        {
            id: 'demo-3',
            name: 'Client ABC PBX',
            url: 'https://clientabc.pbx.ycmcloud.co.za',
            appId: 'demo-client-id-3',
            appSecret: 'demo-secret-3',
            status: 'error',
            lastCheck: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            health: {
                status: 'error',
                connected: false,
                error: 'Connection timeout - PBX not responding',
                lastCheck: new Date().toISOString()
            }
        },
        {
            id: 'demo-4',
            name: 'Remote Office PBX',
            url: 'https://remote.pbx.yeastar.com',
            appId: 'demo-client-id-4',
            appSecret: 'demo-secret-4',
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            health: {
                status: 'healthy',
                connected: true,
                systemInfo: {
                    extensions: 12,
                    activeCalls: 2,
                    uptime: '3 days',
                    version: 'K2 v1.9.8'
                },
                lastCheck: new Date().toISOString(),
                apiType: 'Standard Yeastar'
            }
        },
        {
            id: 'demo-5',
            name: 'Client XYZ PBX',
            url: 'https://clientxyz.pbx.yeastar.com',
            appId: 'demo-client-id-5',
            appSecret: 'demo-secret-5',
            status: 'unknown',
            lastCheck: null,
            createdAt: new Date().toISOString(),
            health: {
                status: 'unknown',
                connected: false,
                lastCheck: null
            }
        },
        {
            id: 'demo-6',
            name: 'Call Center PBX',
            url: 'https://callcenter.pbx.yeastar.com',
            appId: 'demo-client-id-6',
            appSecret: 'demo-secret-6',
            status: 'healthy',
            lastCheck: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            health: {
                status: 'healthy',
                connected: true,
                systemInfo: {
                    extensions: 85,
                    activeCalls: 23,
                    uptime: '45 days',
                    version: 'K2 v2.0.1'
                },
                lastCheck: new Date().toISOString(),
                apiType: 'K2 VoIP PBX v2.0'
            }
        }
    ];
    
    console.log('📊 Created demo PBX instances for UI testing');
    savePBXData();
}

// Save PBX data to file
function savePBXData() {
    try {
        fs.writeFileSync(dataFile, JSON.stringify(pbxInstances, null, 2));
    } catch (error) {
        console.error('❌ Failed to save PBX data:', error.message);
    }
}

// Login endpoint
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }
    
    if (password === DASHBOARD_PASSWORD) {
        console.log('✅ Successful login attempt');
        res.json({ success: true });
    } else {
        console.log('❌ Failed login attempt');
        res.json({ success: false, error: 'Invalid password' });
    }
});

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
    console.log('📝 Add PBX request received:', req.body);
    
    const { name, url, appId, appSecret } = req.body;
    
    if (!name || !url || !appId || !appSecret) {
        console.log('❌ Missing required fields:', { name: !!name, url: !!url, appId: !!appId, appSecret: !!appSecret });
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
    
    console.log('✅ PBX added successfully:', newPBX.name);
    
    // Immediately check the new PBX
    setTimeout(() => {
        checkPBXHealth(newPBX).then(health => {
            newPBX.status = health.status;
            newPBX.lastCheck = health.lastCheck;
            newPBX.health = health;
            savePBXData();
            
            // Broadcast update
            io.emit('pbx-update', pbxInstances.map(pbx => ({
                id: pbx.id,
                name: pbx.name,
                url: pbx.url,
                status: pbx.status,
                lastCheck: pbx.lastCheck,
                health: pbx.health
            })));
            
            console.log(`🔍 Initial health check for ${newPBX.name}: ${health.status}`);
        });
    }, 2000);
    
    res.json({ success: true, pbx: newPBX });
});

app.delete('/api/pbx/:id', (req, res) => {
    const { id } = req.params;
    const index = pbxInstances.findIndex(pbx => pbx.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'PBX not found' });
    }

    const deletedPBX = pbxInstances[index];
    pbxInstances.splice(index, 1);
    savePBXData();
    
    console.log('🗑️ PBX deleted:', deletedPBX.name);
    
    res.json({ success: true });
});

// Test individual PBX
app.post('/api/pbx/:id/test', async (req, res) => {
    const { id } = req.params;
    const pbx = pbxInstances.find(p => p.id === id);
    
    if (!pbx) {
        return res.status(404).json({ error: 'PBX not found' });
    }

    console.log(`🧪 Manual test requested for ${pbx.name}`);
    
    try {
        const health = await checkPBXHealth(pbx);
        
        // Update the PBX with new health data
        pbx.status = health.status;
        pbx.lastCheck = health.lastCheck;
        pbx.health = health;
        savePBXData();
        
        // Broadcast update
        io.emit('pbx-update', pbxInstances.map(pbx => ({
            id: pbx.id,
            name: pbx.name,
            url: pbx.url,
            status: pbx.status,
            lastCheck: pbx.lastCheck,
            health: pbx.health
        })));
        
        res.json({ success: true, health });
    } catch (error) {
        console.error(`❌ Manual test failed for ${pbx.name}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        pbxCount: pbxInstances.length
    });
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({
        message: 'API is working!',
        pbxCount: pbxInstances.length,
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint to test raw API call
app.post('/debug/test-api', async (req, res) => {
    const { url, appId, appSecret } = req.body;
    
    if (!url || !appId || !appSecret) {
        return res.status(400).json({ error: 'Missing url, appId, or appSecret' });
    }
    
    try {
        console.log('🧪 Debug API test:', { url, appId, appSecret: '[HIDDEN]' });
        
        // Clean and validate URL
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        // Remove trailing slash
        cleanUrl = cleanUrl.replace(/\/$/, '');
        
        // Check if this is a K2 VoIP PBX (YCM Cloud South Africa)
        const isYCMCloud = cleanUrl.includes('ycmcloud.co.za');
        
        if (isYCMCloud) {
            // K2 VoIP PBX v2.0 uses OAuth authentication
            const tokenUrl = `${cleanUrl}/api/v2.0.0/token`;
            
            console.log('📡 Testing K2 v2.0 OAuth URL:', tokenUrl);
            
            const response = await axios.post(tokenUrl, {
                client_id: appId,
                client_secret: appSecret
            }, {
                timeout: 10000,
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'MSP-Dashboard/1.0'
                }
            });
            
            console.log('✅ K2 v2.0 OAuth response:', response.data);
            
            res.json({
                success: true,
                status: response.status,
                data: response.data,
                hasToken: !!response.data?.access_token,
                apiType: 'K2 VoIP PBX v2.0 OAuth'
            });
        } else {
            // Standard Yeastar OAuth flow
            const isCloudPBX = cleanUrl.includes('yeastarcloud.com') || cleanUrl.includes('pbx.yeastar.com');
            const tokenUrl = isCloudPBX 
                ? `${cleanUrl}/openapi/v1.0.0/token`
                : `${cleanUrl}/api/v2.0.0/token`;
            
            console.log('📡 Testing OAuth URL:', tokenUrl);
            
            const response = await axios.post(tokenUrl, {
                client_id: appId,
                client_secret: appSecret
            }, {
                timeout: 10000,
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log('✅ OAuth API response:', response.data);
            
            res.json({
                success: true,
                status: response.status,
                data: response.data,
                hasToken: !!response.data?.access_token,
                apiType: 'Standard Yeastar OAuth'
            });
        }
        
    } catch (error) {
        console.error('❌ Raw API test failed:', error.response?.data || error.message);
        
        res.json({
            success: false,
            error: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
});

// Simple PBX health check function
async function checkPBXHealth(pbx) {
    try {
        console.log(`🔍 Checking health for ${pbx.name} at ${pbx.url}`);
        console.log(`📋 Using credentials - App ID: ${pbx.appId}, Secret: ${pbx.appSecret ? '[PRESENT]' : '[MISSING]'}`);
        
        // Clean and validate URL
        let cleanUrl = pbx.url.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        // Remove trailing slash
        cleanUrl = cleanUrl.replace(/\/$/, '');
        
        // Check if this is a K2 VoIP PBX (YCM Cloud South Africa) 
        const isYCMCloud = cleanUrl.includes('ycmcloud.co.za');
        
        if (isYCMCloud) {
            // K2 VoIP PBX v2.0 uses OAuth authentication like standard Yeastar
            const tokenUrl = `${cleanUrl}/api/v2.0.0/token`;
            console.log(`📡 K2 v2.0 Token URL: ${tokenUrl}`);
            
            const requestData = {
                client_id: pbx.appId,
                client_secret: pbx.appSecret
            };
            
            // Get OAuth token
            const tokenResponse = await axios.post(tokenUrl, requestData, {
                timeout: 15000,
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'MSP-Dashboard/1.0'
                }
            });

            if (!tokenResponse.data?.access_token) {
                throw new Error(`No access token in response. Got: ${JSON.stringify(tokenResponse.data)}`);
            }

            const token = tokenResponse.data.access_token;
            console.log(`✅ K2 v2.0 token received for ${pbx.name}, length: ${token.length}`);

            // Test with system info endpoint
            const systemUrl = `${cleanUrl}/api/v2.0.0/system/info`;
            console.log(`📡 K2 v2.0 System URL: ${systemUrl}`);
            
            const systemResponse = await axios.get(systemUrl, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'MSP-Dashboard/1.0'
                },
                timeout: 15000
            });

            console.log(`📊 K2 v2.0 System info received for ${pbx.name}:`, {
                status: systemResponse.status,
                dataKeys: Object.keys(systemResponse.data || {})
            });

            return {
                status: 'healthy',
                connected: true,
                systemInfo: systemResponse.data,
                lastCheck: new Date().toISOString(),
                apiType: 'K2 VoIP PBX v2.0'
            };
        } else {
            // Standard Yeastar Cloud OAuth flow
            const isCloudPBX = cleanUrl.includes('yeastarcloud.com') || cleanUrl.includes('pbx.yeastar.com');
            
            let tokenUrl;
            if (isCloudPBX) {
                tokenUrl = `${cleanUrl}/openapi/v1.0.0/token`;
            } else {
                tokenUrl = `${cleanUrl}/api/v2.0.0/token`;
            }
            
            console.log(`📡 OAuth Token URL: ${tokenUrl}`);
            
            const requestData = {
                client_id: pbx.appId,
                client_secret: pbx.appSecret
            };
            
            // Try to get a token first
            const tokenResponse = await axios.post(tokenUrl, requestData, {
                timeout: 15000,
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'MSP-Dashboard/1.0'
                }
            });

            if (!tokenResponse.data?.access_token) {
                throw new Error(`No access token in response. Got: ${JSON.stringify(tokenResponse.data)}`);
            }

            const token = tokenResponse.data.access_token;
            console.log(`✅ OAuth token received for ${pbx.name}, length: ${token.length}`);

            // Get basic system info
            const systemUrl = isCloudPBX 
                ? `${cleanUrl}/openapi/v1.0.0/system/info`
                : `${cleanUrl}/api/v2.0.0/system/info`;
            
            const systemResponse = await axios.get(systemUrl, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'MSP-Dashboard/1.0'
                },
                timeout: 15000
            });

            return {
                status: 'healthy',
                connected: true,
                systemInfo: systemResponse.data,
                lastCheck: new Date().toISOString(),
                apiType: 'Standard Yeastar'
            };
        }

    } catch (error) {
        console.error(`❌ Health check failed for ${pbx.name}:`, {
            message: error.message,
            code: error.code,
            response: error.response ? {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers
            } : 'No response object'
        });
        
        let errorMessage = error.message;
        
        // Provide more specific error messages
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            console.log(`📡 Detailed error response for ${pbx.name}:`, { 
                status, 
                data,
                url: error.config?.url,
                method: error.config?.method
            });
            
            if (status === 400) {
                errorMessage = `Bad Request (400): ${data?.message || data?.errmsg || 'Invalid request format'}`;
            } else if (status === 401) {
                errorMessage = `Unauthorized (401): ${data?.message || data?.errmsg || 'Invalid API credentials'}`;
            } else if (status === 403) {
                errorMessage = `Forbidden (403): ${data?.message || data?.errmsg || 'Check IP allowlist'}`;
            } else if (status === 404) {
                errorMessage = `Not Found (404): ${data?.message || data?.errmsg || 'API endpoint not found'}`;
            } else {
                errorMessage = `API error ${status}: ${data?.message || data?.errmsg || JSON.stringify(data) || 'Unknown error'}`;
            }
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused - PBX unreachable';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'PBX hostname not found - Check URL format. For Yeastar Cloud, use: https://[tenant].pbx.yeastar.com or https://[tenant].yeastarcloud.com';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timeout - PBX not responding';
        } else if (error.code === 'ECONNRESET') {
            errorMessage = 'Connection reset - Network issue';
        }

        return {
            status: 'error',
            connected: false,
            error: errorMessage,
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

// Simulate dynamic call activity for demo
function updateDemoCallActivity() {
    pbxInstances.forEach(pbx => {
        if (pbx.status === 'healthy' && pbx.health?.systemInfo) {
            const maxCalls = Math.floor(pbx.health.systemInfo.extensions * 0.3); // Max 30% of extensions active
            const currentCalls = Math.floor(Math.random() * (maxCalls + 1));
            pbx.health.systemInfo.activeCalls = currentCalls;
            pbx.lastCheck = new Date().toISOString();
            pbx.health.lastCheck = new Date().toISOString();
        }
    });
    
    // Broadcast update to all connected clients
    io.emit('pbx-update', pbxInstances.map(pbx => ({
        id: pbx.id,
        name: pbx.name,
        url: pbx.url,
        status: pbx.status,
        lastCheck: pbx.lastCheck,
        health: pbx.health
    })));
    
    console.log('📞 Updated demo call activity');
}

// Update demo call activity every 30 seconds
setInterval(updateDemoCallActivity, 30000);

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