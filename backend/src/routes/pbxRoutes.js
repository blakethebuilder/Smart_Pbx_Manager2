import express from 'express';
import { isAuthenticated } from '../middleware/auth.js';
import { getAllPBXs, getPBXById, addPBX, updatePBX, deletePBX } from '../services/pbxStorage.js';
import { clearToken } from '../services/tokenCache.js';
import { triggerImmediatePoll } from '../services/backgroundPoller.js';

const router = express.Router();

/**
 * GET /api/pbx
 * Get all PBXs (without secrets)
 */
router.get('/', isAuthenticated, (req, res) => {
    try {
        const pbxs = getAllPBXs();

        // Remove sensitive data
        const sanitized = pbxs.map(p => ({
            id: p.id,
            name: p.name,
            url: p.url,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        }));

        res.json({ success: true, data: sanitized });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/pbx
 * Add new PBX
 */
router.post('/', isAuthenticated, (req, res) => {
    try {
        const { name, url, appId, appSecret } = req.body;

        if (!name || !url || !appId || !appSecret) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, url, appId, appSecret'
            });
        }

        const newPBX = addPBX({ name, url, appId, appSecret });

        // Trigger immediate poll to fetch data for new PBX
        triggerImmediatePoll();

        res.status(201).json({
            success: true,
            data: {
                id: newPBX.id,
                name: newPBX.name,
                url: newPBX.url,
                createdAt: newPBX.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/pbx/:id
 * Update PBX
 */
router.put('/:id', isAuthenticated, (req, res) => {
    try {
        const { name, url, appId, appSecret } = req.body;

        if (!name || !url || !appId || !appSecret) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, url, appId, appSecret'
            });
        }

        const updated = updatePBX(req.params.id, { name, url, appId, appSecret });

        // Clear token cache for this PBX
        clearToken(req.params.id);

        // Trigger immediate poll
        triggerImmediatePoll();

        res.json({
            success: true,
            data: {
                id: updated.id,
                name: updated.name,
                url: updated.url,
                updatedAt: updated.updatedAt
            }
        });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/pbx/:id
 * Delete PBX
 */
router.delete('/:id', isAuthenticated, (req, res) => {
    try {
        deletePBX(req.params.id);

        // Clear token cache
        clearToken(req.params.id);

        // Trigger immediate poll
        triggerImmediatePoll();

        res.json({ success: true, message: 'PBX deleted successfully' });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
});

export default router;
