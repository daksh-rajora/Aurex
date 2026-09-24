import axios from 'axios';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';

/**
 * Secret / Ignored files check according to Requirement 6:
 * Ignore: .env, .env.*, private keys, API keys, tokens, credentials, node_modules, .git, dist, build, coverage, binary/media files
 */
export const isIgnoredFile = (filePath) => {
  if (!filePath) return true;
  const lower = filePath.toLowerCase();
  const basename = filePath.split('/').pop().toLowerCase();

  // Ignored secrets & config files
  if (
    basename.startsWith('.env') ||
    basename.includes('secret') ||
    basename.includes('id_rsa') ||
    basename.endsWith('.pem') ||
    basename.endsWith('.key') ||
    basename.includes('token') ||
    basename.includes('credentials')
  ) {
    return true;
  }

  // Ignored directories
  if (
    lower.startsWith('node_modules/') ||
    lower.startsWith('.git/') ||
    lower.startsWith('dist/') ||
    lower.startsWith('build/') ||
    lower.startsWith('coverage/') ||
    lower.includes('/node_modules/') ||
    lower.includes('/.git/') ||
    lower.includes('/dist/') ||
    lower.includes('/build/') ||
    lower.includes('/coverage/')
  ) {
    return true;
  }

  // Binary & Media Extensions
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.avif',
    '.zip', '.tar', '.gz', '.7z', '.pdf', '.mp4', '.mp3', '.mov',
    '.woff', '.woff2', '.ttf', '.eot', '.lock', '.exe', '.dll', '.so', '.dylib', '.jar'
  ];

  if (binaryExtensions.some((ext) => lower.endsWith(ext))) {
    return true;
  }

  return false;
};

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

    // 4. Format root folder structure (excluding ignored files)
    const rawContents = Array.isArray(contentsRes.data) ? contentsRes.data : [];
    const rootContents = rawContents
      .filter((item) => !isIgnoredFile(item.path))
      .map((item) => ({
        name: item.name,
        type: item.type === 'dir' ? 'dir' : 'file',
        path: item.path,
      }));

    // 5. Fetch relevant source file contents (e.g. package.json, main source files)
    const sourceFiles = [];
    const filesToFetch = rawContents
      .filter((item) => item.type === 'file' && !isIgnoredFile(item.path) && item.name !== 'README.md')
      .slice(0, 6);

    for (const fileItem of filesToFetch) {
      try {
        const fileRes = await axios.get(`${baseUrl}/contents/${fileItem.path}`, { headers });
        if (fileRes.data && fileRes.data.content && fileRes.data.encoding === 'base64') {
          const content = Buffer.from(fileRes.data.content, 'base64').toString('utf-8');
          sourceFiles.push({
            path: fileItem.path,
            content: content.slice(0, 3000),
          });
        }
      } catch (err) {
        // Skip individual file error
      }
    }

    return {
      repository: repoRes.data,
      languages: languagesRes.data || {},
      readme: readmeData,
      rootContents,
      sourceFiles,
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
