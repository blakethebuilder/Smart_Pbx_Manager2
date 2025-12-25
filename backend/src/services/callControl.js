import axios from 'axios';
import { getToken, handle401 } from './yeastarAuth.js';
import db from '../config/database.js';

/**
 * Call Control Service
 * Handles accepting and refusing inbound calls
 */

/**
 * Make authenticated API request to PBX
 */
async function makeCallControlRequest(pbxId, endpoint, data = {}) {
    const pbx = db.prepare('SELECT * FROM pbx_instances WHERE id = ?').get(pbxId);

    if (!pbx) {
        throw new Error('PBX instance not found');
    }

    try {
        const token = await getToken(pbxId);

        const response = await axios.post(
            `${pbx.url}/openapi/v1.0${endpoint}`,
            data,
            {
                headers: {
                    'User-Agent': 'OpenAPI',
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 5000 // 5 second timeout for call control
            }
        );

        // Check for error response
        if (response.data && response.data.errcode && response.data.errcode !== 0) {
            throw new Error(`PBX API Error (${response.data.errcode}): ${response.data.errmsg}`);
        }

        return response.data;
    } catch (error) {
        // Handle 401 - token expired
        if (error.response && error.response.status === 401) {
            console.log('Received 401, refreshing token and retrying...');
            const newToken = await handle401(pbxId);

            // Retry with new token
            const response = await axios.post(
                `${pbx.url}/openapi/v1.0${endpoint}`,
                data,
                {
                    headers: {
                        'User-Agent': 'OpenAPI',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${newToken}`
                    },
                    timeout: 5000
                }
            );

            if (response.data && response.data.errcode && response.data.errcode !== 0) {
                throw new Error(`PBX API Error (${response.data.errcode}): ${response.data.errmsg}`);
            }

            return response.data;
        }

        console.error(`Call control error for PBX ${pbx.name}:`, error.message);
        throw error;
    }
}

/**
 * Accept an inbound call
 */
export async function acceptCall(pbxId, callId) {
    console.log(`✅ Accepting call ${callId} on PBX ${pbxId}`);

    try {
        const result = await makeCallControlRequest(pbxId, '/call/accept', {
            call_id: callId
        });

        console.log(`✅ Call ${callId} accepted successfully`);
        return { success: true, data: result };
    } catch (error) {
        console.error(`Failed to accept call ${callId}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Refuse an inbound call
 */
export async function refuseCall(pbxId, callId) {
    console.log(`❌ Refusing call ${callId} on PBX ${pbxId}`);

    try {
        const result = await makeCallControlRequest(pbxId, '/call/refuse', {
            call_id: callId
        });

        console.log(`❌ Call ${callId} refused successfully`);
        return { success: true, data: result };
    } catch (error) {
        console.error(`Failed to refuse call ${callId}:`, error.message);
        return { success: false, error: error.message };
    }
}
