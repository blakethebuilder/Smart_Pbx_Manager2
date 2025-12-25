import crypto from 'crypto';
import axios from 'axios';

/**
 * Safety-First Token Cache
 * Minimizes API requests to prevent IP blocking
 */

// In-memory token storage
const tokenCache = new Map();

// Minimum time between token requests (60 seconds)
const MIN_REQUEST_INTERVAL = 60000;

// Token lifetime (30 minutes)
const TOKEN_LIFETIME = 1800000;

/**
 * Hash password to MD5 (required by Yeastar)
 */
function hashPassword(password) {
    return crypto.createHash('md5').update(password).digest('hex').toLowerCase();
}

/**
 * Get cached token if valid
 */
export function getCachedToken(pbxId) {
    const cached = tokenCache.get(pbxId);

    if (!cached) {
        return null;
    }

    const now = Date.now();

    // Check if token is still valid (with 2-minute buffer)
    if (cached.expiresAt > now + 120000) {
        return cached.accessToken;
    }

    return null;
}

/**
 * Request new token from Yeastar API
 */
async function requestToken(url, appId, appSecret) {
    const hashedSecret = hashPassword(appSecret);

    const response = await axios.post(
        `${url}/openapi/v1.0/get_token`,
        {
            username: appId,
            password: hashedSecret
        },
        {
            headers: {
                'User-Agent': 'OpenAPI',
                'Content-Type': 'application/json'
            },
            timeout: 15000
        }
    );

    // Check for error response
    if (response.data && response.data.errcode) {
        throw new Error(`API Error (${response.data.errcode}): ${response.data.errmsg}`);
    }

    if (response.data && response.data.access_token) {
        return {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token
        };
    }

    throw new Error('Invalid response from Yeastar API');
}

/**
 * Get token with safety-first caching
 * Only requests new token if:
 * 1. No cached token exists
 * 2. Cached token is expired
 * 3. At least 60 seconds have passed since last request
 */
export async function getToken(pbx) {
    const { id, url, appId, appSecret } = pbx;

    // Check cache first
    const cachedToken = getCachedToken(id);
    if (cachedToken) {
        return cachedToken;
    }

    const cached = tokenCache.get(id);
    const now = Date.now();

    // Enforce minimum request interval
    if (cached && cached.lastRequestTime) {
        const timeSinceLastRequest = now - cached.lastRequestTime;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            // Too soon to request again, return expired token or throw
            if (cached.accessToken) {
                console.warn(`Using potentially expired token for PBX ${id} (rate limiting)`);
                return cached.accessToken;
            }
            throw new Error(`Rate limit: Must wait ${Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000)}s before next request`);
        }
    }

    // Request new token
    console.log(`Requesting new token for PBX: ${pbx.name}`);

    try {
        const tokens = await requestToken(url, appId, appSecret);

        // Cache the token
        tokenCache.set(id, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: now + TOKEN_LIFETIME,
            lastRequestTime: now
        });

        console.log(`✅ Token cached for PBX: ${pbx.name}`);

        return tokens.accessToken;
    } catch (error) {
        // Update last request time even on failure
        if (cached) {
            cached.lastRequestTime = now;
        } else {
            tokenCache.set(id, { lastRequestTime: now });
        }

        throw error;
    }
}

/**
 * Clear token cache for a PBX (useful after credential changes)
 */
export function clearToken(pbxId) {
    tokenCache.delete(pbxId);
    console.log(`Token cache cleared for PBX: ${pbxId}`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    const stats = [];

    for (const [pbxId, data] of tokenCache.entries()) {
        const now = Date.now();
        stats.push({
            pbxId,
            hasToken: !!data.accessToken,
            expiresIn: data.expiresAt ? Math.max(0, data.expiresAt - now) : 0,
            lastRequestTime: data.lastRequestTime
        });
    }

    return stats;
}
