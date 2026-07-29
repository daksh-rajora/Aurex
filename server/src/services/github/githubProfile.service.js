import axios from 'axios';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';

/**
 * Service to fetch profile details of an authenticated GitHub user.
 *
 * @param {string} accessToken - GitHub OAuth access token
 * @returns {Promise<Object>} Filtered GitHub user profile object
 */
export const githubProfileService = async (accessToken) => {
  if (!accessToken) {
    throw new ApiError(400, 'GitHub access token is required');
  }

  try {
    const response = await axios.get(`${githubConfig.apiBaseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
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
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'Unable to fetch GitHub profile');
  }
};

export default githubProfileService;
