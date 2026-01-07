#!/usr/bin/env node

import { dbOperations } from '../src/database/database.js';
import fs from 'fs';

console.log('📤 Exporting database data...');

try {
    // Initialize database
    dbOperations.init();
    
    // Get all PBX instances
    const pbxInstances = dbOperations.getAllPBX();
    
    console.log(`Found ${pbxInstances.length} PBX instances`);
    
    // Export to JSON file
    const exportData = {
        exportDate: new Date().toISOString(),
        pbxInstances: pbxInstances
    };
    
    fs.writeFileSync('data/pbx-export.json', JSON.stringify(exportData, null, 2));
    
    console.log('✅ Database data exported to data/pbx-export.json');
    console.log(`📊 Exported ${pbxInstances.length} PBX instances`);
    
} catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
}