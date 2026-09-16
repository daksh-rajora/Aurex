import axios from 'axios';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';

/**
 * Service to fetch detailed information and metadata for a specific GitHub repository.
 *
 * @param {Object} params - Parameters object
 * @param {string} params.userId - Aurex user ID (_id)
 * @param {string} params.owner - Repository owner (GitHub username/org)
 * @param {string} params.repo - Repository name
 * @returns {Promise<Object>} Combined repository metadata object
 */
export const repositoryDetailsService = async ({ userId, owner, repo }) => {
  console.log(`[Pipeline] Fetching GitHub Repository metadata for ${owner}/${repo}...`);

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

  const headers = user.isGithubConnected && user.githubAccessToken
    ? { Authorization: `Bearer ${user.githubAccessToken}`, Accept: 'application/vnd.github+json' }
    : { Accept: 'application/vnd.github+json' };

  const baseUrl = `${githubConfig.apiBaseUrl}/repos/${owner}/${repo}`;

  try {
    // 2. Concurrently fetch repository metadata, languages, and root contents
    const [repoRes, languagesRes, contentsRes] = await Promise.all([
      axios.get(baseUrl, { headers }),
      axios.get(`${baseUrl}/languages`, { headers }).catch(() => ({ data: {} })),
      axios.get(`${baseUrl}/contents`, { headers }).catch(() => ({ data: [] })),
    ]);

    console.log(`[Pipeline] Repository fetched successfully (${owner}/${repo})`);

    // 3. Fetch README separately to handle 404 gracefully
    let readmeData = { exists: false, content: null };
    try {
      const readmeRes = await axios.get(`${baseUrl}/readme`, { headers });
      if (readmeRes.data && readmeRes.data.content) {
        const decodedContent = Buffer.from(readmeRes.data.content, 'base64').toString('utf-8');
        readmeData = {
          exists: true,
          content: decodedContent,
        };
        console.log(`[Pipeline] README fetched successfully (${decodedContent.length} bytes)`);
      } else {
        console.log(`[Pipeline] README fetched: No content found`);
      }
    } catch (readmeErr) {
      console.log(`[Pipeline] README fetched: None available for ${owner}/${repo}`);
      readmeData = { exists: false, content: null };
    }

    // 4. Format root folder structure (top-level files & folders only)
    const rootContents = Array.isArray(contentsRes.data)
      ? contentsRes.data.map((item) => ({
          name: item.name,
          type: item.type === 'dir' ? 'dir' : 'file',
          path: item.path,
        }))
      : [];

    return {
      repository: repoRes.data,
      languages: languagesRes.data || {},
      readme: readmeData,
      rootContents,
    };
  } catch (error) {
    console.error(`[Pipeline Error] Failed to fetch repository details for ${owner}/${repo}:`, error.message);
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
