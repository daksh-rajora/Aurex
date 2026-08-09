import { Router } from 'express';
import {
  startAnalysis,
  runAIAnalysis,
  getAnalysisHistory,
  getSingleAnalysis,
  getAnalysisReport,
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
 * @route   POST /start
 * @desc    Start repository analysis with body details
 * @access  Private (JWT Required)
 */
router.post('/start', authenticateUser, startAnalysis);

/**
 * @route   POST /:owner/:repo
 * @desc    Start repository metadata collection
 * @access  Private (JWT Required)
 */
router.post('/:owner/:repo', authenticateUser, validateStartAnalysis, startAnalysis);

/**
 * @route   POST /:analysisId/run
 * @desc    Execute AI analysis on stored repository metadata
 * @access  Private (JWT Required)
 */
router.post('/:analysisId/run', authenticateUser, validateAnalysisId, runAIAnalysis);

/**
 * @route   GET /:analysisId/report
 * @desc    Return detailed AI analysis report document
 * @access  Private (JWT Required)
 */
router.get('/:analysisId/report', authenticateUser, validateAnalysisId, getAnalysisReport);

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

