#!/usr/bin/env node

import { dbOperations } from '../src/database/database.js';

console.log('🚀 Adding demo PBX instances...');

// Initialize database
dbOperations.init();

const demoPBXInstances = [
  {
    id: Date.now().toString(),
    name: 'Smart HQ Main',
    url: 'https://smarthq.pbx.ycmcloud.co.za',
    appId: 'ZvvVCWsxgzWYg0dPtOigJ4AOzSATrFlW',
    appSecret: 'your-app-secret-here',
    isShared: false,
    status: 'unknown',
    lastCheck: null,
    createdAt: new Date().toISOString()
  },
  {
    id: (Date.now() + 1).toString(),
    name: 'Client ABC Corp',
    url: 'https://abc.pbx.ycmcloud.co.za',
    appId: 'PLACEHOLDER_ID',
    appSecret: 'PLACEHOLDER_SECRET',
    isShared: true,
    status: 'unknown',
    lastCheck: null,
    createdAt: new Date().toISOString()
  },
  {
    id: (Date.now() + 2).toString(),
    name: 'XYZ Industries',
    url: 'https://xyz.pbx.ycmcloud.co.za',
    appId: 'PLACEHOLDER_ID',
    appSecret: 'PLACEHOLDER_SECRET',
    isShared: true,
    status: 'unknown',
    lastCheck: null,
    createdAt: new Date().toISOString()
  }
];

try {
  for (const pbx of demoPBXInstances) {
    dbOperations.createPBX(pbx);
    console.log(`✅ Added: ${pbx.name}`);
  }
  
  console.log(`🎉 Successfully added ${demoPBXInstances.length} demo PBX instances!`);
  console.log('📊 You can now see them in your dashboard');
  
} catch (error) {
  console.error('❌ Failed to add demo instances:', error.message);
  process.exit(1);
}