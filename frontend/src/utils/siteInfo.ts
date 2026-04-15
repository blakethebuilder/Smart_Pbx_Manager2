export interface SiteInfoShape {
  internet?: string
  supplier?: string
  serviceUsername?: string
  raw?: string
}

export function parseSiteInfo(input: any): SiteInfoShape {
  if (input == null) return {}
  // If it's a string, try JSON
  if (typeof input === 'string') {
    try {
      const data = JSON.parse(input)
      if (data && typeof data === 'object' && (data.internet || data.supplier || data.serviceUsername)) {
        return {
          internet: data.internet ?? data['internet'] ?? '',
          supplier: data.supplier ?? data['supplier'] ?? '',
          serviceUsername: data.serviceUsername ?? data['serviceUsername'] ?? '',
          raw: ''
        }
      } else {
        return { raw: input }
      }
    } catch {
      return { raw: input }
    }
  }
  // If it's an object, map keys if present
  if (typeof input === 'object') {
    return {
      internet: input.internet ?? input['internet'] ?? '',
      supplier: input.supplier ?? input['supplier'] ?? '',
      serviceUsername: input.serviceUsername ?? input['serviceUsername'] ?? '',
      raw: ''
    }
  }
  return {}
}
