import { PBXInstance } from '../stores/pbxStore'

class PBXService {
  private baseUrl = '/api/pbx'

  async getAllPBX(): Promise<PBXInstance[]> {
    // Return demo data when backend is unavailable
    const demoData: PBXInstance[] = [
      {
        id: '1',
        name: 'Smart HQ Main',
        url: 'https://smarthq.pbx.ycmcloud.co.za',
        appId: 'demo-id-1',
        appSecret: 'demo-secret-1',
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        health: {
          status: 'healthy',
          connected: true,
          systemInfo: {
            extensions: 45,
            activeCalls: 3,
            uptime: '15 days',
            version: '2.1.4'
          },
          apiType: 'YCM Cloud (K2 VoIP)'
        }
      },
      {
        id: '2', 
        name: 'Client ABC Corp',
        url: 'https://abc.pbx.ycmcloud.co.za',
        appId: 'demo-id-2',
        appSecret: 'demo-secret-2',
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        health: {
          status: 'healthy',
          connected: true,
          systemInfo: {
            extensions: 28,
            activeCalls: 1,
            uptime: '8 days',
            version: '2.1.3'
          },
          apiType: 'YCM Cloud (K2 VoIP)'
        }
      },
      {
        id: '3',
        name: 'XYZ Industries',
        url: 'https://xyz.pbx.ycmcloud.co.za', 
        appId: 'demo-id-3',
        appSecret: 'demo-secret-3',
        status: 'error',
        lastCheck: new Date().toISOString(),
        health: {
          status: 'error',
          connected: false,
          error: 'Connection timeout - PBX not responding',
          apiType: 'YCM Cloud (K2 VoIP)'
        }
      }
    ]

    try {
      const response = await fetch(this.baseUrl)
      if (!response.ok) throw new Error('Failed to fetch PBX instances')
      return await response.json()
    } catch (error) {
      console.error('Error fetching PBX instances, using demo data:', error)
      return demoData
    }
  }

  async addPBX(pbxData: {
    name: string
    url: string
    appId: string
    appSecret: string
  }): Promise<PBXInstance> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pbxData),
      })

      if (!response.ok) throw new Error('Failed to add PBX instance')
      const result = await response.json()
      return result.pbx
    } catch (error) {
      console.error('Error adding PBX instance:', error)
      throw error
    }
  }

  async updatePBX(pbxId: string, pbxData: {
    name: string
    url: string
    appId: string
    appSecret: string
    isShared?: boolean
  }): Promise<PBXInstance> {
    try {
      const response = await fetch(`${this.baseUrl}/${pbxId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pbxData),
      })

      if (!response.ok) throw new Error('Failed to update PBX instance')
      const result = await response.json()
      return result.pbx
    } catch (error) {
      console.error('Error updating PBX instance:', error)
      throw error
    }
  }

  async deletePBX(pbxId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${pbxId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete PBX instance')
    } catch (error) {
      console.error('Error deleting PBX instance:', error)
      throw error
    }
  }

  async testPBX(pbxId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${pbxId}/test`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to test PBX instance')
      return await response.json()
    } catch (error) {
      console.error('Error testing PBX instance:', error)
      throw error
    }
  }

  async getHealthHistory(pbxId: string, limit: number = 50): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${pbxId}/health-history?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch health history')
      return await response.json()
    } catch (error) {
      console.error('Error fetching health history:', error)
      throw error
    }
  }

  async getPBXLogs(pbxId: string, limit: number = 20): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/${pbxId}/logs?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch PBX logs')
      return await response.json()
    } catch (error) {
      console.error('Error fetching PBX logs:', error)
      throw error
    }
  }

  async bulkImport(instances: Array<{
    name: string
    url: string
    appId?: string
    appSecret?: string
    isShared?: boolean
  }>): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/bulk-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instances }),
      })

      if (!response.ok) throw new Error('Failed to bulk import PBX instances')
      return await response.json()
    } catch (error) {
      console.error('Error bulk importing PBX instances:', error)
      throw error
    }
  }

  async debugAPI(url: string, appId: string, appSecret: string): Promise<any> {
    try {
      const response = await fetch('/debug/test-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, appId, appSecret }),
      })

      return await response.json()
    } catch (error) {
      console.error('Error debugging API:', error)
      throw error
    }
  }
}

export const pbxService = new PBXService()