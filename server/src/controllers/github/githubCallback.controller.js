import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { githubCallbackService } from '../../services/github/githubCallback.service.js';

/**
 * Controller to handle GitHub OAuth callback logic.
 */
export const githubCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;

  if (!code) {
    throw new ApiError(400, 'Authorization code is required from GitHub callback');
  }

  const result = await githubCallbackService(code);

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'GitHub access token obtained successfully'));
});

export default githubCallback;
