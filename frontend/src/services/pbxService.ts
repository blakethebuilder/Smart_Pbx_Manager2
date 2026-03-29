import { PBXInstance } from '../stores/pbxStore'

class PBXService {
  private baseUrl = '/api/pbx'

  async getAllPBX(): Promise<PBXInstance[]> {
    const response = await fetch(this.baseUrl)
    if (!response.ok) {
      console.error('Failed to fetch PBX instances');
      return [];
    }
    return await response.json()
  }

  async addPBX(pbxData: { name: string; url: string; tags?: string[] }): Promise<PBXInstance> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pbxData),
    });
    if (!response.ok) throw new Error('Failed to add PBX');
    const result = await response.json();
    return result.pbx;
  }

  async deletePBX(pbxId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${pbxId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete PBX');
  }

  async bulkImport(instances: Array<{ name: string; url: string; tags?: string[] }>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instances }),
    });
    if (!response.ok) throw new Error('Failed to bulk import PBX instances');
    return await response.json();
  }
}

export const pbxService = new PBXService()