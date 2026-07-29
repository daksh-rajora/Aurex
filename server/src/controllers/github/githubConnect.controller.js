import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { githubConnectService } from '../../services/github/githubConnect.service.js';

/**
 * Controller to connect GitHub account to the currently authenticated Aurex user.
 */
export const githubConnect = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const accessToken =
    req.body?.accessToken ||
    req.body?.githubAccessToken ||
    req.headers['x-github-token'];

  if (!userId) {
    throw new ApiError(401, 'Authentication token is required');
  }

  if (!accessToken) {
    throw new ApiError(400, 'GitHub access token is required');
  }

  const user = await githubConnectService(userId, accessToken);

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'GitHub account connected successfully'));
});

export default githubConnect;
