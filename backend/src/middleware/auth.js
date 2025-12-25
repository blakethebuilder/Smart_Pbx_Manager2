/**
 * Authentication Middleware
 * Simple password-based authentication
 */

const MASTER_PASSWORD = process.env.MASTER_PASSWORD || 'Smart@2026!';

/**
 * Check if user is authenticated
 */
export function isAuthenticated(req, res, next) {
    if (req.session && req.session.authenticated) {
        return next();
    }

    res.status(401).json({ success: false, error: 'Unauthorized' });
}

/**
 * Login handler
 */
export function login(req, res) {
    const { password } = req.body;

    if (password === MASTER_PASSWORD) {
        req.session.authenticated = true;
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, error: 'Invalid password' });
    }
}

/**
 * Logout handler
 */
export function logout(req, res) {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logout successful' });
    });
}

/**
 * Check auth status
 */
export function checkAuth(req, res) {
    if (req.session && req.session.authenticated) {
        res.json({ success: true, authenticated: true });
    } else {
        res.json({ success: true, authenticated: false });
    }
}
