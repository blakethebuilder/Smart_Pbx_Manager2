import express from 'express';
import { dbOperations } from '../database/database.js';

const router = express.Router();
const DASHBOARD_PASSWORD = process.env.MASTER_PASSWORD;
const ADMIN_USERNAME = 'blakeAdmin';
const ADMIN_PASSWORD = 'smartAdmin@2026!';

// Check if password is configured
if (!DASHBOARD_PASSWORD || DASHBOARD_PASSWORD === 'CHANGE_ME_IN_PRODUCTION') {
    console.error('❌ MASTER_PASSWORD environment variable not set or using default value!');
    console.error('   Please set a secure password in your environment variables.');
    // In dev we don't exit, but in production we should
}

// Login endpoint
router.post('/login', (req, res) => {
    const { password, techName } = req.body;
    
    if (!password || !techName) {
        return res.status(400).json({ error: 'Username (techName) and password required' });
    }
    
    // Check for superadmin
    if (techName === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log(`🔑 Superadmin ${ADMIN_USERNAME} logged in`);
        return res.json({ 
            success: true, 
            techName: ADMIN_USERNAME,
            role: 'admin'
        });
    }

    // Check for regular tech
    if (password === DASHBOARD_PASSWORD) {
        // Find existing technician
        const existing = dbOperations.getUserByUsername(techName);
        
        if (existing) {
            console.log(`✅ Successful login by technician: ${techName}`);
            return res.json({ 
                success: true, 
                techName: techName,
                role: 'tech'
            });
        } else {
            console.log(`❌ Unauthorized login attempt by: ${techName} (Not registered)`);
            return res.status(403).json({ 
                success: false, 
                error: 'Account not registered. Please contact an administrator.' 
            });
        }
    } else {
        console.log(`❌ Failed login attempt for: ${techName}`);
        res.json({ success: false, error: 'Invalid password' });
    }
});

// Admin only routes
router.get('/users', (req, res) => {
    // Basic role check (this should be middleware in a real app)
    // For this simple case we'll just return all users
    try {
        const users = dbOperations.getAllUsers();
        res.json(users);
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
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const existing = dbOperations.getUserByUsername(username);
        if (existing) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const newUser = {
            id: Date.now().toString(),
            username: username.trim(),
            role: 'tech',
        };

        dbOperations.createUser(newUser.id, newUser.username, newUser.role);
        console.log(`👤 New tech created by admin: ${newUser.username}`);
        res.status(201).json({ success: true, user: newUser });

    } catch (error) {
        console.error('❌ Failed to create user:', error.message);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

export default router;