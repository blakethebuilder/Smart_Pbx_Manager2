import axios from 'axios';
import db from '../config/database.js';
import { getToken } from './yeastarAuth.js';

/**
 * PBX Monitoring Service
 * Fetches real-time data from Yeastar PBX instances
 */

/**
 * Make an authenticated API request to a PBX
 */
async function makeApiRequest(pbxId, endpoint) {
    const pbx = db.prepare('SELECT * FROM pbx_instances WHERE id = ?').get(pbxId);

    if (!pbx) {
        throw new Error('PBX instance not found');
    }

    try {
        const token = await getToken(pbxId);

        const response = await axios.post(
            `${pbx.url}/openapi/v1.0${endpoint}`,
            {},
            {
                headers: {
                    'User-Agent': 'SmartPBXManager',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 10000 // 10 second timeout
            }
        );

        return response.data;
    } catch (error) {
        console.error(`API request error for PBX ${pbx.name}:`, error.message);
        throw error;
    }
}

/**
 * Get trunk status for a PBX
 */
export async function getTrunkStatus(pbxId) {
    try {
        const data = await makeApiRequest(pbxId, '/trunk/query');

        if (data && data.data && Array.isArray(data.data)) {
            const trunks = data.data;
            const online = trunks.filter(t => t.status === 'Registered' || t.status === 'idle').length;
            const offline = trunks.filter(t => t.status === 'Unreachable' || t.status === 'disabled').length;

            return {
                total: trunks.length,
                online,
                offline,
                trunks: trunks.map(t => ({
                    name: t.name,
                    status: t.status,
                    type: t.type
                }))
            };
        }

        return { total: 0, online: 0, offline: 0, trunks: [] };
    } catch (error) {
        console.error('Error fetching trunk status:', error.message);
        return { total: 0, online: 0, offline: 0, trunks: [], error: error.message };
    }
}

/**
 * Get extension statistics for a PBX
 */
export async function getExtensionStats(pbxId) {
    try {
        const data = await makeApiRequest(pbxId, '/extension/query');

        if (data && data.data && Array.isArray(data.data)) {
            const extensions = data.data;
            const registered = extensions.filter(e => e.status === 'Registered').length;

            return {
                total: extensions.length,
                registered,
                unregistered: extensions.length - registered
            };
        }

        return { total: 0, registered: 0, unregistered: 0 };
    } catch (error) {
        console.error('Error fetching extension stats:', error.message);
        return { total: 0, registered: 0, unregistered: 0, error: error.message };
    }
}

/**
 * Get concurrent call count for a PBX
 */
export async function getConcurrentCalls(pbxId) {
    try {
        const data = await makeApiRequest(pbxId, '/call/query');

        if (data && data.data && Array.isArray(data.data)) {
            return {
                active: data.data.length,
                calls: data.data.map(c => ({
                    from: c.from,
                    to: c.to,
                    status: c.status
                }))
            };
        }

        return { active: 0, calls: [] };
    } catch (error) {
        console.error('Error fetching concurrent calls:', error.message);
        return { active: 0, calls: [], error: error.message };
    }
}

/**
 * Get PBX capacity information
 */
export async function getPBXCapacity(pbxId) {
    try {
        const data = await makeApiRequest(pbxId, '/system/query_capacity');

        if (data && data.data) {
            return {
                maxConcurrentCalls: data.data.max_concurrent_calls || 0,
                maxExtensions: data.data.max_extensions || 0
            };
        }

        return { maxConcurrentCalls: 0, maxExtensions: 0 };
    } catch (error) {
        console.error('Error fetching PBX capacity:', error.message);
        return { maxConcurrentCalls: 0, maxExtensions: 0, error: error.message };
    }
}

/**
 * Get overall health status for a PBX
 */
export async function getHealthStatus(pbxId) {
    try {
        const [trunks, extensions, calls] = await Promise.all([
            getTrunkStatus(pbxId),
            getExtensionStats(pbxId),
            getConcurrentCalls(pbxId)
        ]);

        // Determine health status
        let status = 'healthy';
        let issues = [];

        if (trunks.error || extensions.error || calls.error) {
            status = 'error';
            issues.push('Unable to connect to PBX');
        } else {
            if (trunks.offline > 0) {
                status = 'warning';
                issues.push(`${trunks.offline} trunk(s) offline`);
            }

            if (extensions.total > 0 && extensions.registered === 0) {
                status = 'critical';
                issues.push('No extensions registered');
            }
        }

        return {
            status,
            issues,
            trunks,
            extensions,
            calls
        };
    } catch (error) {
        return {
            status: 'error',
            issues: ['Failed to fetch health status'],
            error: error.message
        };
    }
}

/**
 * Get complete dashboard data for all PBX instances
 */
export async function getAllPBXStatus() {
    const instances = db.prepare('SELECT * FROM pbx_instances').all();

    const statusPromises = instances.map(async (pbx) => {
        try {
            const health = await getHealthStatus(pbx.id);
            return {
                id: pbx.id,
                name: pbx.name,
                url: pbx.url,
                ...health
            };
        } catch (error) {
            return {
                id: pbx.id,
                name: pbx.name,
                url: pbx.url,
                status: 'error',
                issues: ['Failed to fetch status'],
                error: error.message
            };
        }
    });

    return await Promise.all(statusPromises);
}
