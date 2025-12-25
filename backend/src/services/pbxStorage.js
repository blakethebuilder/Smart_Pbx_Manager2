import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PBX_FILE = join(__dirname, '../../data/pbxs.json');

/**
 * PBX Storage Service
 * Manages pbxs.json file
 */

/**
 * Read PBXs from file
 */
export function readPBXs() {
    try {
        const data = readFileSync(PBX_FILE, 'utf8');
        const json = JSON.parse(data);
        return json.pbxs || [];
    } catch (error) {
        console.error('Error reading pbxs.json:', error.message);
        return [];
    }
}

/**
 * Write PBXs to file
 */
function writePBXs(pbxs) {
    try {
        const data = JSON.stringify({ pbxs }, null, 2);
        writeFileSync(PBX_FILE, data, 'utf8');
    } catch (error) {
        console.error('Error writing pbxs.json:', error.message);
        throw error;
    }
}

/**
 * Get all PBXs
 */
export function getAllPBXs() {
    return readPBXs();
}

/**
 * Get PBX by ID
 */
export function getPBXById(id) {
    const pbxs = readPBXs();
    return pbxs.find(p => p.id === id);
}

/**
 * Add new PBX
 */
export function addPBX(pbxData) {
    const pbxs = readPBXs();

    const newPBX = {
        id: uuidv4(),
        name: pbxData.name,
        url: pbxData.url,
        appId: pbxData.appId,
        appSecret: pbxData.appSecret,
        createdAt: new Date().toISOString()
    };

    pbxs.push(newPBX);
    writePBXs(pbxs);

    return newPBX;
}

/**
 * Update PBX
 */
export function updatePBX(id, pbxData) {
    const pbxs = readPBXs();
    const index = pbxs.findIndex(p => p.id === id);

    if (index === -1) {
        throw new Error('PBX not found');
    }

    pbxs[index] = {
        ...pbxs[index],
        name: pbxData.name,
        url: pbxData.url,
        appId: pbxData.appId,
        appSecret: pbxData.appSecret,
        updatedAt: new Date().toISOString()
    };

    writePBXs(pbxs);

    return pbxs[index];
}

/**
 * Delete PBX
 */
export function deletePBX(id) {
    const pbxs = readPBXs();
    const filtered = pbxs.filter(p => p.id !== id);

    if (filtered.length === pbxs.length) {
        throw new Error('PBX not found');
    }

    writePBXs(filtered);

    return true;
}
