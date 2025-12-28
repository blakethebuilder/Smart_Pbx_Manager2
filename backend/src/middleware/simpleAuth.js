/**
 * Simple Token-Based Authentication
 * Bypasses session issues entirely
 */

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'Smart@2026!';
const SECRET_KEY = process.env.SESSION_SECRET || 'msp-fleet-dashboard-secret-key';

// Simple token generation (not JWT, just a simple hash)
function generateToken(password) {
    const timestamp = Date.now();
    const hash = Buffer.from(`${password}:${timestamp}:${SECRET_KEY}`).toString('base64');
    return `${timestamp}.${hash}`;
}

function validateToken(token) {
    if (!token) return false;
    
    try {
        const [timestamp, hash] = token.split('.');
        const age = Date.now() - parseInt(timestamp);
        
        // Token expires after 24 hours
        if (age > 24 * 60 * 60 * 1000) return false;
        
        // Verify hash
        const expectedHash = Buffer.from(`${MASTER_PASSWORD}:${timestamp}:${SECRET_KEY}`).toString('base64');
        return hash === expectedHash;
    } catch (error) {
        return false;
    }
}

/**
 * Login handler - returns token instead of using sessions
 */
export function simpleLogin(req, res) {
    const { password } = req.body;
    
    console.log('🔐 Simple login attempt');

    if (password === MASTER_PASSWORD) {
        const token = generateToken(password);
        console.log('✅ Simple login successful, token generated');
        
        // Set token as HTTP-only cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: false, // Allow HTTP and HTTPS
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'lax'
        });
        
        res.json({ success: true, message: 'Login successful' });
    } else {
        console.log('❌ Simple login failed - invalid password');
        res.status(401).json({ success: false, error: 'Invalid password' });
    }
}

/**
 * Check auth - validates token from cookie
 */
export function simpleCheckAuth(req, res) {
    const token = req.cookies.auth_token;
    
    console.log('🔍 Simple auth check:', {
        hasToken: !!token,
        cookies: Object.keys(req.cookies)
    });
    
    if (validateToken(token)) {
        console.log('✅ Simple auth check: Valid token');
        res.json({ success: true, authenticated: true });
    } else {
        console.log('❌ Simple auth check: Invalid or missing token');
        res.json({ success: true, authenticated: false });
    }
}

/**
 * Logout - clears token cookie
 */
export function simpleLogout(req, res) {
    console.log('🚪 Simple logout');
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Logout successful' });
}

/**
 * Middleware to protect routes
 */
export function requireAuth(req, res, next) {
    const token = req.cookies.auth_token;
    
    if (validateToken(token)) {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Unauthorized' });
    }
}