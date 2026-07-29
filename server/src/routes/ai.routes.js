import { Router } from 'express';
import { getRepositoryAIReview } from '../controllers/ai/repositoryReview.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   POST /repository-review
 * @desc    Generate AI-powered code & repository review
 * @access  Private (JWT Required)
 */
router.post('/repository-review', authenticateUser, getRepositoryAIReview);

export default router;
