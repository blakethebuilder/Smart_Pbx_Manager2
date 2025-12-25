import express from 'express';
import db from '../config/database.js';
import { testAuthentication } from '../services/yeastarAuth.js';

const router = express.Router();

/**
 * GET /api/pbx
 * List all PBX instances (without sensitive credentials)
 */
router.get('/', (req, res) => {
    try {
        const instances = db.prepare(`
      SELECT id, name, url, created_at, updated_at 
      FROM pbx_instances 
      ORDER BY name
    `).all();

        res.json({ success: true, data: instances });
    } catch (error) {
        console.error('Error fetching PBX instances:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch PBX instances' });
    }
});

/**
 * GET /api/pbx/:id
 * Get a single PBX instance
 */
router.get('/:id', (req, res) => {
    try {
        const instance = db.prepare(`
      SELECT id, name, url, created_at, updated_at 
      FROM pbx_instances 
      WHERE id = ?
    `).get(req.params.id);

        if (!instance) {
            return res.status(404).json({ success: false, error: 'PBX instance not found' });
        }

        res.json({ success: true, data: instance });
    } catch (error) {
        console.error('Error fetching PBX instance:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch PBX instance' });
    }
});

/**
 * POST /api/pbx
 * Add a new PBX instance
 */
router.post('/', async (req, res) => {
    const { name, url, clientId, clientSecret } = req.body;

    // Validate required fields
    if (!name || !url || !clientId || !clientSecret) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: name, url, clientId, clientSecret'
        });
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid URL format'
        });
    }

    // Test authentication before saving
    try {
        await testAuthentication(url, clientId, clientSecret);
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: `Authentication failed: ${error.message}`
        });
    }

    // Save to database
    try {
        const result = db.prepare(`
      INSERT INTO pbx_instances (name, url, client_id, client_secret)
      VALUES (?, ?, ?, ?)
    `).run(name, url, clientId, clientSecret);

        const newInstance = db.prepare(`
      SELECT id, name, url, created_at, updated_at 
      FROM pbx_instances 
      WHERE id = ?
    `).get(result.lastInsertRowid);

        res.status(201).json({ success: true, data: newInstance });
    } catch (error) {
        console.error('Error creating PBX instance:', error);
        res.status(500).json({ success: false, error: 'Failed to create PBX instance' });
    }
});

/**
 * PUT /api/pbx/:id
 * Update a PBX instance
 */
router.put('/:id', async (req, res) => {
    const { name, url, clientId, clientSecret } = req.body;
    const { id } = req.params;

    // Check if instance exists
    const existing = db.prepare('SELECT * FROM pbx_instances WHERE id = ?').get(id);
    if (!existing) {
        return res.status(404).json({ success: false, error: 'PBX instance not found' });
    }

    // Validate required fields
    if (!name || !url || !clientId || !clientSecret) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: name, url, clientId, clientSecret'
        });
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid URL format'
        });
    }

    // Test authentication if credentials changed
    if (url !== existing.url || clientId !== existing.client_id || clientSecret !== existing.client_secret) {
        try {
            await testAuthentication(url, clientId, clientSecret);
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: `Authentication failed: ${error.message}`
            });
        }
    }

    // Update database
    try {
        db.prepare(`
      UPDATE pbx_instances 
      SET name = ?, url = ?, client_id = ?, client_secret = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, url, clientId, clientSecret, id);

        // Clear cached token if credentials changed
        if (url !== existing.url || clientId !== existing.client_id || clientSecret !== existing.client_secret) {
            db.prepare('DELETE FROM pbx_tokens WHERE pbx_id = ?').run(id);
        }

        const updated = db.prepare(`
      SELECT id, name, url, created_at, updated_at 
      FROM pbx_instances 
      WHERE id = ?
    `).get(id);

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('Error updating PBX instance:', error);
        res.status(500).json({ success: false, error: 'Failed to update PBX instance' });
    }
});

/**
 * DELETE /api/pbx/:id
 * Delete a PBX instance
 */
router.delete('/:id', (req, res) => {
    try {
        const result = db.prepare('DELETE FROM pbx_instances WHERE id = ?').run(req.params.id);

        if (result.changes === 0) {
            return res.status(404).json({ success: false, error: 'PBX instance not found' });
        }

        res.json({ success: true, message: 'PBX instance deleted successfully' });
    } catch (error) {
        console.error('Error deleting PBX instance:', error);
        res.status(500).json({ success: false, error: 'Failed to delete PBX instance' });
    }
});

export default router;
