import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbOperations } from '../database/database.js';

const router = express.Router();

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
    const { name, url, tags } = req.body;
    
    if (!name || !url) {
        return res.status(400).json({ error: 'Missing required fields: name and url' });
    }

    const newPBX = {
        id: uuidv4(),
        name,
        url,
        tags: tags ? JSON.stringify(tags) : null,
    };

    try {
        dbOperations.createPBX(newPBX);
        console.log('✅ Hotlink added successfully:', newPBX.name);
        res.status(201).json({ success: true, pbx: newPBX });
    } catch (error) {
        console.error('❌ Failed to add hotlink:', error.message);
        res.status(500).json({ error: 'Failed to add hotlink' });
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

export default router;
