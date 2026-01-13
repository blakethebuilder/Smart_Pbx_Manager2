export interface MonitoringStatus {
  isPaused: boolean;
  pausedAt: string | null;
}

class SystemService {
  private baseUrl = '/api/system/monitoring';

  async getStatus(): Promise<MonitoringStatus> {
    const response = await fetch(`${this.baseUrl}/status`);
    if (!response.ok) throw new Error('Failed to get monitoring status');
    return await response.json();
  }

  async pauseMonitoring(): Promise<MonitoringStatus> {
    const response = await fetch(`${this.baseUrl}/pause`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to pause monitoring');
    return await response.json().then(data => data.status);
  }

  async resumeMonitoring(): Promise<MonitoringStatus> {
    const response = await fetch(`${this.baseUrl}/resume`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to resume monitoring');
    return await response.json().then(data => data.status);
  }
}

export const systemService = new SystemService();
