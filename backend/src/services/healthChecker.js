import axios from 'axios';
import { getToken } from './tokenCache.js';

/**
 * Health Checker Service
 * Fetches health status for a PBX instance
 */

/**
 * Make authenticated API request
 */
async function makeApiRequest(pbx, endpoint) {
    const token = await getToken(pbx);

    const response = await axios.post(
        `${pbx.url}/openapi/v1.0${endpoint}`,
        {},
        {
            headers: {
                'User-Agent': 'OpenAPI',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000
        }
    );

    if (response.data && response.data.errcode && response.data.errcode !== 0) {
        throw new Error(`API Error (${response.data.errcode}): ${response.data.errmsg}`);
    }

    return response.data;
}

/**
 * Get trunk status
 */
async function getTrunkStatus(pbx) {
    try {
        const data = await makeApiRequest(pbx, '/trunk/query');

        if (data && data.data && Array.isArray(data.data)) {
            const trunks = data.data;
            const registered = trunks.filter(t => t.status === 'Registered').length;

            return {
                total: trunks.length,
                registered,
                offline: trunks.length - registered
            };
        }

        return { total: 0, registered: 0, offline: 0 };
    } catch (error) {
        throw new Error(`Trunk status error: ${error.message}`);
    }
}

/**
 * Get extension stats
 */
async function getExtensionStats(pbx) {
    try {
        const data = await makeApiRequest(pbx, '/extension/query');

        if (data && data.data && Array.isArray(data.data)) {
            const extensions = data.data;
            const online = extensions.filter(e => e.status === 'Registered').length;

            return {
                total: extensions.length,
                online,
                offline: extensions.length - online
            };
        }

        return { total: 0, online: 0, offline: 0 };
    } catch (error) {
        throw new Error(`Extension stats error: ${error.message}`);
    }
}

/**
 * Get concurrent call count
 */
async function getConcurrentCalls(pbx) {
    try {
        const data = await makeApiRequest(pbx, '/call/query');

        if (data && data.data && Array.isArray(data.data)) {
            return {
                active: data.data.length
            };
        }

        return { active: 0 };
    } catch (error) {
        throw new Error(`Concurrent calls error: ${error.message}`);
    }
}

/**
 * Get system capacity (license limits)
 */
async function getSystemCapacity(pbx) {
    try {
        const data = await makeApiRequest(pbx, '/system/query_capacity');

        if (data && data.data) {
            return {
                maxCalls: data.data.max_concurrent_calls || 30,
                maxExtensions: data.data.max_extensions || 50
            };
        }

        return { maxCalls: 30, maxExtensions: 50 };
    } catch (error) {
        // Return defaults if capacity query fails
        return { maxCalls: 30, maxExtensions: 50 };
    }
}

/**
 * Check overall health for a PBX
 */
export async function checkHealth(pbx) {
    try {
        // Fetch all data in parallel
        const [trunks, extensions, calls, capacity] = await Promise.all([
            getTrunkStatus(pbx),
            getExtensionStats(pbx),
            getConcurrentCalls(pbx),
            getSystemCapacity(pbx)
        ]);

        // Determine overall status
        let status = 'healthy'; // green
        const issues = [];

        // Check trunks
        if (trunks.offline > 0) {
            status = 'warning'; // yellow
            issues.push(`${trunks.offline} trunk(s) offline`);
        }

        // Check if all trunks are down
        if (trunks.total > 0 && trunks.registered === 0) {
            status = 'critical'; // red
            issues.push('All trunks offline');
        }

        // Check call capacity
        const callUsagePercent = (calls.active / capacity.maxCalls) * 100;
        if (callUsagePercent > 80) {
            if (status === 'healthy') status = 'warning';
            issues.push(`High call usage: ${callUsagePercent.toFixed(0)}%`);
        }

        return {
            status,
            connected: true,
            issues,
            trunks: {
                registered: trunks.registered,
                total: trunks.total
            },
            extensions: {
                online: extensions.online,
                total: extensions.total
            },
            calls: {
                active: calls.active,
                max: capacity.maxCalls
            },
            lastCheck: new Date().toISOString()
        };
    } catch (error) {
        console.error(`Health check failed for ${pbx.name}:`, error.message);

        return {
            status: 'error',
            connected: false,
            issues: [error.message],
            trunks: { registered: 0, total: 0 },
            extensions: { online: 0, total: 0 },
            calls: { active: 0, max: 0 },
            lastCheck: new Date().toISOString()
        };
    }
}
