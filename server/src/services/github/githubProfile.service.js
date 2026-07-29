import axios from 'axios';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';

/**
 * Service to fetch profile details of an authenticated GitHub user.
 *
 * @param {string} accessToken - GitHub OAuth access token (gho_...)
 * @returns {Promise<Object>} Filtered GitHub user profile object
 */
export const githubProfileService = async (accessToken) => {
  if (!accessToken) {
    throw new ApiError(400, 'GitHub access token is required');
  }

  // Prevent accidentally sending JWT token (which starts with eyJ)
  if (accessToken.startsWith('eyJ')) {
    throw new ApiError(
      400,
      'Invalid GitHub access token: JWT token was provided instead of a GitHub OAuth token'
    );
  }

  try {
    const response = await axios.get(`${githubConfig.apiBaseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Aurex-App',
      },
    });

    const data = response.data;

    return {
      id: data.id,
      login: data.login,
      name: data.name,
      avatar_url: data.avatar_url,
      bio: data.bio,
      company: data.company,
      location: data.location,
      blog: data.blog,
      public_repos: data.public_repos,
      followers: data.followers,
      following: data.following,
      html_url: data.html_url,
    };
  } catch (error) {
    console.error('[GitHub Profile Error]', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.response?.status || 401,
      error.response?.data?.message || 'Unable to fetch GitHub profile'
    );
  }
};

export default githubProfileService;
