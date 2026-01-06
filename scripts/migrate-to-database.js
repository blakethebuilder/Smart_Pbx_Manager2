#!/usr/bin/env node

import { dbOperations } from '../src/database/database.js';
import fs from 'fs';
import path from 'path';

const JSON_FILE_PATH = path.join(process.cwd(), 'pbx-data.json');

async function migrateToDatabase() {
    console.log('🔄 Starting migration from JSON to SQLite database...');
    
    try {
        // Check if JSON file exists
        if (!fs.existsSync(JSON_FILE_PATH)) {
            console.log('📄 No existing pbx-data.json file found. Starting with empty database.');
            return;
        }
        
        // Read existing JSON data
        const jsonData = JSON.parse(fs.readFileSync(JSON_FILE_PATH, 'utf8'));
        console.log(`📊 Found ${jsonData.length} PBX instances in JSON file`);
        
        // Migrate to database
        dbOperations.migrateFromJSON(jsonData);
        
        // Create backup of JSON file
        const backupPath = `${JSON_FILE_PATH}.backup.${Date.now()}`;
        fs.copyFileSync(JSON_FILE_PATH, backupPath);
        console.log(`💾 Created backup: ${backupPath}`);
        
        // Verify migration
        const dbData = dbOperations.getAllPBX();
        console.log(`✅ Migration complete! ${dbData.length} PBX instances now in database`);
        
        console.log('\n📋 Migration Summary:');
        console.log(`   • JSON file: ${jsonData.length} instances`);
        console.log(`   • Database: ${dbData.length} instances`);
        console.log(`   • Backup created: ${backupPath}`);
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateToDatabase();
}

export { migrateToDatabase };