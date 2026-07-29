import { Router } from 'express';
import { compareRepositories } from '../controllers/analysis/comparison.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   POST /compare
 * @desc    Compare health metrics and analysis of two GitHub repositories
 * @access  Private (JWT Required)
 */
router.post('/compare', authenticateUser, compareRepositories);

export default router;
