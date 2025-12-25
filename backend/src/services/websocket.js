import { WebSocketServer } from 'ws';

/**
 * WebSocket Service for Real-Time Updates
 * Broadcasts events to connected clients
 */

let wss = null;
const clients = new Set();

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws) => {
        console.log('🔌 WebSocket client connected');
        clients.add(ws);

        // Send initial connection confirmation
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'WebSocket connection established',
            timestamp: Date.now()
        }));

        ws.on('close', () => {
            console.log('🔌 WebSocket client disconnected');
            clients.delete(ws);
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            clients.delete(ws);
        });
    });

    console.log('✅ WebSocket server initialized on /ws');
    return wss;
}

/**
 * Broadcast event to all connected clients
 */
export function broadcast(event) {
    if (!wss) {
        console.warn('WebSocket server not initialized');
        return;
    }

    const message = JSON.stringify({
        ...event,
        timestamp: Date.now()
    });

    let sentCount = 0;
    clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(message);
            sentCount++;
        }
    });

    if (sentCount > 0) {
        console.log(`📡 Broadcast to ${sentCount} client(s): ${event.type}`);
    }
}

/**
 * Broadcast extension status change
 */
export function broadcastExtensionStatus(extension, status, callInfo = null) {
    broadcast({
        type: 'extension_status',
        extension,
        status,
        callInfo
    });
}

/**
 * Broadcast trunk status change
 */
export function broadcastTrunkStatus(trunk, status) {
    broadcast({
        type: 'trunk_status',
        trunk,
        status
    });
}

/**
 * Broadcast active call update
 */
export function broadcastCallUpdate(callId, state, from, to, trunk) {
    broadcast({
        type: 'call_update',
        callId,
        state,
        from,
        to,
        trunk
    });
}

/**
 * Broadcast inbound call request (URGENT)
 */
export function broadcastInboundCall(callId, from, to, trunk, expiresAt) {
    broadcast({
        type: 'inbound_call_request',
        callId,
        from,
        to,
        trunk,
        expiresAt,
        urgent: true
    });
}

/**
 * Get connected client count
 */
export function getClientCount() {
    return clients.size;
}
