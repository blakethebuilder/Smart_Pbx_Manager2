import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbOperations } from '../database/database.js';

const router = express.Router();

const normalizeTags = (value) => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) {
        return value.map(tag => String(tag).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed.map(tag => String(tag).trim()).filter(Boolean);
            }
        } catch (error) {
            // Ignore JSON parse issues, fallback to CSV parsing
        }
        return trimmed.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    return [];
};

const parseExtensionCount = (value, fallback = null) => {
    if (value === undefined) return fallback;
    if (value === null || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric >= 0 ? numeric : fallback;
};

// Get all PBX instances
router.get('/', (req, res) => {
    try {
        const pbxInstances = dbOperations.getAllPBX();
        res.json(pbxInstances);
    } catch (error) {
        console.error('❌ Failed to get PBX instances:', error.message);
        res.status(500).json({ error: 'Failed to retrieve PBX instances' });
    }
});

// Add new PBX instance (hotlink)
router.post('/', (req, res) => {
    const { name, url, tags, nickname, extensionCount, siteInfo } = req.body;
    
    if (!name || !url) {
        return res.status(400).json({ error: 'Missing required fields: name and url' });
    }

    const sanitizedName = name.trim();
    const sanitizedUrl = url.trim().replace(/\/login\/?$/, '');
    const normalizedTags = normalizeTags(tags);
    const cleanedNickname = typeof nickname === 'string' ? nickname.trim() : '';
    const cleanedSiteInfo = typeof siteInfo === 'string' ? siteInfo.trim() : '';
    const normalizedExtensionCount = parseExtensionCount(extensionCount);

    const newPBX = {
        id: uuidv4(),
        name: sanitizedName,
        url: sanitizedUrl,
        tags: normalizedTags,
        nickname: cleanedNickname || null,
        extensionCount: normalizedExtensionCount,
        siteInfo: cleanedSiteInfo || null,
    };

    try {
        dbOperations.createPBX(newPBX);
        console.log('✅ Hotlink added successfully:', newPBX.name);

        const allPbxs = dbOperations.getAllPBX();
        req.app.get('io').emit('pbx-update', allPbxs);

        const created = allPbxs.find(pbx => pbx.id === newPBX.id);
        res.status(201).json({ success: true, pbx: created || newPBX });
    } catch (error) {
        console.error('❌ Failed to add hotlink:', error.message);
        res.status(500).json({ error: 'Failed to add hotlink' });
    }
});

// Update PBX instance details
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const existing = dbOperations.getPBXById(id);
    if (!existing) {
        return res.status(404).json({ error: 'PBX not found' });
    }

    const { name, url, tags, nickname, extensionCount, siteInfo } = req.body;
    if (!name || !url) {
        return res.status(400).json({ error: 'Missing required fields: name and url' });
    }

    const sanitizedName = name.trim();
    const sanitizedUrl = url.trim().replace(/\/login\/?$/, '');
    const normalizedTags = tags === undefined ? (existing.tags || []) : normalizeTags(tags);
    const cleanedNickname = nickname === undefined ? (existing.nickname || '') : (typeof nickname === 'string' ? nickname.trim() : '');
    const cleanedSiteInfo = siteInfo === undefined ? (existing.siteInfo || '') : (typeof siteInfo === 'string' ? siteInfo.trim() : '');
    const normalizedExtensionCount = parseExtensionCount(extensionCount, existing.extensionCount ?? null);

    const updatedPBX = {
        name: sanitizedName,
        url: sanitizedUrl,
        tags: normalizedTags,
        nickname: cleanedNickname || null,
        extensionCount: normalizedExtensionCount,
        siteInfo: cleanedSiteInfo || null,
    };

    try {
        dbOperations.updatePBX(id, updatedPBX);
        const allPbxs = dbOperations.getAllPBX();
        const updated = allPbxs.find(pbx => pbx.id === id);
        req.app.get('io').emit('pbx-update', allPbxs);
        res.json({ success: true, pbx: updated || { id, ...updatedPBX } });
    } catch (error) {
        console.error('❌ Failed to update PBX:', error.message);
        res.status(500).json({ error: 'Failed to update PBX instance' });
    }
});

// Delete PBX instance
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    try {
        const existing = dbOperations.getPBXById(id);
        if (!existing) {
            return res.status(404).json({ error: 'PBX not found' });
        }

        dbOperations.deletePBX(id);
        console.log('🗑️ PBX deleted:', existing.name);
        
        // Broadcast update to clients
        const updatedInstances = dbOperations.getAllPBX();
        req.app.get('io').emit('pbx-update', updatedInstances);

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Failed to delete PBX:', error.message);
        res.status(500).json({ error: 'Failed to delete PBX instance' });
    }
});

// Bulk import endpoint
router.post('/bulk-import', (req, res) => {
    const { instances } = req.body;
    if (!instances || !Array.isArray(instances)) {
        return res.status(400).json({ error: 'Invalid instances data' });
    }

    const results = { imported: 0, errors: [] };
    try {
        for (const instance of instances) {
            try {
                const newPBX = {
                    id: uuidv4(),
                    name: instance.name,
                    url: instance.url.trim().replace(/\/login\/?$/, ''),
                    tags: normalizeTags(instance.tags),
                    nickname: null,
                    extensionCount: null,
                    siteInfo: null,
                };
                dbOperations.createPBX(newPBX);
                results.imported++;
            } catch (error) {
                results.errors.push(`Failed to import ${instance.name}: ${error.message}`);
            }
        }
        const allPbxs = dbOperations.getAllPBX();
        req.app.get('io').emit('pbx-update', allPbxs);
        res.json({ success: true, ...results, pbx: allPbxs });
    } catch (error) {
        console.error('❌ Bulk import failed:', error.message);
        res.status(500).json({ error: 'Bulk import failed' });
    }
});

// Deduplicate PBX instances
router.post('/deduplicate', (req, res) => {
    try {
        dbOperations.deduplicatePBX();
        const updatedInstances = dbOperations.getAllPBX();
        req.app.get('io').emit('pbx-update', updatedInstances);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Deduplication failed:', error.message);
        res.status(500).json({ error: 'Deduplication failed' });
    }
});

export default router;
