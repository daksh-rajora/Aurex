import asyncHandler from '../../utils/asyncHandler.js';
import { githubLoginService } from '../../services/github/githubLogin.service.js';

/**
 * Controller to handle initiating the GitHub OAuth login redirection.
 */
export const githubLogin = asyncHandler(async (req, res) => {
  const token =
    req.query?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : null);

  const authUrl = githubLoginService(token);
  return res.redirect(authUrl);
});

export default githubLogin;
