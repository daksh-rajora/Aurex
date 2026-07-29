import axios from 'axios';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';

/**
 * Service to fetch detailed information for a specific GitHub repository.
 *
 * @param {Object} params - Parameters object
 * @param {string} params.userId - Aurex user ID (_id)
 * @param {string} params.owner - Repository owner (GitHub username/org)
 * @param {string} params.repo - Repository name
 * @returns {Promise<Object>} Combined repository details object
 */
export const repositoryDetailsService = async ({ userId, owner, repo }) => {
  if (!userId) {
    throw new ApiError(401, 'User is not authenticated');
  }

  if (!owner || !repo) {
    throw new ApiError(400, 'Both repository owner and repo name are required');
  }

  // 1. Fetch user to obtain githubAccessToken
  const user = await User.findById(userId).select('+githubAccessToken');

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!user.isGithubConnected || !user.githubAccessToken) {
    throw new ApiError(
      400,
      'GitHub account is not connected. Please connect your GitHub account first.'
    );
  }

  const headers = {
    Authorization: `Bearer ${user.githubAccessToken}`,
    Accept: 'application/vnd.github+json',
  };

  const baseUrl = `${githubConfig.apiBaseUrl}/repos/${owner}/${repo}`;

  try {
    // 2. Concurrently fetch repository metadata, languages, and contributors
    const [repoRes, languagesRes, contributorsRes] = await Promise.all([
      axios.get(baseUrl, { headers }),
      axios.get(`${baseUrl}/languages`, { headers }),
      axios.get(`${baseUrl}/contributors`, { headers }).catch(() => ({ data: [] })),
    ]);

    // 3. Fetch README separately to handle 404 gracefully
    let readmeData = { exists: false, content: null };
    try {
      const readmeRes = await axios.get(`${baseUrl}/readme`, { headers });
      if (readmeRes.data && readmeRes.data.content) {
        const decodedContent = Buffer.from(
          readmeRes.data.content,
          'base64'
        ).toString('utf-8');
        readmeData = {
          exists: true,
          content: decodedContent,
        };
      }
    } catch (readmeErr) {
      // README missing or unreadable
      readmeData = { exists: false, content: null };
    }

    return {
      repository: repoRes.data,
      languages: languagesRes.data || {},
      contributors: Array.isArray(contributorsRes.data) ? contributorsRes.data : [],
      readme: readmeData,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.response?.status === 404) {
      throw new ApiError(404, `Repository ${owner}/${repo} not found on GitHub`);
    }
    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.message || 'Failed to fetch repository details from GitHub'
    );
  }
};

export default repositoryDetailsService;
