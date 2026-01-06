import axios from 'axios';
import { tokenService } from './TokenService.js';
import { rateLimitService } from './RateLimitService.js';
import { sharedPBXService } from './SharedPBXService.js';
import { dbOperations } from '../database/database.js';

class HealthCheckService {
    constructor() {
        this.healthCheckInProgress = new Set();
    }

    /**
     * Check health of a single PBX instance
     */
    async checkPBXHealth(pbx) {
        // Prevent duplicate health checks for the same PBX
        if (this.healthCheckInProgress.has(pbx.id)) {
            console.log(`⏸️ Health check already in progress for ${pbx.name}`);
            return pbx.health || { status: 'pending', message: 'Check in progress' };
        }

        this.healthCheckInProgress.add(pbx.id);

        try {
            console.log(`🔍 Checking health for ${pbx.name} at ${pbx.url}`);
            
            // Skip API calls if credentials are placeholders
            if (pbx.appId === 'PLACEHOLDER_ID' || pbx.appSecret === 'PLACEHOLDER_SECRET' || 
                !pbx.appId || !pbx.appSecret) {
                console.log(`⏸️ Skipping API check for ${pbx.name} - No valid credentials`);
                return {
                    status: 'pending',
                    connected: false,
                    message: 'Waiting for API credentials',
                    lastCheck: new Date().toISOString(),
                    apiType: 'Credentials Required'
                };
            }

            console.log(`📋 Using credentials - App ID: ${pbx.appId}, Secret: ${pbx.appSecret ? '[PRESENT]' : '[MISSING]'}`);
            
            // Clean and validate URL
            let cleanUrl = pbx.url.trim();
            if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                cleanUrl = 'https://' + cleanUrl;
            }
            cleanUrl = cleanUrl.replace(/\/$/, '');
            
            // Check rate limiting before making API calls
            if (!rateLimitService.canMakeApiCall(cleanUrl)) {
                console.log(`⏱️ Rate limit reached for ${pbx.name}, skipping health check`);
                return {
                    status: 'error',
                    connected: false,
                    error: 'Rate limit exceeded - will retry later',
                    lastCheck: new Date().toISOString(),
                    apiType: 'Rate Limited'
                };
            }

            // Record the API call
            rateLimitService.recordApiCall(cleanUrl);

            // Get token for API calls
            const token = await tokenService.getValidToken(pbx);
            
            // Check if this is a shared PBX
            const isShared = sharedPBXService.isSharedPbx(cleanUrl, pbx.isShared);
            
            let systemInfo;
            if (isShared) {
                console.log(`🏢 ${pbx.name} is on shared PBX: ${new URL(cleanUrl).hostname} ${pbx.isShared ? '(Manual)' : '(Auto-detected)'}`);
                systemInfo = await sharedPBXService.getSharedPbxData(cleanUrl, token);
            } else {
                console.log(`🏠 ${pbx.name} is on dedicated PBX ${pbx.isShared === false ? '(Manual)' : '(Auto-detected)'}`);
                systemInfo = await this.getDedicatedPBXData(cleanUrl, token);
            }

            return {
                status: 'healthy',
                connected: true,
                systemInfo,
                lastCheck: new Date().toISOString(),
                apiType: 'YCM Cloud (K2 VoIP)',
                isShared
            };

        } catch (error) {
            console.error(`❌ Health check failed for ${pbx.name}:`, error.message);
            
            let errorMessage = this.parseErrorMessage(error);
            
            return {
                status: 'error',
                connected: false,
                error: errorMessage,
                lastCheck: new Date().toISOString()
            };
        } finally {
            this.healthCheckInProgress.delete(pbx.id);
        }
    }

    /**
     * Get data for dedicated PBX instances
     */
    async getDedicatedPBXData(cleanUrl, token) {
        try {
            const [extensionsResponse, trunksResponse] = await Promise.all([
                sharedPBXService.fetchExtensions(cleanUrl, token),
                sharedPBXService.fetchTrunks(cleanUrl, token)
            ]);

            return {
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
        } catch (error) {
            console.error('Failed to get dedicated PBX data:', error.message);
            throw error;
        }
    }

    /**
     * Parse error messages for better user feedback
     */
    parseErrorMessage(error) {
        let errorMessage = error.message;
        
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            if (status === 400) {
                errorMessage = `Bad Request (400): ${data?.message || data?.errmsg || 'Invalid request format'}`;
            } else if (status === 401) {
                errorMessage = `Unauthorized (401): ${data?.message || data?.errmsg || 'Invalid API credentials'}`;
            } else if (status === 403) {
                errorMessage = `Forbidden (403): ${data?.message || data?.errmsg || 'Check IP allowlist'}`;
            } else if (status === 404) {
                errorMessage = `Not Found (404): ${data?.message || data?.errmsg || 'API endpoint not found'}`;
            } else {
                errorMessage = `API error ${status}: ${data?.message || data?.errmsg || JSON.stringify(data) || 'Unknown error'}`;
            }
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = 'Connection refused - PBX unreachable';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = 'PBX hostname not found - Check URL format';
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'Connection timeout - PBX not responding';
        } else if (error.code === 'ECONNRESET') {
            errorMessage = 'Connection reset - Network issue';
        }

        return errorMessage;
    }

    /**
     * Check all PBX instances with optimized shared server handling
     */
    async checkAllPBX(pbxInstances) {
        if (pbxInstances.length === 0) {
            console.log('📊 No PBX instances to check');
            return;
        }

        console.log(`📊 Checking ${pbxInstances.length} PBX instances...`);

        // Group PBX instances by hostname to optimize shared server calls
        const pbxByHostname = new Map();
        for (const pbx of pbxInstances) {
            try {
                const hostname = new URL(pbx.url).hostname;
                if (!pbxByHostname.has(hostname)) {
                    pbxByHostname.set(hostname, []);
                }
                pbxByHostname.get(hostname).push(pbx);
            } catch (error) {
                console.error(`Invalid URL for ${pbx.name}: ${pbx.url}`);
            }
        }

        console.log(`🔍 Grouped into ${pbxByHostname.size} unique hostnames:`);
        for (const [hostname, pbxGroup] of pbxByHostname.entries()) {
            const sharedCount = pbxGroup.filter(pbx => 
                sharedPBXService.isSharedPbx(pbx.url, pbx.isShared)
            ).length;
            console.log(`  📍 ${hostname}: ${pbxGroup.length} instances (${sharedCount} shared)`);
        }

        // Process each hostname group
        for (const [hostname, pbxGroup] of pbxByHostname.entries()) {
            console.log(`🔍 Processing ${pbxGroup.length} PBX instances on ${hostname}`);
            
            // Check if any PBX in this group is shared
            const hasSharedPBX = pbxGroup.some(pbx => 
                sharedPBXService.isSharedPbx(pbx.url, pbx.isShared)
            );

            if (hasSharedPBX && pbxGroup.length > 1) {
                // For shared servers, only make one API call and share the data
                console.log(`🏢 Using shared PBX optimization for ${hostname} (${pbxGroup.length} clients)`);
                await this.processSharedPBXGroup(pbxGroup);
            } else {
                // For dedicated servers, process each PBX individually
                console.log(`🏠 Processing dedicated PBX instances for ${hostname}`);
                await this.processDedicatedPBXGroup(pbxGroup);
            }

            // Add delay between hostname groups to avoid overwhelming APIs
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('📡 Health check completed for all PBX instances');
    }

    /**
     * Process a group of PBX instances on the same shared server
     */
    async processSharedPBXGroup(pbxGroup) {
        console.log(`🏢 Processing shared PBX group: ${pbxGroup.length} instances`);
        
        // Find the first PBX with valid credentials to make the API call
        const validPBX = pbxGroup.find(pbx => 
            pbx.appId && pbx.appId !== 'PLACEHOLDER_ID' && 
            pbx.appSecret && pbx.appSecret !== 'PLACEHOLDER_SECRET'
        );

        if (!validPBX) {
            // No valid credentials, mark all as pending
            for (const pbx of pbxGroup) {
                pbx.status = 'pending';
                pbx.lastCheck = new Date().toISOString();
                pbx.health = {
                    status: 'pending',
                    message: 'Waiting for API credentials',
                    apiType: 'Credentials Required'
                };
                console.log(`  ${pbx.name}: pending (no credentials)`);
            }
            return;
        }

        try {
            // Make one API call for the shared server
            const health = await this.checkPBXHealth(validPBX);
            
            // Apply the same health data to all PBX instances on this server
            for (const pbx of pbxGroup) {
                if (pbx.appId === 'PLACEHOLDER_ID' || pbx.appSecret === 'PLACEHOLDER_SECRET' || 
                    !pbx.appId || !pbx.appSecret) {
                    // Keep pending status for PBX without credentials, but share the system info
                    pbx.status = 'pending';
                    pbx.health = {
                        status: 'pending',
                        message: 'Waiting for API credentials',
                        apiType: 'Credentials Required',
                        systemInfo: health.systemInfo, // Share the system info even for pending clients
                        sharedDataFrom: validPBX.name
                    };
                } else {
                    // Share the full health data for clients with credentials
                    pbx.status = health.status;
                    pbx.health = { ...health, sharedDataFrom: validPBX.name };
                }
                
                pbx.lastCheck = new Date().toISOString();
                
                // Record in database
                this.recordHealthCheck(pbx, pbx.health);
                
                console.log(`  ${pbx.name}: ${pbx.status}${pbx.health.sharedDataFrom ? ` (shared from ${pbx.health.sharedDataFrom})` : ''}`);
            }
            
        } catch (error) {
            // If the API call fails, mark all as error
            for (const pbx of pbxGroup) {
                pbx.status = 'error';
                pbx.lastCheck = new Date().toISOString();
                pbx.health = {
                    status: 'error',
                    error: error.message,
                    apiType: 'Shared Server Error'
                };
                
                this.recordHealthCheck(pbx, pbx.health);
                console.log(`  ${pbx.name}: error (${error.message})`);
            }
        }
    }

    /**
     * Process a group of dedicated PBX instances
     */
    async processDedicatedPBXGroup(pbxGroup) {
        for (let i = 0; i < pbxGroup.length; i++) {
            const pbx = pbxGroup[i];
            
            try {
                const health = await this.checkPBXHealth(pbx);
                pbx.status = health.status;
                pbx.lastCheck = health.lastCheck;
                pbx.health = health;
                
                this.recordHealthCheck(pbx, health);
                console.log(`  ${pbx.name}: ${health.status}`);
                
                // Add delay between individual PBX checks
                if (i < pbxGroup.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                pbx.status = 'error';
                pbx.lastCheck = new Date().toISOString();
                pbx.health = {
                    status: 'error',
                    error: error.message
                };
                
                this.recordHealthCheck(pbx, pbx.health);
                console.log(`  ${pbx.name}: error (${error.message})`);
            }
        }
    }

    /**
     * Record health check in database
     */
    recordHealthCheck(pbx, health) {
        try {
            const extensionsCount = health.systemInfo?.extensions || null;
            const trunksCount = health.systemInfo?.trunks || null;
            const errorMessage = health.error || null;
            
            dbOperations.recordHealthCheck(
                pbx.id, 
                health.status, 
                null, // response time - could be added later
                errorMessage,
                extensionsCount,
                trunksCount
            );
            
            // Update PBX health in database
            dbOperations.updatePBXHealth(pbx.id, health.status, health);
            
        } catch (dbError) {
            console.error(`❌ Failed to record health check for ${pbx.name}:`, dbError.message);
        }
    }
}

export const healthCheckService = new HealthCheckService();