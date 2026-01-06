import axios from 'axios';
import logger from '../utils/logger.js';

class TokenService {
    constructor() {
        this.tokenCache = new Map();
        this.TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer
    }

    /**
     * Get a valid token for PBX API calls
     */
    async getValidToken(pbx) {
        const cacheKey = `${pbx.url}_${pbx.appId}`;
        const cached = this.tokenCache.get(cacheKey);
        
        // Check if we have a valid cached token
        if (cached && cached.expiresAt > Date.now() + this.TOKEN_EXPIRY_BUFFER) {
            return cached.token;
        }

        // Request new token
        console.log(`🔑 Requesting new token for ${pbx.name}`);
        
        let cleanUrl = pbx.url.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        cleanUrl = cleanUrl.replace(/\/$/, '');

        try {
            const tokenUrl = `${cleanUrl}/openapi/v1.0/get_token`;
            console.log(`🔗 Token URL: ${tokenUrl}`);
            console.log(`📋 Request payload: username=${pbx.appId}, password=[HIDDEN]`);
            
            const response = await axios.post(tokenUrl, {
                username: pbx.appId,
                password: pbx.appSecret
            }, {
                headers: { 'User-Agent': 'MSP-Dashboard/1.0' },
                timeout: 15000
            });

            console.log(`📊 Token response status: ${response.status}`);
            console.log(`📊 Token response data:`, response.data);

            if (response.data.errcode === 0) {
                const token = response.data.access_token;
                const expiresIn = response.data.expires_in || 7200; // Default 2 hours
                const expiresAt = Date.now() + (expiresIn * 1000);
                
                // Cache the token
                this.tokenCache.set(cacheKey, {
                    token,
                    expiresAt,
                    pbxName: pbx.name
                });
                
                console.log(`✅ Token obtained for ${pbx.name}, expires in ${Math.round(expiresIn/60)} minutes`);
                return token;
            } else {
                const errorMsg = `Token request failed: ${response.data.errmsg || response.data.errcode || 'Unknown error'}`;
                console.error(`❌ Token API error for ${pbx.name}:`, {
                    errcode: response.data.errcode,
                    errmsg: response.data.errmsg,
                    fullResponse: response.data
                });
                throw new Error(errorMsg);
            }
        } catch (error) {
            if (error.response) {
                console.error(`❌ Token HTTP error for ${pbx.name}:`, {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    url: `${cleanUrl}/openapi/v1.0/get_token`
                });
                throw new Error(`HTTP ${error.response.status}: ${error.response.data?.errmsg || error.response.statusText}`);
            } else if (error.code) {
                console.error(`❌ Network error for ${pbx.name}:`, {
                    code: error.code,
                    message: error.message,
                    url: `${cleanUrl}/openapi/v1.0/get_token`
                });
                throw new Error(`Network error (${error.code}): ${error.message}`);
            } else {
                console.error(`❌ Token request failed for ${pbx.name}:`, error.message);
                throw error;
            }
        }
    }

    /**
     * Clear token cache for a specific PBX
     */
    clearToken(pbx) {
        const cacheKey = `${pbx.url}_${pbx.appId}`;
        this.tokenCache.delete(cacheKey);
        console.log(`🗑️ Cleared token cache for ${pbx.name}`);
    }

    /**
     * Clear all expired tokens
     */
    cleanupExpiredTokens() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, cached] of this.tokenCache.entries()) {
            if (cached.expiresAt <= now) {
                this.tokenCache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired tokens`);
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        const tokens = Array.from(this.tokenCache.values());
        
        return {
            total: tokens.length,
            valid: tokens.filter(t => t.expiresAt > now + this.TOKEN_EXPIRY_BUFFER).length,
            expired: tokens.filter(t => t.expiresAt <= now).length
        };
    }
}

export const tokenService = new TokenService();