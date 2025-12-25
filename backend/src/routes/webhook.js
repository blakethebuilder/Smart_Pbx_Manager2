import express from 'express';
import {
    processWebhookEvent,
    getAllExtensionStates,
    getAllTrunkStates,
    getAllActiveCalls,
    getPendingInboundCalls
} from '../services/webhookHandler.js';
import { broadcast } from '../services/websocket.js';

const router = express.Router();

/**
 * POST /yeastar/webhook
 * Receive webhook events from Yeastar PBX
 */
router.post('/webhook', (req, res) => {
    try {
        const event = req.body;

        console.log('📨 Received webhook event:', JSON.stringify(event, null, 2));

        // Process the event
        const processedEvent = processWebhookEvent(event);

        if (processedEvent) {
            // Broadcast to WebSocket clients for real-time UI update
            broadcast(processedEvent);
        }

        // Respond immediately to PBX
        res.status(200).json({
            success: true,
            message: 'Event received and processed'
        });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process webhook event'
        });
    }
});

/**
 * GET /yeastar/extensions
 * Get all extension states
 */
router.get('/extensions', (req, res) => {
    try {
        const extensions = getAllExtensionStates();
        res.json({ success: true, data: extensions });
    } catch (error) {
        console.error('Error fetching extension states:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch extension states' });
    }
});

/**
 * GET /yeastar/trunks
 * Get all trunk states
 */
router.get('/trunks', (req, res) => {
    try {
        const trunks = getAllTrunkStates();
        res.json({ success: true, data: trunks });
    } catch (error) {
        console.error('Error fetching trunk states:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch trunk states' });
    }
});

/**
 * GET /yeastar/calls
 * Get all active calls
 */
router.get('/calls', (req, res) => {
    try {
        const calls = getAllActiveCalls();
        res.json({ success: true, data: calls });
    } catch (error) {
        console.error('Error fetching active calls:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch active calls' });
    }
});

/**
 * GET /yeastar/inbound-calls
 * Get pending inbound calls
 */
router.get('/inbound-calls', (req, res) => {
    try {
        const calls = getPendingInboundCalls();
        res.json({ success: true, data: calls });
    } catch (error) {
        console.error('Error fetching inbound calls:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch inbound calls' });
    }
});

export default router;
