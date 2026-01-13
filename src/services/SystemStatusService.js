class SystemStatusService {
    constructor() {
        this.isMonitoringPaused = false;
        this.pausedAt = null;
    }

    pauseMonitoring() {
        this.isMonitoringPaused = true;
        this.pausedAt = new Date().toISOString();
        console.log('🛑 Monitoring has been PAUSED');
    }

    resumeMonitoring() {
        this.isMonitoringPaused = false;
        this.pausedAt = null;
        console.log('▶️ Monitoring has been RESUMED');
    }

    getStatus() {
        return {
            isPaused: this.isMonitoringPaused,
            pausedAt: this.pausedAt
        };
    }
}

export const systemStatusService = new SystemStatusService();
