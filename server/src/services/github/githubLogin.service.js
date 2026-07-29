import githubConfig from '../../config/github.config.js';

/**
 * Service to construct the GitHub OAuth Authorization URL.
 *
 * @returns {string} Complete GitHub OAuth authorization URL
 */
export const githubLoginService = () => {
  const params = new URLSearchParams({
    client_id: githubConfig.clientId,
    redirect_uri: githubConfig.callbackUrl,
    scope: 'read:user user:email repo',
    allow_signup: 'true',
  });

  return `${githubConfig.authorizeUrl}?${params.toString()}`;
};

export default githubLoginService;
