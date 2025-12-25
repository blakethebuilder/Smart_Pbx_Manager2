import { getAllPBXs } from './pbxStorage.js';
import { checkHealth } from './healthChecker.js';

/**
 * Background Poller
 * Polls all PBXs every 60 seconds and emits updates via Socket.io
 */

let io = null;
let pollerInterval = null;
const POLL_INTERVAL = 60000; // 60 seconds

/**
 * Initialize background poller
 */
export function initializePoller(socketio) {
    io = socketio;

    console.log('🔄 Starting background poller (60-second interval)');

    // Run immediately on start
    pollAllPBXs();

    // Then poll every 60 seconds
    pollerInterval = setInterval(pollAllPBXs, POLL_INTERVAL);
}

/**
 * Poll all PBXs
 */
async function pollAllPBXs() {
    const pbxs = getAllPBXs();

    if (pbxs.length === 0) {
        console.log('No PBXs configured, skipping poll');
        return;
    }

    console.log(`📊 Polling ${pbxs.length} PBX instance(s)...`);

    const results = [];

    for (const pbx of pbxs) {
        try {
            const health = await checkHealth(pbx);

            results.push({
                id: pbx.id,
                name: pbx.name,
                url: pbx.url,
                health
            });

            console.log(`  ✅ ${pbx.name}: ${health.status}`);
        } catch (error) {
            console.error(`  ❌ ${pbx.name}: ${error.message}`);

            results.push({
                id: pbx.id,
                name: pbx.name,
                url: pbx.url,
                health: {
                    status: 'error',
                    connected: false,
                    issues: [error.message],
                    trunks: { registered: 0, total: 0 },
                    extensions: { online: 0, total: 0 },
                    calls: { active: 0, max: 0 },
                    lastCheck: new Date().toISOString()
                }
            });
        }
    }

    // Emit to all connected clients
    if (io) {
        io.emit('fleet-update', results);
        console.log(`📡 Emitted fleet update to all clients`);
    }
}

/**
 * Stop poller
 */
export function stopPoller() {
    if (pollerInterval) {
        clearInterval(pollerInterval);
        pollerInterval = null;
        console.log('🛑 Background poller stopped');
    }
}

/**
 * Trigger immediate poll (useful after adding/updating PBX)
 */
export function triggerImmediatePoll() {
    console.log('⚡ Triggering immediate poll...');
    pollAllPBXs();
}
