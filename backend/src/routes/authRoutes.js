import express from 'express';
import { login, logout, checkAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with master password
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 * Logout and destroy session
 */
router.post('/logout', logout);

/**
 * GET /api/auth/check
 * Check if user is authenticated
 */
router.get('/check', checkAuth);

export default router;
