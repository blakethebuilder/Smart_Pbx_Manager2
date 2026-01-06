import { PBXInstance } from '../stores/pbxStore'

class PBXService {
  private baseUrl = '/api/pbx'

  async getAllPBX(): Promise<PBXInstance[]> {
    try {
      const response = await fetch(this.baseUrl)
      if (!response.ok) throw new Error('Failed to fetch PBX instances')
      return await response.json()
    } catch (error) {
      console.error('Error fetching PBX instances:', error)
      throw error
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