import axios from 'axios';
import { tokenService } from './TokenService.js';
import { rateLimitService } from './RateLimitService.js';

class SharedPBXService {
    constructor() {
        this.sharedPBXCache = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
    }

    /**
     * Check if a PBX URL is shared (multiple clients on same server)
     */
    isSharedPbx(pbxUrl, manualOverride = null) {
        // Manual override takes precedence
        if (manualOverride !== null) {
            return manualOverride;
        }

        const hostname = new URL(pbxUrl).hostname.toLowerCase();
        
        // Known shared PBX patterns
        const sharedPatterns = [
            /smart\d*\.pbx\.yeastarycm\.co\.za/,
            /smart\d*\.pbx\.ycmcloud\.co\.za/,
            /shared\.pbx\./,
            /multi\.pbx\./,
            /tenant\d*\./
        ];

        return sharedPatterns.some(pattern => pattern.test(hostname));
    }

    /**
     * Get shared PBX data with caching to avoid duplicate API calls
     */
    async getSharedPbxData(pbxUrl, token) {
        const hostname = new URL(pbxUrl).hostname;
        const cacheKey = `shared_${hostname}`;
        const cached = this.sharedPBXCache.get(cacheKey);
        
        // Return cached data if still valid
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            console.log(`📋 Using cached data for shared PBX: ${hostname}`);
            return cached.data;
        }

        console.log(`🔍 Fetching fresh data for shared PBX: ${hostname}`);
        
        try {
            // Get extensions and trunks data
            const [extensionsResponse, trunksResponse] = await Promise.all([
                this.fetchExtensions(pbxUrl, token),
                this.fetchTrunks(pbxUrl, token)
            ]);

            const systemInfo = {
                extensions: extensionsResponse?.data?.length || 0,
                registeredExtensions: extensionsResponse?.data?.filter(ext => 
                    ext.online_status === 'online' || ext.status === 1
                ).length || 0,
                trunks: trunksResponse?.data?.length || 0,
                activeTrunks: trunksResponse?.data?.filter(trunk => 
                    trunk.status === 1 || trunk.status === 'Active'
                ).length || 0,
                extensionDetails: extensionsResponse?.data || [],
                trunkDetails: trunksResponse?.data || []
            };

            // Cache the result
            this.sharedPBXCache.set(cacheKey, {
                data: systemInfo,
                timestamp: Date.now()
            });

            console.log(`📊 Shared PBX data cached for ${hostname}: ${systemInfo.extensions} ext, ${systemInfo.trunks} trunks`);
            return systemInfo;

        } catch (error) {
            console.error(`❌ Failed to fetch shared PBX data for ${hostname}:`, error.message);
            throw error;
        }
    }

    /**
     * Fetch extensions with multiple endpoint fallbacks
     */
    async fetchExtensions(pbxUrl, token) {
        const extensionQueries = [
            `${pbxUrl}/openapi/v1.0/extension/query?access_token=${token}`,
            `${pbxUrl}/openapi/v1.0/extension/query?access_token=${token}&type=all`,
            `${pbxUrl}/openapi/v1.0/extension/list?access_token=${token}`
        ];

        for (const url of extensionQueries) {
            try {
                const response = await axios.get(url, {
                    headers: { 'User-Agent': 'MSP-Dashboard/1.0' },
                    timeout: 10000
                });
                
                if (response.data.errcode === 0) {
                    console.log(`✅ Extensions query successful with: ${url}`);
                    return response.data;
                }
            } catch (error) {
                console.log(`❌ Extensions query failed with: ${url} - ${error.message}`);
            }
        }
        
        throw new Error('All extension endpoints failed');
    }

    /**
     * Fetch trunks with multiple endpoint fallbacks
     */
    async fetchTrunks(pbxUrl, token) {
        const trunkQueries = [
            `${pbxUrl}/openapi/v1.0/trunk/query?access_token=${token}`,
            `${pbxUrl}/openapi/v1.0/trunk/query?access_token=${token}&type=all`,
            `${pbxUrl}/openapi/v1.0/trunk/list?access_token=${token}`
        ];

        for (const url of trunkQueries) {
            try {
                const response = await axios.get(url, {
                    headers: { 'User-Agent': 'MSP-Dashboard/1.0' },
                    timeout: 10000
                });
                
                if (response.data.errcode === 0) {
                    console.log(`✅ Trunks query successful with: ${url}`);
                    return response.data;
                }
            } catch (error) {
                console.log(`❌ Trunks query failed with: ${url} - ${error.message}`);
            }
        }
        
        throw new Error('All trunk endpoints failed');
    }

    /**
     * Clear cache for a specific hostname
     */
    clearCache(pbxUrl) {
        const hostname = new URL(pbxUrl).hostname;
        const cacheKey = `shared_${hostname}`;
        this.sharedPBXCache.delete(cacheKey);
        console.log(`🗑️ Cleared shared PBX cache for ${hostname}`);
    }

    /**
     * Clear all expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, cached] of this.sharedPBXCache.entries()) {
            if (now - cached.timestamp > this.CACHE_DURATION) {
                this.sharedPBXCache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired shared PBX cache entries`);
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        const entries = Array.from(this.sharedPBXCache.values());
        
        return {
            total: entries.length,
            valid: entries.filter(e => now - e.timestamp < this.CACHE_DURATION).length,
            expired: entries.filter(e => now - e.timestamp >= this.CACHE_DURATION).length
        };
    }

    /**
     * Get all PBX instances that share the same server
     */
    getSharedPBXInstances(pbxInstances, targetUrl) {
        const targetHostname = new URL(targetUrl).hostname;
        return pbxInstances.filter(pbx => {
            try {
                return new URL(pbx.url).hostname === targetHostname;
            } catch {
                return false;
            }
        });
    }
}

export const sharedPBXService = new SharedPBXService();