import express from 'express';
import { dbOperations } from '../database/database.js';
import { v4: uuidv4 } from 'uuid';

const router = express.Router();

// Endpoint to handle bulk PBX import from CSV-like data
router.post('/bulk-import', async (req, res) => {
    const { instances } = req.body;

    if (!Array.isArray(instances) || instances.length === 0) {
        return res.status(400).json({ error: 'Invalid input: instances must be a non-empty array.' });
    }

    const results = {
        success: true,
        created: 0,
        updated: 0,
        failed: 0,
        errors: []
    };

    for (const data of instances) {
        const { name, url, appId, appSecret, isShared } = data;
        
        // Basic validation
        if (!name || !url) {
            results.failed++;
            results.errors.push({ data, message: 'Missing name or URL' });
            continue;
        }
        
        // Clean URL
        let cleanUrl = url.trim().replace(/\/login\/?$/, '');
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }

        const pbxId = data.id || uuidv4();

        try {
            // Check if PBX already exists (simple check based on URL might be needed for update logic, but for bulk import we'll prioritize creation/update)
            const existingPBX = dbOperations.getPBXById(pbxId);
            
            const pbxData = {
                id: pbxId,
                name: name.trim(),
                url: cleanUrl,
                appId: appId?.trim() || null,
                appSecret: appSecret?.trim() || null,
                isShared: isShared ? 1 : 0,
            };

            if (existingPBX) {
                // Update existing
                dbOperations.updatePBX(pbxId, pbxData);
                results.updated++;
            } else {
                // Insert new
                dbOperations.createPBX(pbxData);
                results.created++;
            }

        } catch (error) {
            results.failed++;
            results.errors.push({ data, message: error.message });
        }
    }

    if (results.failed > 0) {
        results.success = false;
    }

    res.json(results);
});

export default router;