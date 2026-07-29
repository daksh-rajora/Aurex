import { Router } from 'express';
import {
  createAnalysisJob,
  getJobStatus,
  getUserJobs,
} from '../controllers/job/job.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   POST /analyze
 * @desc    Queue asynchronous repository analysis job
 * @access  Private (JWT Required)
 */
router.post('/analyze', authenticateUser, createAnalysisJob);

/**
 * @route   GET /:jobId
 * @desc    Get status and results of a specific job
 * @access  Private (JWT Required)
 */
router.get('/:jobId', authenticateUser, getJobStatus);

/**
 * @route   GET /
 * @desc    Get all jobs for authenticated user
 * @access  Private (JWT Required)
 */
router.get('/', authenticateUser, getUserJobs);

export default router;
