import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { repositoryAnalysisService } from '../../services/github/repositoryAnalysis.service.js';

/**
 * Controller to handle analyzing repository health and generating report.
 */
export const analyzeRepository = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!owner || !repo) {
    throw new ApiError(400, 'Owner and repo parameters are required');
  }

  const analysisReport = await repositoryAnalysisService({
    userId,
    owner,
    repo,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, analysisReport, 'Repository analysis completed successfully'));
});

export default analyzeRepository;
