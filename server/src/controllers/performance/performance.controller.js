import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import Analysis from '../../models/Analysis.js';
import {
  getPerformanceOverviewService,
  getPerformanceReportForAnalysisService,
  getPerformanceRepositoriesService,
} from '../../services/performance/performance.service.js';

/**
 * @desc    Get aggregate performance overview metrics
 * @route   GET /api/performance/overview
 * @access  Public / Optional Auth
 */
export const getPerformanceOverview = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const overview = await getPerformanceOverviewService(userId);
  return res.status(200).json(new ApiResponse(200, overview, 'Performance overview fetched successfully'));
});

/**
 * @desc    Get list of repositories with performance analysis available
 * @route   GET /api/performance/repositories
 * @access  Public / Optional Auth
 */
export const getPerformanceRepositories = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const repos = await getPerformanceRepositoriesService(userId);
  return res.status(200).json(new ApiResponse(200, repos, 'Performance repositories fetched successfully'));
});

/**
 * @desc    Get detailed performance report for a specific analysis document
 * @route   GET /api/performance/:analysisId
 * @access  Public / Optional Auth
 */
export const getPerformanceReport = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const { analysisId } = req.params;

  const report = await getPerformanceReportForAnalysisService(analysisId, userId);
  return res.status(200).json(new ApiResponse(200, report, 'Performance report fetched successfully'));
});

/**
 * @desc    Get latest performance report for a specific repository
 * @route   GET /api/performance/latest/:owner/:repo
 * @access  Public / Optional Auth
 */
export const getLatestPerformanceForRepo = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const { owner, repo } = req.params;
  const fullName = `${owner}/${repo}`;

  const query = {
    'repository.fullName': { $regex: new RegExp(`^${fullName}$`, 'i') },
    status: 'Completed',
  };

  const doc = await Analysis.findOne(query).sort({ createdAt: -1 });

  if (!doc) {
    return res.status(200).json(
      new ApiResponse(200, null, 'No performance analysis found for this repository yet.')
    );
  }

  const report = await getPerformanceReportForAnalysisService(doc._id, userId);
  return res.status(200).json(new ApiResponse(200, report, 'Latest performance report fetched successfully'));
});

export default {
  getPerformanceOverview,
  getPerformanceRepositories,
  getPerformanceReport,
  getLatestPerformanceForRepo,
};
