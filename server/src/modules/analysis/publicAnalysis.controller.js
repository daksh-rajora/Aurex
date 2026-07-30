import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { publicAnalysisService } from './services/publicAnalysis.service.js';

/**
 * Controller to handle Public Repository AI Analysis.
 * Can be accessed by anyone (no GitHub account connection or authentication required).
 */
export const runPublicAnalysis = asyncHandler(async (req, res) => {
  const { repository, url, provider } = req.body || {};
  const userId = req.user?._id || null;

  const report = await publicAnalysisService({
    repository,
    url,
    userId,
    provider,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, report, 'Public repository analysis completed successfully'));
});

export default runPublicAnalysis;
