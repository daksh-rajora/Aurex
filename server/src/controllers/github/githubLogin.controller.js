import asyncHandler from '../../utils/asyncHandler.js';
import { githubLoginService } from '../../services/github/githubLogin.service.js';

/**
 * Controller to handle initiating the GitHub OAuth login redirection.
 */
export const githubLogin = asyncHandler(async (req, res) => {
  const authUrl = githubLoginService();
  return res.redirect(authUrl);
});

export default githubLogin;
