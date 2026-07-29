import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { repositoryReviewService } from '../../services/ai/repositoryReview.service.js';

/**
 * Controller to handle AI-powered repository review generation.
 */
export const getRepositoryAIReview = asyncHandler(async (req, res) => {
  const { owner, repo } = req.body || {};
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!owner || !repo) {
    throw new ApiError(400, 'Both owner and repo parameters are required in request body');
  }

  const review = await repositoryReviewService({
    userId,
    owner,
    repo,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, review, 'AI repository review generated successfully'));
});

export default getRepositoryAIReview;
