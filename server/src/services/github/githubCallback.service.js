import axios from 'axios';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';

/**
 * Service to exchange GitHub OAuth code for access token.
 *
 * @param {string} code - Authorization code from GitHub
 * @returns {Promise<{accessToken: string}>} GitHub access token object
 */
export const githubCallbackService = async (code) => {
  if (!code) {
    throw new ApiError(400, 'Authorization code is required');
  }

  try {
    const response = await axios.post(
      githubConfig.accessTokenUrl,
      {
        client_id: githubConfig.clientId,
        client_secret: githubConfig.clientSecret,
        code,
        redirect_uri: githubConfig.callbackUrl,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    const accessToken = response.data?.access_token;

    if (!accessToken) {
      throw new ApiError(401, 'Failed to obtain GitHub access token');
    }

    return {
      accessToken,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      401,
      error.response?.data?.error_description || 'Failed to obtain GitHub access token'
    );
  }
};

export default githubCallbackService;
