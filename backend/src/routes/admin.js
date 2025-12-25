import express from 'express';
import { getCircuitBreakerStatus, resetCircuitBreaker } from '../services/yeastarAuth.js';
import db from '../config/database.js';

const router = express.Router();

/**
 * GET /api/admin/circuit-breakers
 * Get circuit breaker status for all PBX instances
 */
router.get('/circuit-breakers', (req, res) => {
    try {
        const instances = db.prepare('SELECT id, name FROM pbx_instances').all();

        const statuses = instances.map(pbx => ({
            pbxId: pbx.id,
            pbxName: pbx.name,
            ...getCircuitBreakerStatus(pbx.id)
        }));

        res.json({ success: true, data: statuses });
    } catch (error) {
        console.error('Error fetching circuit breaker statuses:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch circuit breaker statuses' });
    }
});

/**
 * POST /api/admin/circuit-breaker/reset/:pbxId
 * Manually reset circuit breaker for a PBX
 */
router.post('/circuit-breaker/reset/:pbxId', (req, res) => {
    try {
        const pbxId = parseInt(req.params.pbxId);

        resetCircuitBreaker(pbxId);

        res.json({
            success: true,
            message: `Circuit breaker reset for PBX ${pbxId}`
        });
    } catch (error) {
        console.error('Error resetting circuit breaker:', error);
        res.status(500).json({ success: false, error: 'Failed to reset circuit breaker' });
    }
});

export default router;
