import { Router } from 'express';
import {
  getOverview,
  getRecent,
  getLanguages,
  getTrends,
} from './dashboard.controller.js';
import { authenticateUser } from '../../middlewares/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/dashboard/overview
 * @desc    Fetch aggregated dashboard overview statistics for authenticated user
 * @access  Private (JWT Required)
 */
router.get('/overview', authenticateUser, getOverview);

/**
 * @route   GET /api/dashboard/recent
 * @desc    Fetch latest 10 analyses for authenticated user
 * @access  Private (JWT Required)
 */
router.get('/recent', authenticateUser, getRecent);

/**
 * @route   GET /api/dashboard/languages
 * @desc    Fetch programming language breakdown and average scores for authenticated user
 * @access  Private (JWT Required)
 */
router.get('/languages', authenticateUser, getLanguages);

/**
 * @route   GET /api/dashboard/trends
 * @desc    Fetch analysis counts and average score trends grouped by day, week, or month
 * @access  Private (JWT Required)
 */
router.get('/trends', authenticateUser, getTrends);

export default router;
