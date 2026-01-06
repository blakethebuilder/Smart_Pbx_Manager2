import { dbOperations } from '../database/database.js';

class RateLimitService {
    constructor() {
        this.apiCallTracker = new Map();
        this.MAX_CALLS_PER_WINDOW = 6;
        this.WINDOW_MINUTES = 30;
    }

    /**
     * Check if we can make an API call for this PBX URL
     */
    canMakeApiCall(pbxUrl) {
        const now = Date.now();
        const key = new URL(pbxUrl).hostname;
        const tracker = this.apiCallTracker.get(key) || { calls: [], lastReset: now };
        
        // Clean up calls older than 30 minutes
        const windowMs = this.WINDOW_MINUTES * 60 * 1000;
        tracker.calls = tracker.calls.filter(callTime => now - callTime < windowMs);
        
        // Check if we're under the limit
        const canCall = tracker.calls.length < this.MAX_CALLS_PER_WINDOW;
        
        if (!canCall) {
            const oldestCall = Math.min(...tracker.calls);
            const resetTime = new Date(oldestCall + windowMs);
            console.log(`⏱️ Rate limit reached for ${key}. Next call available at: ${resetTime.toLocaleTimeString()}`);
        }
        
        return canCall;
    }

    /**
     * Record an API call for rate limiting
     */
    recordApiCall(pbxUrl) {
        const now = Date.now();
        const key = new URL(pbxUrl).hostname;
        const tracker = this.apiCallTracker.get(key) || { calls: [], lastReset: now };
        
        tracker.calls.push(now);
        this.apiCallTracker.set(key, tracker);
        
        // Also record in database for persistence
        try {
            dbOperations.recordAPICall(pbxUrl);
        } catch (error) {
            console.error('Failed to record API call in database:', error.message);
        }
        
        console.log(`📊 API call recorded for ${key}: ${tracker.calls.length}/${this.MAX_CALLS_PER_WINDOW} calls in last ${this.WINDOW_MINUTES}min`);
    }

    /**
     * Get rate limit status for a PBX URL
     */
    getRateLimitStatus(pbxUrl) {
        const key = new URL(pbxUrl).hostname;
        const tracker = this.apiCallTracker.get(key) || { calls: [] };
        const now = Date.now();
        const windowMs = this.WINDOW_MINUTES * 60 * 1000;
        
        // Clean up old calls
        const recentCalls = tracker.calls.filter(callTime => now - callTime < windowMs);
        
        return {
            calls: recentCalls.length,
            maxCalls: this.MAX_CALLS_PER_WINDOW,
            windowMinutes: this.WINDOW_MINUTES,
            canMakeCall: recentCalls.length < this.MAX_CALLS_PER_WINDOW,
            resetTime: recentCalls.length > 0 ? new Date(Math.min(...recentCalls) + windowMs) : null
        };
    }

    /**
     * Reset rate limits for a specific hostname (for testing)
     */
    resetRateLimit(pbxUrl) {
        const key = new URL(pbxUrl).hostname;
        this.apiCallTracker.delete(key);
        console.log(`🔄 Rate limit reset for ${key}`);
    }

    /**
     * Get all rate limit statistics
     */
    getAllRateLimitStats() {
        const stats = {};
        const now = Date.now();
        const windowMs = this.WINDOW_MINUTES * 60 * 1000;
        
        for (const [hostname, tracker] of this.apiCallTracker.entries()) {
            const recentCalls = tracker.calls.filter(callTime => now - callTime < windowMs);
            stats[hostname] = {
                calls: recentCalls.length,
                maxCalls: this.MAX_CALLS_PER_WINDOW,
                canMakeCall: recentCalls.length < this.MAX_CALLS_PER_WINDOW
            };
        }
        
        return stats;
    }
}

export const rateLimitService = new RateLimitService();