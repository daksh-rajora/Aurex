import githubConfig from '../../config/github.config.js';

/**
 * Service to construct the GitHub OAuth Authorization URL.
 *
 * @param {string} [stateToken] - Optional JWT or state token to preserve across OAuth redirect
 * @returns {string} Complete GitHub OAuth authorization URL
 */
export const githubLoginService = (stateToken = null) => {
  const params = new URLSearchParams({
    client_id: githubConfig.clientId,
    redirect_uri: githubConfig.callbackUrl,
    scope: 'read:user user:email repo',
    allow_signup: 'true',
  });

  if (stateToken) {
    params.append('state', stateToken);
  }

  return `${githubConfig.authorizeUrl}?${params.toString()}`;
};

export default githubLoginService;
