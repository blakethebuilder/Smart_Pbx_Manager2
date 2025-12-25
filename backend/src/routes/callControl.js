import express from 'express';
import { acceptCall, refuseCall } from '../services/callControl.js';
import { markCallAccepted, markCallRefused } from '../services/webhookHandler.js';
import { broadcast } from '../services/websocket.js';

const router = express.Router();

/**
 * POST /api/call/accept
 * Accept an inbound call
 */
router.post('/accept', async (req, res) => {
    const { pbxId, callId } = req.body;

    if (!pbxId || !callId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: pbxId, callId'
        });
    }

    try {
        // Call the PBX API to accept the call
        const result = await acceptCall(pbxId, callId);

        if (result.success) {
            // Mark as accepted in our tracking
            markCallAccepted(callId);

            // Broadcast to all clients
            broadcast({
                type: 'call_accepted',
                callId,
                pbxId
            });

            res.json({ success: true, message: 'Call accepted successfully' });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error accepting call:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/call/refuse
 * Refuse an inbound call
 */
router.post('/refuse', async (req, res) => {
    const { pbxId, callId } = req.body;

    if (!pbxId || !callId) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields: pbxId, callId'
        });
    }

    try {
        // Call the PBX API to refuse the call
        const result = await refuseCall(pbxId, callId);

        if (result.success) {
            // Mark as refused in our tracking
            markCallRefused(callId);

            // Broadcast to all clients
            broadcast({
                type: 'call_refused',
                callId,
                pbxId
            });

            res.json({ success: true, message: 'Call refused successfully' });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error refusing call:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
