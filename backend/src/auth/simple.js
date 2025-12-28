/**
 * Dead Simple Authentication
 * No sessions, no tokens, just basic auth that works
 */

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'Smart@2026!';

// In-memory store for authenticated IPs (simple but effective)
const authenticatedIPs = new Map();

/**
 * Login - just check password and remember the IP
 */
export function login(req, res) {
    const { password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    console.log(`🔐 Login attempt from ${clientIP}`);
    
    if (password === MASTER_PASSWORD) {
        // Remember this IP as authenticated for 24 hours
        authenticatedIPs.set(clientIP, Date.now() + (24 * 60 * 60 * 1000));
        console.log(`✅ Login successful for ${clientIP}`);
        res.json({ success: true });
    } else {
        console.log(`❌ Invalid password from ${clientIP}`);
        res.status(401).json({ success: false, error: 'Invalid password' });
    }
}

/**
 * Check if IP is authenticated
 */
export function checkAuth(req, res) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const expiry = authenticatedIPs.get(clientIP);
    
    if (expiry && Date.now() < expiry) {
        console.log(`✅ Auth check: ${clientIP} is authenticated`);
        res.json({ success: true, authenticated: true });
    } else {
        console.log(`❌ Auth check: ${clientIP} is NOT authenticated`);
        authenticatedIPs.delete(clientIP); // Clean up expired
        res.json({ success: true, authenticated: false });
    }
}

/**
 * Logout - remove IP from authenticated list
 */
export function logout(req, res) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    authenticatedIPs.delete(clientIP);
    console.log(`🚪 Logout: ${clientIP}`);
    res.json({ success: true });
}

/**
 * Middleware to protect routes
 */
export function requireAuth(req, res, next) {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const expiry = authenticatedIPs.get(clientIP);
    
    if (expiry && Date.now() < expiry) {
        next();
    } else {
        authenticatedIPs.delete(clientIP);
        res.status(401).json({ success: false, error: 'Unauthorized' });
    }
}

// Clean up expired IPs every hour
setInterval(() => {
    const now = Date.now();
    for (const [ip, expiry] of authenticatedIPs.entries()) {
        if (now >= expiry) {
            authenticatedIPs.delete(ip);
            console.log(`🧹 Cleaned up expired auth for ${ip}`);
        }
    }
}, 60 * 60 * 1000);