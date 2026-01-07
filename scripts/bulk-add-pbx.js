#!/usr/bin/env node

import { dbOperations } from '../src/database/database.js';
import fs from 'fs';

console.log('📦 Bulk adding PBX instances from export file...');

try {
    // Initialize database
    dbOperations.init();
    
    // Read export file
    const exportData = JSON.parse(fs.readFileSync('data/pbx-export.json', 'utf8'));
    
    console.log(`Found ${exportData.pbxInstances.length} PBX instances to import`);
    
    let imported = 0;
    let skipped = 0;
    
    for (const pbx of exportData.pbxInstances) {
        try {
            // Check if already exists
            const existing = dbOperations.getPBXById(pbx.id);
            if (existing) {
                console.log(`⏸️ Skipped: ${pbx.name} (already exists)`);
                skipped++;
                continue;
            }
            
            // Create PBX instance
            dbOperations.createPBX({
                id: pbx.id,
                name: pbx.name,
                url: pbx.url,
                appId: pbx.appId,
                appSecret: pbx.appSecret,
                isShared: pbx.isShared
            });
            
            // Update health data if available
            if (pbx.status && pbx.health) {
                dbOperations.updatePBXHealth(pbx.id, pbx.status, pbx.health);
            }
            
            console.log(`✅ Imported: ${pbx.name}`);
            imported++;
            
        } catch (error) {
            console.error(`❌ Failed to import ${pbx.name}:`, error.message);
        }
    }
    
    console.log(`🎉 Import completed: ${imported} imported, ${skipped} skipped`);
    
} catch (error) {
    console.error('❌ Bulk import failed:', error.message);
    process.exit(1);
}