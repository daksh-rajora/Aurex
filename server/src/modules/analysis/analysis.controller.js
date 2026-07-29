import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import {
  startAnalysisService,
  getAnalysisHistoryService,
  getSingleAnalysisService,
  deleteAnalysisService,
} from './analysis.service.js';

/**
 * Controller to start a new repository analysis.
 */
export const startAnalysis = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const analysisReport = await startAnalysisService({
    userId,
    owner,
    repo,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, analysisReport, 'Repository analysis initiated successfully'));
});

/**
 * Controller to fetch analysis history for the logged-in user.
 */
export const getAnalysisHistory = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const history = await getAnalysisHistoryService(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, history, 'Analysis history fetched successfully'));
});

/**
 * Controller to fetch a single analysis report by analysisId.
 */
export const getSingleAnalysis = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const report = await getSingleAnalysisService({ userId, analysisId });

  return res
    .status(200)
    .json(new ApiResponse(200, report, 'Analysis report fetched successfully'));
});

/**
 * Controller to delete an analysis report by analysisId.
 */
export const deleteAnalysis = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const result = await deleteAnalysisService({ userId, analysisId });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Analysis report deleted successfully'));
});

export default {
  startAnalysis,
  getAnalysisHistory,
  getSingleAnalysis,
  deleteAnalysis,
};
