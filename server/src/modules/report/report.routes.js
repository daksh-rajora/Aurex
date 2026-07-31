import { Router } from 'express';
import { downloadReport } from './report.controller.js';
import { authenticateUser } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/report/:analysisId/download
 * @desc    Download professional PDF analysis report for a completed analysis
 * @access  Private (JWT Required)
 */
router.get('/:analysisId/download', authenticateUser, downloadReport);

export default router;
