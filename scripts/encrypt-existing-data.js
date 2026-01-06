#!/usr/bin/env node

import fs from 'fs';
import { encryptCredentials } from '../src/utils/encryption.js';

console.log('🔐 Encrypting existing PBX credentials...\n');

const dataFile = 'pbx-data.json';

if (!fs.existsSync(dataFile)) {
    console.log('❌ No pbx-data.json file found');
    process.exit(1);
}

try {
    // Read existing data
    const data = fs.readFileSync(dataFile, 'utf8');
    const pbxInstances = JSON.parse(data);
    
    console.log(`📊 Found ${pbxInstances.length} PBX instances`);
    
    // Create backup
    const backupFile = `pbx-data-backup-${Date.now()}.json`;
    fs.writeFileSync(backupFile, data);
    console.log(`✅ Created backup: ${backupFile}`);
    
    // Encrypt credentials
    let encryptedCount = 0;
    const encryptedInstances = pbxInstances.map(pbx => {
        if (pbx.appId && pbx.appSecret && !pbx.encrypted) {
            try {
                const encrypted = encryptCredentials(pbx.appId, pbx.appSecret);
                encryptedCount++;
                
                return {
                    ...pbx,
                    appId: encrypted.appId,
                    appSecret: encrypted.appSecret,
                    iv: encrypted.iv,
                    encrypted: true,
                    encryptedAt: new Date().toISOString()
                };
            } catch (error) {
                console.log(`⚠️ Failed to encrypt ${pbx.name}: ${error.message}`);
                return pbx;
            }
        }
        return pbx;
    });
    
    // Save encrypted data
    fs.writeFileSync(dataFile, JSON.stringify(encryptedInstances, null, 2));
    
    console.log(`\n🎉 Encryption complete!`);
    console.log(`✅ Encrypted ${encryptedCount} PBX instances`);
    console.log(`📁 Backup saved as: ${backupFile}`);
    console.log(`🔒 Original credentials are now encrypted`);
    
} catch (error) {
    console.error('❌ Encryption failed:', error.message);
    process.exit(1);
}