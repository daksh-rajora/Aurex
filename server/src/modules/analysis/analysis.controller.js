import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import {
  startAnalysisService,
  createStartAnalysisService,
  getAnalysisHistoryService,
  getSingleAnalysisService,
  deleteAnalysisService,
  runAIAnalysisService,
  getAnalysisReportService,
} from './analysis.service.js';

/**
 * Controller to start a new repository analysis.
 */
export const startAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const { owner: paramOwner, repo: paramRepo } = req.params;
  const { repositoryId, repositoryName, owner: bodyOwner, githubUrl, language } = req.body || {};

  let analysisReport;
  if (paramOwner && paramRepo) {
    analysisReport = await startAnalysisService({
      userId,
      owner: paramOwner,
      repo: paramRepo,
    });
  } else {
    analysisReport = await createStartAnalysisService({
      userId,
      repositoryId,
      repositoryName: repositoryName || paramRepo,
      owner: bodyOwner || paramOwner,
      githubUrl,
      language,
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, analysisReport, 'Repository analysis initiated successfully'));
});

/**
 * Controller to trigger AI analysis on an existing analysis record.
 */
export const runAIAnalysis = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;
  const { provider } = req.body || {};
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const updatedReport = await runAIAnalysisService({
    userId,
    analysisId,
    provider,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedReport, 'AI repository analysis completed successfully'));
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
 * Controller to fetch full AI analysis report by analysisId.
 */
export const getAnalysisReport = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const report = await getAnalysisReportService({ userId, analysisId });

  return res
    .status(200)
    .json(new ApiResponse(200, report, 'AI analysis report fetched successfully'));
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
  runAIAnalysis,
  getAnalysisHistory,
  getSingleAnalysis,
  getAnalysisReport,
  deleteAnalysis,
};

