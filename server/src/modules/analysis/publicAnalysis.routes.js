import { Router } from 'express';
import { runPublicAnalysis } from './publicAnalysis.controller.js';
import { validatePublicAnalysis } from './publicAnalysis.validation.js';

const router = Router();

/**
 * @route   POST /api/public-analysis
 * @desc    Analyze any public GitHub repository (No GitHub account linking required)
 * @access  Public
 */
router.post('/', validatePublicAnalysis, runPublicAnalysis);

export default router;
