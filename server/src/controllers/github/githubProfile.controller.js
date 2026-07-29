import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { githubProfileService } from '../../services/github/githubProfile.service.js';

/**
 * Controller to handle fetching authenticated GitHub user profile.
 */
export const getGithubProfile = asyncHandler(async (req, res) => {
  const accessToken =
    req.body?.accessToken ||
    req.headers['x-github-token'] ||
    req.query?.accessToken ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : req.headers.authorization);

  if (!accessToken) {
    throw new ApiError(400, 'GitHub access token is required');
  }

  const profile = await githubProfileService(accessToken);

  return res
    .status(200)
    .json(new ApiResponse(200, profile, 'GitHub profile fetched successfully'));
});

export default getGithubProfile;
