import { Router } from 'express';
import { registerUser } from '../controllers/auth/register.controller.js';

const router = Router();

/**
 * Authentication Routes
 */

// POST /register - Register a new user
router.post('/register', registerUser);

// Future Authentication Routes (Placeholders)
// POST /login          - Authenticate user
// POST /logout         - Log out user
// GET  /me             - Get current user profile
// POST /refresh-token  - Refresh authentication tokens
// POST /forgot-password - Request password reset email
// POST /reset-password  - Reset user password

export default router;
