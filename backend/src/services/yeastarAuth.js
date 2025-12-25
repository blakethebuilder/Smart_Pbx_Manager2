import axios from 'axios';
import crypto from 'crypto';
import db from '../config/database.js';

/**
 * Enhanced Yeastar API Authentication Service
 * Features:
 * - Strict in-memory token caching
 * - Circuit breaker pattern to prevent IP blocking
 * - Only requests new tokens when expired or on 401
 * - User-Agent: OpenAPI on all requests
 */

// In-memory token cache
const tokenCache = new Map();

// Circuit breaker state per PBX
const circuitBreakers = new Map();

// Circuit breaker states
const CIRCUIT_STATE = {
    CLOSED: 'CLOSED',     // Normal operation
    OPEN: 'OPEN',         // Blocked after critical error
    HALF_OPEN: 'HALF_OPEN' // Testing after timeout
};

// Circuit breaker configuration
const CIRCUIT_CONFIG = {
    TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 300000, // 5 minutes default
    FAILURE_THRESHOLD: 3,
    SUCCESS_THRESHOLD: 2
};

/**
 * Get circuit breaker for a PBX
 */
function getCircuitBreaker(pbxId) {
    if (!circuitBreakers.has(pbxId)) {
        circuitBreakers.set(pbxId, {
            state: CIRCUIT_STATE.CLOSED,
            failureCount: 0,
            successCount: 0,
            lastFailureTime: null,
            lastError: null
        });
    }
    return circuitBreakers.get(pbxId);
}

/**
 * Check if circuit breaker allows requests
 */
function canMakeRequest(pbxId) {
    const breaker = getCircuitBreaker(pbxId);

    if (breaker.state === CIRCUIT_STATE.CLOSED) {
        return { allowed: true };
    }

    if (breaker.state === CIRCUIT_STATE.OPEN) {
        const timeSinceFailure = Date.now() - breaker.lastFailureTime;

        if (timeSinceFailure > CIRCUIT_CONFIG.TIMEOUT) {
            // Move to half-open state for testing
            breaker.state = CIRCUIT_STATE.HALF_OPEN;
            breaker.successCount = 0;
            console.log(`Circuit breaker for PBX ${pbxId} moved to HALF_OPEN state`);
            return { allowed: true, testing: true };
        }

        return {
            allowed: false,
            error: `Circuit breaker is OPEN for PBX ${pbxId}. Last error: ${breaker.lastError}. Retry after ${Math.ceil((CIRCUIT_CONFIG.TIMEOUT - timeSinceFailure) / 1000)}s`
        };
    }

    // HALF_OPEN state - allow one request
    return { allowed: true, testing: true };
}

/**
 * Record successful request
 */
function recordSuccess(pbxId) {
    const breaker = getCircuitBreaker(pbxId);

    if (breaker.state === CIRCUIT_STATE.HALF_OPEN) {
        breaker.successCount++;

        if (breaker.successCount >= CIRCUIT_CONFIG.SUCCESS_THRESHOLD) {
            breaker.state = CIRCUIT_STATE.CLOSED;
            breaker.failureCount = 0;
            console.log(`✅ Circuit breaker for PBX ${pbxId} CLOSED - recovered`);
        }
    } else {
        breaker.failureCount = 0;
    }
}

/**
 * Record failed request
 */
function recordFailure(pbxId, error, isCritical = false) {
    const breaker = getCircuitBreaker(pbxId);
    breaker.failureCount++;
    breaker.lastFailureTime = Date.now();
    breaker.lastError = error;

    if (isCritical) {
        breaker.state = CIRCUIT_STATE.OPEN;
        console.error(`🚨 CRITICAL: Circuit breaker OPENED for PBX ${pbxId} - ${error}`);
        console.error(`🚨 Manual intervention required. Check credentials and IP allowlist.`);
    } else if (breaker.failureCount >= CIRCUIT_CONFIG.FAILURE_THRESHOLD) {
        breaker.state = CIRCUIT_STATE.OPEN;
        console.error(`⚠️  Circuit breaker OPENED for PBX ${pbxId} after ${breaker.failureCount} failures`);
    }
}

/**
 * Manually reset circuit breaker (admin action)
 */
export function resetCircuitBreaker(pbxId) {
    const breaker = getCircuitBreaker(pbxId);
    breaker.state = CIRCUIT_STATE.CLOSED;
    breaker.failureCount = 0;
    breaker.successCount = 0;
    breaker.lastFailureTime = null;
    breaker.lastError = null;
    console.log(`Circuit breaker for PBX ${pbxId} manually reset`);
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus(pbxId) {
    const breaker = getCircuitBreaker(pbxId);
    return {
        state: breaker.state,
        failureCount: breaker.failureCount,
        lastError: breaker.lastError,
        lastFailureTime: breaker.lastFailureTime,
        canRetryIn: breaker.state === CIRCUIT_STATE.OPEN
            ? Math.max(0, CIRCUIT_CONFIG.TIMEOUT - (Date.now() - breaker.lastFailureTime))
            : 0
    };
}

// Hash password to MD5 (required by Yeastar API)
function hashPassword(password) {
    return crypto.createHash('md5').update(password).digest('hex').toLowerCase();
}

// Get current timestamp in seconds
function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Get cached token if valid
 */
function getCachedToken(pbxId) {
    const cached = tokenCache.get(pbxId);

    if (!cached) {
        return null;
    }

    const now = getCurrentTimestamp();

    // Token is valid if it expires more than 60 seconds from now
    if (cached.expiresAt > now + 60) {
        console.log(`Using cached token for PBX ${pbxId} (expires in ${cached.expiresAt - now}s)`);
        return cached.accessToken;
    }

    console.log(`Cached token for PBX ${pbxId} expired or expiring soon`);
    return null;
}

/**
 * Cache token
 */
function cacheToken(pbxId, accessToken, refreshToken, expiresIn) {
    const expiresAt = getCurrentTimestamp() + expiresIn;

    tokenCache.set(pbxId, {
        accessToken,
        refreshToken,
        expiresAt,
        cachedAt: getCurrentTimestamp()
    });

    console.log(`Token cached for PBX ${pbxId} (expires at ${new Date(expiresAt * 1000).toISOString()})`);
}

/**
 * Clear cached token
 */
function clearCachedToken(pbxId) {
    tokenCache.delete(pbxId);
    console.log(`Cleared cached token for PBX ${pbxId}`);
}

/**
 * Authenticate with Yeastar API and get tokens
 */
export async function authenticate(url, clientId, clientSecret, pbxId = null) {
    // Check circuit breaker if pbxId provided
    if (pbxId) {
        const circuitCheck = canMakeRequest(pbxId);
        if (!circuitCheck.allowed) {
            throw new Error(circuitCheck.error);
        }
    }

    try {
        const hashedSecret = hashPassword(clientSecret);

        console.log(`Attempting authentication to: ${url}`);

        const response = await axios.post(
            `${url}/openapi/v1.0/get_token`,
            {
                username: clientId,
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

        // Check for Yeastar error response format
        if (response.data && response.data.errcode) {
            const errorCode = response.data.errcode;
            const errorMsg = response.data.errmsg;

            // Critical errors that should open circuit breaker
            const criticalErrors = {
                20003: 'Invalid credentials. Please check your Client ID and Client Secret.',
                10006: 'IP address not allowed. Please check IP restrictions in PBX API settings.',
            };

            // Non-critical errors
            const errorMessages = {
                70123: 'API is not enabled on this PBX. Please enable API access in Integrations > API settings.',
                10003: 'Invalid credentials. Please check your Client ID and Client Secret.',
                10004: 'Authentication failed. Please verify your credentials.',
            };

            const isCritical = criticalErrors.hasOwnProperty(errorCode);
            const message = criticalErrors[errorCode] || errorMessages[errorCode] ||
                `PBX API Error (${errorCode}): ${errorMsg}`;

            console.error('Yeastar API error:', response.data);

            if (pbxId) {
                recordFailure(pbxId, message, isCritical);
            }

            throw new Error(message);
        }

        // Check for successful response with tokens
        if (response.data && response.data.access_token) {
            console.log('✅ Authentication successful');

            if (pbxId) {
                recordSuccess(pbxId);
                cacheToken(pbxId, response.data.access_token, response.data.refresh_token, 1800);
            }

            return {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresIn: 1800
            };
        }

        // Unexpected response format
        console.error('Unexpected API response:', response.data);
        throw new Error('Invalid response from Yeastar API. Please verify the PBX URL is correct.');
    } catch (error) {
        // Handle axios errors
        if (error.response) {
            console.error('API Response Error:', error.response.status, error.response.data);

            if (pbxId) {
                recordFailure(pbxId, `HTTP ${error.response.status}`);
            }

            throw new Error(`PBX returned error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            console.error('No response from PBX:', error.message);

            if (pbxId) {
                recordFailure(pbxId, 'Connection failed');
            }

            throw new Error('Cannot connect to PBX. Please verify the URL is correct and the PBX is accessible.');
        } else if (error.message) {
            // Re-throw our custom error messages
            throw error;
        }

        console.error('Authentication error:', error.message);
        throw new Error(`Failed to authenticate: ${error.message}`);
    }
}

/**
 * Refresh an expired access token
 */
export async function refreshAccessToken(url, refreshToken, pbxId = null) {
    // Check circuit breaker if pbxId provided
    if (pbxId) {
        const circuitCheck = canMakeRequest(pbxId);
        if (!circuitCheck.allowed) {
            throw new Error(circuitCheck.error);
        }
    }

    try {
        const response = await axios.post(
            `${url}/openapi/v1.0/refresh_token`,
            {
                refresh_token: refreshToken
            },
            {
                headers: {
                    'User-Agent': 'OpenAPI',
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            }
        );

        // Check for Yeastar error response
        if (response.data && response.data.errcode) {
            console.error('Token refresh error:', response.data);
            throw new Error(`Token refresh failed: ${response.data.errmsg}`);
        }

        if (response.data && response.data.access_token) {
            console.log('✅ Token refreshed successfully');

            if (pbxId) {
                recordSuccess(pbxId);
                cacheToken(pbxId, response.data.access_token, response.data.refresh_token, 1800);
            }

            return {
                accessToken: response.data.access_token,
                refreshToken: response.data.refresh_token,
                expiresIn: 1800
            };
        }

        throw new Error('Invalid refresh response');
    } catch (error) {
        if (error.message) {
            throw error;
        }
        console.error('Token refresh error:', error.message);
        throw new Error(`Failed to refresh token: ${error.message}`);
    }
}

/**
 * Get a valid access token for a PBX instance
 * STRICT CACHING: Only requests new token if expired or on 401
 */
export async function getToken(pbxId) {
    // Check circuit breaker first
    const circuitCheck = canMakeRequest(pbxId);
    if (!circuitCheck.allowed) {
        throw new Error(circuitCheck.error);
    }

    // Check in-memory cache first
    const cachedToken = getCachedToken(pbxId);
    if (cachedToken) {
        return cachedToken;
    }

    // Get PBX instance details
    const pbx = db.prepare('SELECT * FROM pbx_instances WHERE id = ?').get(pbxId);

    if (!pbx) {
        throw new Error('PBX instance not found');
    }

    // Check if we have a refresh token in cache
    const cached = tokenCache.get(pbxId);

    if (cached && cached.refreshToken) {
        // Try to refresh
        try {
            console.log(`Attempting to refresh token for PBX ${pbxId}`);
            const tokens = await refreshAccessToken(pbx.url, cached.refreshToken, pbxId);
            return tokens.accessToken;
        } catch (error) {
            console.log('Token refresh failed, will re-authenticate');
            clearCachedToken(pbxId);
        }
    }

    // No valid token, authenticate
    console.log(`No valid token for PBX ${pbxId}, authenticating...`);
    const tokens = await authenticate(pbx.url, pbx.client_id, pbx.client_secret, pbxId);
    return tokens.accessToken;
}

/**
 * Handle 401 Unauthorized - clear cache and retry once
 */
export async function handle401(pbxId) {
    console.log(`Received 401 for PBX ${pbxId}, clearing token cache`);
    clearCachedToken(pbxId);

    // Get fresh token
    return await getToken(pbxId);
}

/**
 * Test authentication with provided credentials
 */
export function testAuthentication(url, clientId, clientSecret) {
    return authenticate(url, clientId, clientSecret, null);
}
