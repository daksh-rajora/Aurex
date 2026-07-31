import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import {
  getDashboardOverviewService,
  getRecentAnalysesService,
  getLanguageStatsService,
  getDashboardTrendsService,
} from './dashboard.service.js';

/**
 * Controller to fetch overview statistics for the authenticated user's dashboard.
 *
 * @route GET /api/dashboard/overview
 * @access Private
 */
export const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const overview = await getDashboardOverviewService(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, overview, 'Dashboard overview fetched successfully'));
});

/**
 * Controller to fetch recent repository analyses for the authenticated user.
 *
 * @route GET /api/dashboard/recent
 * @access Private
 */
export const getRecent = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const limit = req.query.limit || 10;
  const recentAnalyses = await getRecentAnalysesService(userId, limit);

  return res
    .status(200)
    .json(new ApiResponse(200, recentAnalyses, 'Recent analyses fetched successfully'));
});

/**
 * Controller to fetch programming language statistics across analyzed repositories.
 *
 * @route GET /api/dashboard/languages
 * @access Private
 */
export const getLanguages = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const languageStats = await getLanguageStatsService(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, languageStats, 'Language statistics fetched successfully'));
});

/**
 * Controller to fetch analysis trends grouped by day, week, or month.
 *
 * @route GET /api/dashboard/trends
 * @access Private
 */
export const getTrends = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const period = req.query.period || req.query.groupBy || 'day';
  const trendData = await getDashboardTrendsService(userId, period);

  return res
    .status(200)
    .json(new ApiResponse(200, trendData, 'Dashboard trends fetched successfully'));
});

export default {
  getOverview,
  getRecent,
  getLanguages,
  getTrends,
};
