import express from 'express';
import { dbOperations } from '../database/database.js';
import { healthCheckService } from '../services/HealthCheckService.js';

const router = express.Router();

// Get all PBX instances
router.get('/', (req, res) => {
    try {
        const pbxInstances = dbOperations.getAllPBX();
        res.json(pbxInstances.map(pbx => ({
            id: pbx.id,
            name: pbx.name,
            url: pbx.url,
            appId: pbx.appId,
            appSecret: pbx.appSecret,
            status: pbx.status || 'unknown',
            lastCheck: pbx.last_check,
            health: pbx.health,
            isShared: pbx.isShared
        })));
    } catch (error) {
        console.error('❌ Failed to get PBX instances:', error.message);
        res.status(500).json({ error: 'Failed to retrieve PBX instances' });
    }
});

// Add new PBX instance
router.post('/', async (req, res) => {
    console.log('📝 Add PBX request received:', req.body);
    
    const { name, url, appId, appSecret, isShared } = req.body;
    
    if (!name || !url) {
        console.log('❌ Missing required fields:', { name: !!name, url: !!url });
        return res.status(400).json({ error: 'Missing required fields (name and url)' });
    }

    // Allow empty credentials - they will be set as placeholders
    const finalAppId = appId || 'PLACEHOLDER_ID';
    const finalAppSecret = appSecret || 'PLACEHOLDER_SECRET';

    const newPBX = {
        id: Date.now().toString(),
        name,
        url,
        appId: finalAppId,
        appSecret: finalAppSecret,
        isShared: isShared || false,
        status: 'unknown',
        lastCheck: null,
        createdAt: new Date().toISOString()
    };

    try {
        // Save to database
        dbOperations.createPBX(newPBX);
        
        console.log('✅ PBX added successfully:', newPBX.name);
        
        // Immediately check the new PBX
        setTimeout(async () => {
            try {
                const health = await healthCheckService.checkPBXHealth(newPBX);
                newPBX.status = health.status;
                newPBX.lastCheck = health.lastCheck;
                newPBX.health = health;
                
                // Update database with health info
                dbOperations.updatePBXHealth(newPBX.id, health.status, health);
                
                console.log(`🔍 Initial health check for ${newPBX.name}: ${health.status}`);
            } catch (error) {
                console.error(`❌ Initial health check failed for ${newPBX.name}:`, error.message);
            }
        }, 2000);
        
        res.json({ success: true, pbx: newPBX });
        
    } catch (error) {
        console.error('❌ Failed to add PBX:', error.message);
        res.status(500).json({ error: 'Failed to add PBX instance' });
    }
});

// Update PBX instance
router.put('/:id', async (req, res) => {
    console.log('📝 Update PBX request received:', req.body);
    
    const { id } = req.params;
    const { name, url, appId, appSecret, isShared } = req.body;
    
    if (!name || !url) {
        console.log('❌ Missing required fields:', { name: !!name, url: !!url });
        return res.status(400).json({ error: 'Missing required fields (name and url)' });
    }

    // Allow empty credentials - they will be set as placeholders
    const finalAppId = appId || 'PLACEHOLDER_ID';
    const finalAppSecret = appSecret || 'PLACEHOLDER_SECRET';

    try {
        // Check if PBX exists
        const existingPBX = dbOperations.getPBXById(id);
        if (!existingPBX) {
            return res.status(404).json({ error: 'PBX not found' });
        }

        // Update in database
        const updateData = {
            name,
            url,
            appId: finalAppId,
            appSecret: finalAppSecret,
            isShared: isShared || false
        };
        
        dbOperations.updatePBX(id, updateData);

        const updatedPBX = {
            ...existingPBX,
            ...updateData,
            status: 'unknown', // Reset status to trigger new health check
            lastCheck: null,
            updatedAt: new Date().toISOString()
        };
        
        console.log('✅ PBX updated successfully:', updatedPBX.name);
        
        // Immediately check the updated PBX
        setTimeout(async () => {
            try {
                const health = await healthCheckService.checkPBXHealth(updatedPBX);
                
                // Update database with health info
                dbOperations.updatePBXHealth(id, health.status, health);
                
                console.log(`🔍 Updated health check for ${updatedPBX.name}: ${health.status}`);
            } catch (error) {
                console.error(`❌ Updated health check failed for ${updatedPBX.name}:`, error.message);
            }
        }, 1000);
        
        res.json({ success: true, pbx: updatedPBX });
        
    } catch (error) {
        console.error('❌ Failed to update PBX:', error.message);
        res.status(500).json({ error: 'Failed to update PBX instance' });
    }
});

// Delete PBX instance
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    try {
        const existingPBX = dbOperations.getPBXById(id);
        if (!existingPBX) {
            return res.status(404).json({ error: 'PBX not found' });
        }

        // Delete from database
        dbOperations.deletePBX(id);
        
        console.log('🗑️ PBX deleted:', existingPBX.name);
        
        // Broadcast updated data to all connected clients
        const updatedInstances = dbOperations.getAllPBX();
        req.app.get('io').emit('pbx-update', updatedInstances.map(pbx => ({
            id: pbx.id,
            name: pbx.name,
            url: pbx.url,
            appId: pbx.appId,
            appSecret: pbx.appSecret,
            status: pbx.status,
            lastCheck: pbx.last_check,
            health: pbx.health,
            isShared: pbx.isShared
        })));
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('❌ Failed to delete PBX:', error.message);
        res.status(500).json({ error: 'Failed to delete PBX instance' });
    }
});

// Test individual PBX
router.post('/:id/test', async (req, res) => {
    const { id } = req.params;
    
    try {
        const pbx = dbOperations.getPBXById(id);
        if (!pbx) {
            return res.status(404).json({ error: 'PBX not found' });
        }

        console.log(`🧪 Testing PBX: ${pbx.name}`);
        
        const health = await healthCheckService.checkPBXHealth(pbx);
        
        // Update database with test results
        dbOperations.updatePBXHealth(id, health.status, health);
        
        res.json({ 
            success: health.status === 'healthy',
            health: health
        });
        
    } catch (error) {
        console.error('❌ PBX test failed:', error.message);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Bulk import endpoint
router.post('/bulk-import', (req, res) => {
    console.log('📝 Bulk import request received');
    
    const { instances } = req.body;
    
    if (!instances || !Array.isArray(instances)) {
        return res.status(400).json({ error: 'Invalid instances data' });
    }

    const results = {
        imported: 0,
        errors: []
    };

    try {
        for (const instance of instances) {
            try {
                const newPBX = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: instance.name,
                    url: instance.url,
                    appId: instance.appId || 'PLACEHOLDER_ID',
                    appSecret: instance.appSecret || 'PLACEHOLDER_SECRET',
                    isShared: instance.isShared || false,
                    status: 'unknown',
                    lastCheck: null,
                    createdAt: new Date().toISOString()
                };

                dbOperations.createPBX(newPBX);
                results.imported++;
                
                console.log(`✅ Imported: ${newPBX.name}`);
                
            } catch (error) {
                const errorMsg = `Failed to import ${instance.name}: ${error.message}`;
                results.errors.push(errorMsg);
                console.error(`❌ ${errorMsg}`);
            }
        }

        console.log(`📊 Bulk import completed: ${results.imported} imported, ${results.errors.length} errors`);
        
        res.json({
            success: true,
            imported: results.imported,
            errors: results.errors
        });
        
    } catch (error) {
        console.error('❌ Bulk import failed:', error.message);
        res.status(500).json({ error: 'Bulk import failed' });
    }
});

// Get health history for a PBX
router.get('/:id/health-history', (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    try {
        const history = dbOperations.getHealthHistory(id, limit);
        res.json(history);
    } catch (error) {
        console.error('❌ Failed to get health history:', error.message);
        res.status(500).json({ error: 'Failed to retrieve health history' });
    }
});

// Get logs for a specific PBX
router.get('/:id/logs', (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    
    try {
        const pbx = dbOperations.getPBXById(id);
        if (!pbx) {
            return res.status(404).json({ error: 'PBX not found' });
        }

        // Get recent health check history
        const logs = dbOperations.getHealthHistory(id, limit);
        
        res.json({ 
            success: true,
            pbx: {
                id: pbx.id,
                name: pbx.name,
                status: pbx.status,
                lastCheck: pbx.last_check,
                health: pbx.health
            },
            logs: logs
        });
        
    } catch (error) {
        console.error('❌ Failed to get PBX logs:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Failed to retrieve PBX logs' 
        });
    }
});

export default router;