import { Router } from 'express';
import { runPublicAnalysis } from './publicAnalysis.controller.js';
import { validatePublicAnalysis } from './publicAnalysis.validation.js';
import { authenticateUser } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/public-analysis
 * @desc    Analyze any public GitHub repository (No GitHub account linking required)
 * @access  Private (Aurex JWT Required)
 */
router.post('/', authenticateUser, validatePublicAnalysis, runPublicAnalysis);

export default router;

