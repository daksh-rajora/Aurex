import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import User from '../../models/User.js';
import { githubProfileService } from '../../services/github/githubProfile.service.js';

/**
 * Controller to handle fetching authenticated GitHub user profile.
 */
export const getGithubProfile = asyncHandler(async (req, res) => {
  let accessToken =
    req.body?.accessToken ||
    req.query?.accessToken ||
    req.headers['x-github-token'];

  // If no explicit GitHub access token parameter is sent, load it from authenticated MongoDB user
  if (!accessToken && req.user?._id) {
    const user = await User.findById(req.user._id).select('+githubAccessToken');
    if (user && user.githubAccessToken) {
      accessToken = user.githubAccessToken;
    }
  }

  if (!accessToken) {
    throw new ApiError(
      400,
      'GitHub access token is required. Please connect your GitHub account or provide a valid GitHub access token.'
    );
  }

  const profile = await githubProfileService(accessToken);

  return res
    .status(200)
    .json(new ApiResponse(200, profile, 'GitHub profile fetched successfully'));
});

export default getGithubProfile;
