import express from 'express';
import { dbOperations } from '../database/database.js';

const router = express.Router();

router.get('/', (req, res) => {
    try {
        res.json(dbOperations.getAllAnnouncements());
    } catch (error) {
        res.status(500).json({ error: 'Failed to get announcements' });
    }
});

router.post('/', (req, res) => {
    const { content, author, pinned = false } = req.body;
    if (!content || !author) return res.status(400).json({ error: 'content and author required' });

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 6);
    try {
        dbOperations.createAnnouncement({ id, content: content.trim(), author: author.trim(), pinned: pinned ? 1 : 0 });
        res.json({ success: true, id });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

router.delete('/:id', (req, res) => {
    try {
        dbOperations.deleteAnnouncement(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
});

export default router;
