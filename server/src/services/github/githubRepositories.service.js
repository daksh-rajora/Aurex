import axios from 'axios';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';

/**
 * Service to fetch repositories of the connected GitHub account for an authenticated user.
 *
 * @param {string} userId - Aurex user ID (_id)
 * @returns {Promise<Array<Object>>} Filtered list of GitHub repositories
 */
export const githubRepositoriesService = async (userId) => {
  if (!userId) {
    throw new ApiError(401, 'User is not authenticated');
  }

  // 1. Fetch user with githubAccessToken
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

  // 2. Fetch repositories from GitHub API with pagination per_page=100
  try {
    const response = await axios.get(`${githubConfig.apiBaseUrl}/user/repos`, {
      headers: {
        Authorization: `Bearer ${user.githubAccessToken}`,
        Accept: 'application/vnd.github+json',
      },
      params: {
        per_page: 100,
        sort: 'updated',
      },
    });

    const reposData = response.data;

    if (!Array.isArray(reposData)) {
      throw new ApiError(500, 'Invalid repository list returned by GitHub');
    }

    // 3. Filter only requested fields
    const repositories = reposData.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      description: repo.description,
      language: repo.language,
      default_branch: repo.default_branch,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      watchers_count: repo.watchers_count,
      open_issues_count: repo.open_issues_count,
      size: repo.size,
      visibility: repo.visibility,
      html_url: repo.html_url,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
    }));

    return repositories;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.message || 'Failed to fetch repositories from GitHub'
    );
  }
};

export default githubRepositoriesService;
