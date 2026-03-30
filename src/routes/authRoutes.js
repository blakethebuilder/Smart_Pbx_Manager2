import express from 'express';
import bcrypt from 'bcrypt';
import { dbOperations } from '../database/database.js';

const router = express.Router();
const saltRounds = 10;

// Login endpoint
router.post('/login', (req, res) => {
    const { password, techName } = req.body;
    if (!password || !techName) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = dbOperations.getUserByUsername(techName);
    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            console.log(`✅ Successful login by: ${techName}`);
            res.json({ 
                success: true, 
                techName: user.username,
                role: user.role
            });
        } else {
            console.log(`❌ Failed login attempt for: ${techName}`);
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    });
});

// Admin only routes
router.get('/users', (req, res) => {
    try {
        const users = dbOperations.getAllUsers();
        // Exclude passwords from the response
        const safeUsers = users.map(({ password, ...rest }) => rest);
        res.json(safeUsers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.delete('/users/:id', (req, res) => {
    try {
        dbOperations.deleteUser(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Admin: Create a new user
router.post('/users', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const existing = dbOperations.getUserByUsername(username);
        if (existing) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to hash password' });
            }
            
            const newUser = {
                id: Date.now().toString(),
                username: username.trim(),
                password: hash,
                role: 'tech',
            };

            dbOperations.createUser(newUser);
            console.log(`👤 New tech created by admin: ${newUser.username}`);
            const { password, ...safeUser } = newUser;
            res.status(201).json({ success: true, user: safeUser });
        });

    } catch (error) {
        console.error('❌ Failed to create user:', error.message);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

export default router;
