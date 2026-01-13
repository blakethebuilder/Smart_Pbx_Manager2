import express from 'express';
import { dbOperations } from '../database/database.js';

const router = express.Router();

// Get all notes
router.get('/', (req, res) => {
    try {
        const notes = dbOperations.getAllNotes();
        res.json(notes);
    } catch (error) {
        console.error('❌ Failed to get notes:', error.message);
        res.status(500).json({ error: 'Failed to retrieve notes' });
    }
});

// Get notes for a specific PBX
router.get('/pbx/:pbxId', (req, res) => {
    const { pbxId } = req.params;
    
    try {
        const notes = dbOperations.getNotesByPBX(pbxId);
        res.json(notes);
    } catch (error) {
        console.error('❌ Failed to get PBX notes:', error.message);
        res.status(500).json({ error: 'Failed to retrieve PBX notes' });
    }
});

// Create a new note
router.post('/', (req, res) => {
    const { pbxId, content, author, priority = 'medium' } = req.body;
    
    if (!pbxId || !content || !author) {
        return res.status(400).json({ 
            error: 'Missing required fields (pbxId, content, author)' 
        });
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ 
            error: 'Priority must be low, medium, or high' 
        });
    }

    // Check if PBX exists
    const pbx = dbOperations.getPBXById(pbxId);
    if (!pbx) {
        return res.status(404).json({ error: 'PBX not found' });
    }

    const noteId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    try {
        dbOperations.createNote({
            id: noteId,
            pbxId,
            content: content.trim(),
            author: author.trim(),
            priority
        });

        // Return the created note
        const notes = dbOperations.getNotesByPBX(pbxId);
        const createdNote = notes.find(note => note.id === noteId);
        
        console.log(`📝 Note created for ${pbx.name} by ${author}`);
        
        res.json({ 
            success: true, 
            note: createdNote 
        });
        
    } catch (error) {
        console.error('❌ Failed to create note:', error.message);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// Update a note
router.put('/:noteId', (req, res) => {
    const { noteId } = req.params;
    const { pbxId, content } = req.body;
    
    if (!pbxId || !content) {
        return res.status(400).json({ 
            error: 'Missing required fields (pbxId, content)' 
        });
    }

    try {
        const result = dbOperations.updateNote(noteId, pbxId, content.trim());
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        console.log(`📝 Note updated: ${noteId}`);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('❌ Failed to update note:', error.message);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// Delete a note
router.delete('/:noteId', (req, res) => {
    const { noteId } = req.params;
    const { pbxId } = req.body;
    
    if (!pbxId) {
        return res.status(400).json({ 
            error: 'Missing required field (pbxId)' 
        });
    }

    try {
        const result = dbOperations.deleteNote(noteId, pbxId);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        console.log(`🗑️ Note deleted: ${noteId}`);
        
        res.json({ success: true });
        
    } catch (error) {
        console.error('❌ Failed to delete note:', error.message);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

export default router;