/**
 * Session Configuration
 * Handles session setup for both development and production
 */
import MemorySessionStore from './memoryStore.js';

export function getSessionConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log('🔧 Configuring sessions for:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
    
    const config = {
        store: new MemorySessionStore(), // Use custom memory store
        secret: process.env.SESSION_SECRET || 'msp-fleet-dashboard-secret-key-' + Date.now(),
        resave: false,
        saveUninitialized: false,
        rolling: true, // Reset expiration on activity
        cookie: {
            secure: false, // Allow both HTTP and HTTPS
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'lax' // Allow cross-site requests
        },
        name: 'msp_session_id' // Custom session name to avoid conflicts
    };
    
    console.log('🔧 Session config:', {
        store: 'MemorySessionStore',
        secure: config.cookie.secure,
        httpOnly: config.cookie.httpOnly,
        sameSite: config.cookie.sameSite,
        maxAge: config.cookie.maxAge,
        name: config.name
    });
    
    return config;
}