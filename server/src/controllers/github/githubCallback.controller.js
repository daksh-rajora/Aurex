import asyncHandler from '../../utils/asyncHandler.js';
import config from '../../config/config.js';
import { verifyAccessToken, generateAccessToken } from '../../utils/jwt.js';
import { githubCallbackService } from '../../services/github/githubCallback.service.js';
import { githubConnectService } from '../../services/github/githubConnect.service.js';
import { githubLoginOrRegisterService } from '../../services/github/githubLoginOrRegister.service.js';

/**
 * Controller to handle GitHub OAuth callback logic, user login/auto-registration,
 * and redirecting browser to frontend with Aurex JWT token.
 *
 * @route GET /api/github/callback
 * @access Public
 */
export const githubCallback = asyncHandler(async (req, res) => {
  const { code, state, error: oauthError } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || config.frontendUrl || 'http://localhost:5173';

  // Handle cancelled or failed OAuth from GitHub
  if (oauthError) {
    console.error('[GitHub Callback Error]', oauthError);
    return res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent('GitHub authorization was cancelled or failed.')}`
    );
  }

  if (!code) {
    return res.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent('Authorization code is required from GitHub callback.')}`
    );
  }

  try {
    // 1. Exchange authorization code for GitHub access token
    const { accessToken } = await githubCallbackService(code);

    // 2. Check state token for existing logged-in user session
    let token = state;
    let userId = req.user?._id;

    if (!userId && token) {
      try {
        const decoded = verifyAccessToken(token);
        userId = decoded?.userId || decoded?._id || decoded?.id;
      } catch (err) {
        console.warn('[GitHub Callback] State JWT verification warning:', err.message);
      }
    }

    let user;
    if (userId) {
      // Connect GitHub account to existing authenticated user
      user = await githubConnectService(userId, accessToken);
    } else {
      // Direct GitHub Login / Auto-Registration
      user = await githubLoginOrRegisterService(accessToken);
    }

    // 3. Generate Aurex JWT access token
    const jwtToken = generateAccessToken(user);

    // 4. Redirect browser to Frontend callback route with JWT token (${FRONTEND_URL}/auth/github/callback?token=<JWT>)
    return res.redirect(`${frontendUrl}/auth/github/callback?token=${jwtToken}`);
  } catch (err) {
    console.error('[GitHub Callback Processing Error]', err.message);
    const errorMsg = err.message || 'GitHub authentication failed. Please try again.';
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
  }
});

export default githubCallback;
