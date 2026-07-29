import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import { verifyAccessToken } from '../../utils/jwt.js';
import { githubCallbackService } from '../../services/github/githubCallback.service.js';
import { githubConnectService } from '../../services/github/githubConnect.service.js';

/**
 * Controller to handle GitHub OAuth callback logic and account linking.
 */
export const githubCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    throw new ApiError(400, 'Authorization code is required from GitHub callback');
  }

  // 1. Exchange authorization code for GitHub access token
  const { accessToken } = await githubCallbackService(code);

  // 2. Extract authenticated user ID from state parameter, req.user, or authorization header
  let token =
    state ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : null);
  let userId = req.user?._id;

  if (!userId && token) {
    try {
      const decoded = verifyAccessToken(token);
      userId = decoded?.userId || decoded?._id || decoded?.id;
    } catch (err) {
      console.warn('[GitHub Callback] State JWT verification warning:', err.message);
    }
  }

  // 3. If authenticated user is present, link GitHub account & update MongoDB user document!
  if (userId) {
    const updatedUser = await githubConnectService(userId, accessToken);
    return res.status(200).json(
      new ApiResponse(200, updatedUser, 'GitHub account connected successfully')
    );
  }

  // 4. Return access token for clients to call POST /api/github/connect with Bearer JWT
  return res.status(200).json(
    new ApiResponse(
      200,
      { accessToken },
      'GitHub access token obtained successfully. Call POST /api/github/connect with Bearer JWT to link account.'
    )
  );
});

export default githubCallback;
