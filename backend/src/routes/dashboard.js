import express from 'express';
import { getAllPBXStatus, getHealthStatus } from '../services/pbxMonitor.js';

const router = express.Router();

/**
 * GET /api/dashboard/status
 * Get status for all PBX instances
 */
router.get('/status', async (req, res) => {
    try {
        const statuses = await getAllPBXStatus();
        res.json({ success: true, data: statuses });
    } catch (error) {
        console.error('Error fetching dashboard status:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard status' });
    }
});

/**
 * GET /api/dashboard/status/:id
 * Get status for a specific PBX instance
 */
router.get('/status/:id', async (req, res) => {
    try {
        const status = await getHealthStatus(parseInt(req.params.id));
        res.json({ success: true, data: status });
    } catch (error) {
        console.error('Error fetching PBX status:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch PBX status' });
    }
});

export default router;
