import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { compareRepositoriesService } from '../../services/analysis/comparison.service.js';

/**
 * Controller to handle repository comparison requests.
 */
export const compareRepositories = asyncHandler(async (req, res) => {
  const { repositoryOne, repositoryTwo } = req.body || {};
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!repositoryOne || !repositoryTwo) {
    throw new ApiError(400, 'Both repositoryOne and repositoryTwo objects are required in request body');
  }

  const result = await compareRepositoriesService({
    userId,
    repositoryOne,
    repositoryTwo,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Repository comparison completed successfully'));
});

export default compareRepositories;
