import { PBXInstance } from '../stores/pbxStore'

export interface PBXUpsertPayload {
  name: string
  url: string
  tags?: string[]
  nickname?: string
  extensionCount?: number | null
  siteInfo?: string
}

class PBXService {
  private baseUrl = '/api/pbx'

  private preparePayload(data: PBXUpsertPayload) {
    const payload: Record<string, unknown> = {
      name: data.name.trim(),
      url: data.url.trim(),
    }

    if ('nickname' in data) {
      payload.nickname = data.nickname ? data.nickname.trim() : ''
    }

    if ('siteInfo' in data) {
      payload.siteInfo = data.siteInfo ? data.siteInfo.trim() : ''
    }

    if ('extensionCount' in data) {
      if (data.extensionCount === null || data.extensionCount === undefined) {
        payload.extensionCount = null
      } else if (typeof data.extensionCount === 'number') {
        payload.extensionCount = Number.isFinite(data.extensionCount) ? data.extensionCount : null
      }
    }

    if ('tags' in data) {
      payload.tags = data.tags
    }

    return payload
  }

  async getAllPBX(): Promise<PBXInstance[]> {
    const response = await fetch(this.baseUrl)
    if (!response.ok) {
      console.error('Failed to fetch PBX instances');
      return [];
    }
    return await response.json()
  }

  async addPBX(pbxData: PBXUpsertPayload): Promise<PBXInstance> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.preparePayload(pbxData)),
    });
    if (!response.ok) throw new Error('Failed to add PBX');
    const result = await response.json();
    return result.pbx;
  }

  async updatePBX(pbxId: string, data: PBXUpsertPayload): Promise<PBXInstance> {
    const response = await fetch(`${this.baseUrl}/${pbxId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.preparePayload(data)),
    })
    if (!response.ok) throw new Error('Failed to update PBX')
    const result = await response.json()
    return result.pbx
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
