#!/usr/bin/env node

import { dbOperations } from '../src/database/database.js';
import fs from 'fs';
import path from 'path';

console.log('📥 Checking if database needs initialization...');

try {
    // Initialize database
    dbOperations.init();
    
    // Check if database already has data
    const existingInstances = dbOperations.getAllPBX();
    
    if (existingInstances.length > 0) {
        console.log(`✅ Database already has ${existingInstances.length} PBX instances, skipping import`);
        process.exit(0);
    }
    
    // Check multiple possible locations for export file
    const possiblePaths = [
        path.join(process.cwd(), 'data', 'pbx-export.json'),
        path.join(process.cwd(), 'pbx-export.json'),
        './data/pbx-export.json',
        './pbx-export.json'
    ];
    
    let exportFile = null;
    for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
            exportFile = filePath;
            console.log(`📁 Found export file at: ${filePath}`);
            break;
        }
    }
    
    if (!exportFile) {
        console.log('📝 No export file found at any location, database will start empty');
        console.log('🔍 Searched locations:', possiblePaths);
        process.exit(0);
    }
    
    // Read and import data
    const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
    
    console.log(`📦 Importing ${exportData.pbxInstances.length} PBX instances...`);
    
    for (const pbx of exportData.pbxInstances) {
        try {
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
            
        } catch (error) {
            if (!error.message.includes('UNIQUE constraint failed')) {
                console.error(`❌ Failed to import ${pbx.name}:`, error.message);
            }
        }
    }
    
    console.log(`🎉 Successfully imported ${exportData.pbxInstances.length} PBX instances!`);
    
} catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
}