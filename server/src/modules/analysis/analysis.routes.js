import { Router } from 'express';
import {
  startAnalysis,
  getAnalysisHistory,
  getSingleAnalysis,
  deleteAnalysis,
} from './analysis.controller.js';
import {
  validateStartAnalysis,
  validateAnalysisId,
} from './analysis.validation.js';
import { authenticateUser } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   GET /history
 * @desc    Return logged-in user's analysis history
 * @access  Private (JWT Required)
 */
router.get('/history', authenticateUser, getAnalysisHistory);

/**
 * @route   POST /:owner/:repo
 * @desc    Start repository analysis
 * @access  Private (JWT Required)
 */
router.post('/:owner/:repo', authenticateUser, validateStartAnalysis, startAnalysis);

/**
 * @route   GET /:analysisId
 * @desc    Return single analysis report
 * @access  Private (JWT Required)
 */
router.get('/:analysisId', authenticateUser, validateAnalysisId, getSingleAnalysis);

/**
 * @route   DELETE /:analysisId
 * @desc    Delete analysis report
 * @access  Private (JWT Required)
 */
router.delete('/:analysisId', authenticateUser, validateAnalysisId, deleteAnalysis);

export default router;
