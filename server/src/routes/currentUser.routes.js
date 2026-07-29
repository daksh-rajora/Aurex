import { Router } from 'express';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { getCurrentUser } from '../controllers/auth/currentUser.controller.js';

const router = Router();

/**
 * @route   GET /me
 * @desc    Get current authenticated user details
 * @access  Private
 */
router.get('/me', authenticateUser, getCurrentUser);

export default router;
