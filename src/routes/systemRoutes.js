import express from 'express';
import fs from 'fs';
import axios from 'axios';
import { dbOperations } from '../database/database.js';
import { rateLimitService } from '../services/RateLimitService.js';
import { tokenService } from '../services/TokenService.js';
import { sharedPBXService } from '../services/SharedPBXService.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Test endpoint
router.get('/test', (req, res) => {
    const pbxInstances = dbOperations.getAllPBX();
    
    res.json({
        message: 'MSP PBX Dashboard API is working',
        timestamp: new Date().toISOString(),
        pbxCount: pbxInstances.length,
        version: '2.0.0'
    });
});

// Manual health check trigger (for testing)
router.post('/trigger-health-check', async (req, res) => {
    try {
        const { healthCheckService } = await import('../services/HealthCheckService.js');
        const { sharedPBXService } = await import('../services/SharedPBXService.js');
        const pbxInstances = dbOperations.getAllPBX();
        
        console.log('🔧 Manual health check triggered via API');
        
        // Clear shared PBX cache to force fresh data
        console.log('🗑️ Clearing shared PBX cache...');
        const uniqueHostnames = new Set();
        pbxInstances.forEach(pbx => {
            try {
                const hostname = new URL(pbx.url).hostname;
                uniqueHostnames.add(hostname);
            } catch (error) {
                // Skip invalid URLs
            }
        });
        
        uniqueHostnames.forEach(hostname => {
            sharedPBXService.clearCache(`https://${hostname}`);
        });
        
        // Run health check in background
        healthCheckService.checkAllPBX(pbxInstances).then(() => {
            console.log('✅ Manual health check completed');
        }).catch(error => {
            console.error('❌ Manual health check failed:', error.message);
        });
        
        res.json({
            message: 'Health check triggered successfully (cache cleared)',
            timestamp: new Date().toISOString(),
            pbxCount: pbxInstances.length,
            clearedCaches: Array.from(uniqueHostnames)
        });
    } catch (error) {
        console.error('❌ Failed to trigger health check:', error.message);
        res.status(500).json({
            error: 'Failed to trigger health check',
            message: error.message
        });
    }
});

// System status endpoint
router.get('/status', (req, res) => {
    try {
        const pbxInstances = dbOperations.getAllPBX();
        const rateLimitStats = rateLimitService.getAllRateLimitStats();
        const tokenStats = tokenService.getCacheStats();
        const sharedCacheStats = sharedPBXService.getCacheStats();
        
        // Count PBX by status
        const statusCounts = pbxInstances.reduce((acc, pbx) => {
            acc[pbx.status || 'unknown'] = (acc[pbx.status || 'unknown'] || 0) + 1;
            return acc;
        }, {});

        // Database file size
        const dbPath = './data/pbx-dashboard.db';
        const dbSize = fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0;

        res.json({
            system: {
                status: 'running',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '2.0.0',
                nodeVersion: process.version
            },
            database: {
                type: 'SQLite',
                location: dbPath,
                size: dbSize,
                sizeFormatted: `${(dbSize / 1024 / 1024).toFixed(2)} MB`
            },
            pbx: {
                total: pbxInstances.length,
                statusCounts,
                lastUpdate: new Date().toISOString()
            },
            services: {
                rateLimiting: rateLimitStats,
                tokenCache: tokenStats,
                sharedCache: sharedCacheStats
            }
        });
    } catch (error) {
        console.error('❌ Failed to get system status:', error.message);
        res.status(500).json({ error: 'Failed to retrieve system status' });
    }
});

// Debug API endpoint
router.post('/debug/test-api', async (req, res) => {
    const { url, appId, appSecret } = req.body;
    
    if (!url || !appId || !appSecret) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields: url, appId, appSecret' 
        });
    }

    try {
        console.log(`🧪 Debug API test for: ${url}`);
        
        // Clean URL
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        cleanUrl = cleanUrl.replace(/\/$/, '');

        // Create temporary PBX object for testing
        const testPBX = {
            id: 'debug-test',
            name: 'Debug Test',
            url: cleanUrl,
            appId,
            appSecret,
            isShared: false
        };

        // Get token
        const token = await tokenService.getValidToken(testPBX);
        
        // Test basic API call
        const testUrl = `${cleanUrl}/openapi/v1.0/extension/query?access_token=${token}`;
        const response = await axios.get(testUrl, {
            headers: { 'User-Agent': 'MSP-Dashboard/1.0' },
            timeout: 10000
        });

        res.json({
            success: true,
            status: response.status,
            hasToken: !!token,
            data: response.data,
            message: 'API test successful'
        });

    } catch (error) {
        console.error('❌ Debug API test failed:', error.message);
        
        res.json({
            success: false,
            error: error.message,
            status: error.response?.status || null,
            data: error.response?.data || null
        });
    }
});

// Rate limit status
router.get('/rate-limits', (req, res) => {
    try {
        const stats = rateLimitService.getAllRateLimitStats();
        res.json(stats);
    } catch (error) {
        console.error('❌ Failed to get rate limit stats:', error.message);
        res.status(500).json({ error: 'Failed to retrieve rate limit statistics' });
    }
});

// Clear caches (for maintenance)
router.post('/maintenance/clear-caches', (req, res) => {
    try {
        tokenService.cleanupExpiredTokens();
        sharedPBXService.cleanupCache();
        
        res.json({ 
            success: true, 
            message: 'Caches cleared successfully' 
        });
    } catch (error) {
        console.error('❌ Failed to clear caches:', error.message);
        res.status(500).json({ error: 'Failed to clear caches' });
    }
});

export default router;