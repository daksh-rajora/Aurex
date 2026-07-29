import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';
import { githubRepositoriesService } from '../../services/github/githubRepositories.service.js';

/**
 * Controller to fetch all GitHub repositories for the authenticated user.
 */
export const getGithubRepositories = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const repositories = await githubRepositoriesService(userId);

  return res.status(200).json({
    statusCode: 200,
    success: true,
    message: 'Repositories fetched successfully',
    count: repositories.length,
    data: repositories,
  });
});

export default getGithubRepositories;
