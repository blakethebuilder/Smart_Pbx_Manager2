import express from 'express';

const router = express.Router();
const DASHBOARD_PASSWORD = process.env.MASTER_PASSWORD;

// Check if password is configured
if (!DASHBOARD_PASSWORD || DASHBOARD_PASSWORD === 'CHANGE_ME_IN_PRODUCTION') {
    console.error('❌ MASTER_PASSWORD environment variable not set or using default value!');
    console.error('   Please set a secure password in your environment variables.');
    process.exit(1);
}

// Login endpoint
router.post('/login', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }
    
    if (password === DASHBOARD_PASSWORD) {
        console.log('✅ Successful login attempt');
        res.json({ success: true });
    } else {
        console.log('❌ Failed login attempt');
        res.json({ success: false, error: 'Invalid password' });
    }
});

export default router;