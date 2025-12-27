import express from 'express';
import cors from 'cors';
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

// Session middleware
app.use(session(getSessionConfig()));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Catch-all handler: send back React app's index.html file for non-API routes
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const frontendPath = process.env.NODE_ENV === 'production' 
        ? join(__dirname, '../frontend/public')
        : join(__dirname, '../../frontend/public');
    
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
