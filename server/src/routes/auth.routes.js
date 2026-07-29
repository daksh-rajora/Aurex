import { Router } from 'express';
import { registerUser } from '../controllers/auth/register.controller.js';
import registerValidator from '../validators/auth/register.validator.js';
import { loginUser } from '../controllers/auth/login.controller.js';
import loginValidator from '../validators/auth/login.validator.js';
import { getCurrentUser } from '../controllers/auth/currentUser.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Authentication Routes
 */

// POST /register - Register a new user
router.post('/register', registerValidator, registerUser);

// POST /login - Authenticate user
router.post('/login', loginValidator, loginUser);

// GET /me - Get current authenticated user details
router.get('/me', authenticateUser, getCurrentUser);

export default router;
