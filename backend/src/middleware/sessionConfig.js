/**
 * Session Configuration
 * Handles session setup for both development and production
 */

export function getSessionConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
        secret: process.env.SESSION_SECRET || 'msp-fleet-dashboard-secret-key-' + Date.now(),
        resave: false,
        saveUninitialized: false,
        rolling: true, // Reset expiration on activity
        cookie: {
            secure: false, // Allow both HTTP and HTTPS for now
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'lax' // Allow cross-site requests
        },
        name: 'msp_session_id' // Custom session name to avoid conflicts
    };
}