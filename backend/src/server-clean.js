import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/authRoutes.js';
import pbxRoutes from './routes/pbxRoutes.js';
import { initializePoller } from './services/backgroundPoller.js';
import { requireAuth } from './auth/simple.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    }
});

// Trust proxy for IP detection
app.set('trust proxy', true);

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with authentication check
const frontendPath = process.env.NODE_ENV === 'production' 
  ? join(__dirname, '../frontend/public')
  : join(__dirname, '../../frontend/public');

console.log(`📁 Serving static files from: ${frontendPath}`);

// Serve login page without auth
app.get('/', (req, res) => {
    res.sendFile(join(frontendPath, 'clean-login.html'));
});

app.get('/clean-login.html', (req, res) => {
    res.sendFile(join(frontendPath, 'clean-login.html'));
});

// Protect dashboard and other pages
app.get('/dashboard.html', requireAuth, (req, res) => {
    res.sendFile(join(frontendPath, 'clean-dashboard.html'));
});

app.get('/clean-dashboard.html', requireAuth, (req, res) => {
    res.sendFile(join(frontendPath, 'clean-dashboard.html'));
});

// Serve other static files normally
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pbx', pbxRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: 'clean-v1'
    });
});

// Simple test endpoint
app.get('/test-auth', (req, res) => {
    res.send(`
        <html>
        <head><title>Clean Auth Test</title></head>
        <body style="font-family: Arial; padding: 20px; background: #222; color: white;">
            <h1>🧪 Clean Auth Test</h1>
            <p>Your IP: ${req.ip}</p>
            <button onclick="testLogin()">Login</button>
            <button onclick="testCheck()">Check Auth</button>
            <div id="result" style="margin-top: 20px; padding: 10px; background: #333;"></div>
            <script>
                async function testLogin() {
                    const result = document.getElementById('result');
                    try {
                        const response = await fetch('/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: 'Smart@2026!' })
                        });
                        const data = await response.json();
                        result.innerHTML = 'Login: ' + JSON.stringify(data);
                    } catch (error) {
                        result.innerHTML = 'Login Error: ' + error.message;
                    }
                }
                
                async function testCheck() {
                    const result = document.getElementById('result');
                    try {
                        const response = await fetch('/api/auth/check');
                        const data = await response.json();
                        result.innerHTML = 'Auth Check: ' + JSON.stringify(data);
                    } catch (error) {
                        result.innerHTML = 'Auth Error: ' + error.message;
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Catch-all for SPA routing - redirect to login if not authenticated
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
        return res.status(404).json({ error: 'Not found' });
    }
    
    // For any other route, redirect to login
    res.redirect('/clean-login.html');
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
});

// Initialize background poller
initializePoller(io);

// Start server
server.listen(PORT, () => {
    console.log(`\n🚀 MSP Fleet Dashboard - CLEAN VERSION`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Dashboard:  http://localhost:${PORT}`);
    console.log(`🧪 Test Auth:  http://localhost:${PORT}/test-auth`);
    console.log(`🔐 Password:   ${process.env.MASTER_PASSWORD || 'Smart@2026!'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

export default app;