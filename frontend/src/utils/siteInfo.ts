export interface SiteInfoShape {
  internet?: string
  supplier?: string
  serviceUsername?: string
  telephone?: string
  whatsapp?: string
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
          telephone: data.telephone ?? data['telephone'] ?? '',
          whatsapp: data.whatsapp ?? data['whatsapp'] ?? '',
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
      internet: (input as any).internet ?? (input as any)['internet'] ?? '',
      supplier: (input as any).supplier ?? (input as any)['supplier'] ?? '',
      serviceUsername: (input as any).serviceUsername ?? (input as any)['serviceUsername'] ?? '',
      telephone: (input as any).telephone ?? (input as any)['telephone'] ?? '',
      whatsapp: (input as any).whatsapp ?? (input as any)['whatsapp'] ?? '',
      raw: ''
    }
  }
  return {}
}
