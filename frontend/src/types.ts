export type ServiceData = any

export interface Service {
  id: string
  type: string
  data?: ServiceData
  created_at?: string
}

export interface PbxData {
  host?: string
  port?: number
  username?: string
  password?: string
}

export interface InternetData {
  supplier?: string
  username?: string
  password?: string
}

export interface WifiData {
  ssid?: string
  password?: string
}

export interface RouterData {
  model?: string
  ip?: string
  username?: string
  password?: string
}

export interface Client {
  id: string
  name: string
  notes?: string
  created_at?: string
  services?: Service[]
}
