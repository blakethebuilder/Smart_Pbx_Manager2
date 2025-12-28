import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/authRoutes.js';
import pbxRoutes from './routes/pbxRoutes.js';
import { initializePoller } from './services/backgroundPoller.js';
import { getSessionConfig } from './middleware/sessionConfig.js';

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

// Add CORS middleware for Express
import cors from 'cors';
app.use(cors({
    origin: process.env.CORS_ORIGIN || true, // Allow all origins in development
    credentials: true // Allow cookies
}));

// Add cache-busting headers for development/debugging
app.use((req, res, next) => {
    // Disable caching for all responses during debugging
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    next();
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.path}`, {
        sessionId: req.sessionID,
        authenticated: req.session?.authenticated,
        cookies: req.headers.cookie ? 'present' : 'none',
        userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
    });
    next();
});

// Session middleware
app.use(session(getSessionConfig()));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Add cookie parser for token-based auth

// Serve static files - handle both development and production paths
const frontendPath = process.env.NODE_ENV === 'production' 
  ? join(__dirname, '../frontend/public')  // Docker production path
  : join(__dirname, '../../frontend/public'); // Development path

console.log(`📁 Serving static files from: ${frontendPath}`);
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pbx', pbxRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '2024-12-28-v3', // Version identifier
        session: {
            id: req.sessionID,
            authenticated: req.session?.authenticated || false
        }
    });
});

// Debug endpoint for session info (remove in production)
app.get('/debug/session', (req, res) => {
    res.json({
        sessionId: req.sessionID,
        session: req.session,
        authenticated: req.session?.authenticated || false,
        cookies: req.headers.cookie
    });
});

// Simple test endpoint
app.get('/debug/test', (req, res) => {
    res.send(`
        <html>
        <head><title>Debug Test</title></head>
        <body style="font-family: Arial; padding: 20px; background: #222; color: white;">
            <h1>🔧 Debug Test Page</h1>
            <p><strong>Server Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Session ID:</strong> ${req.sessionID}</p>
            <p><strong>Authenticated:</strong> ${req.session?.authenticated || false}</p>
            <p><strong>Cookies:</strong> ${req.headers.cookie || 'None'}</p>
            <hr>
            <button onclick="testLogin()">Test Login</button>
            <button onclick="testAuth()">Test Auth Check</button>
            <div id="result" style="margin-top: 20px; padding: 10px; background: #333;"></div>
            <script>
                async function testLogin() {
                    const result = document.getElementById('result');
                    try {
                        const response = await fetch('/api/auth/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ password: 'Smart@2026!' })
                        });
                        const data = await response.json();
                        result.innerHTML = '<strong>Login Result:</strong><br>' + JSON.stringify(data, null, 2);
                    } catch (error) {
                        result.innerHTML = '<strong>Login Error:</strong><br>' + error.message;
                    }
                }
                
                async function testAuth() {
                    const result = document.getElementById('result');
                    try {
                        const response = await fetch('/api/auth/check', {
                            credentials: 'include'
                        });
                        const data = await response.json();
                        result.innerHTML = '<strong>Auth Check Result:</strong><br>' + JSON.stringify(data, null, 2);
                    } catch (error) {
                        result.innerHTML = '<strong>Auth Check Error:</strong><br>' + error.message;
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// Catch-all handler: send back React app's index.html file for non-API routes
app.get('*', (req, res) => {
    // Skip API routes and specific files
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/socket.io/') ||
        req.path.startsWith('/debug/') ||
        req.path.includes('.')) {
        return res.status(404).json({ error: 'Endpoint not found' });
    }
    
    const frontendPath = process.env.NODE_ENV === 'production' 
        ? join(__dirname, '../frontend/public')
        : join(__dirname, '../../frontend/public');
    
    // Always serve index.html for non-API routes
    res.sendFile(join(frontendPath, 'index.html'));
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
    console.log(`\n🚀 MSP Fleet Dashboard`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Dashboard:  http://localhost:${PORT}`);
    console.log(`🔌 Socket.io:  Connected`);
    console.log(`🔄 Poller:     60-second interval`);
    console.log(`🔐 Password:   ${process.env.MASTER_PASSWORD || 'Smart@2026!'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;
