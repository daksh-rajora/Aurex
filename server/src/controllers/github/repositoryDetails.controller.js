import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { repositoryDetailsService } from '../../services/github/repositoryDetails.service.js';

/**
 * Controller to handle fetching details for a specific repository.
 */
export const getRepositoryDetails = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!owner || !repo) {
    throw new ApiError(400, 'Owner and repo parameters are required');
  }

  const details = await repositoryDetailsService({
    userId,
    owner,
    repo,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, details, 'Repository details fetched successfully'));
});

export default getRepositoryDetails;
