export interface PBXHealth {
  status: 'healthy' | 'warning' | 'critical' | 'error';
  connected: boolean;
  issues?: string[];
  trunks: {
    registered: number;
    total: number;
  };
  extensions: {
    online: number;
    total: number;
  };
  calls: {
    active: number;
    max: number;
  };
  lastCheck: string;
}

export interface PBXData {
  id: string;
  name: string;
  url: string;
  health: PBXHealth;
}

export interface PBXFormData {
  name: string;
  url: string;
  appId: string;
  appSecret: string;
}