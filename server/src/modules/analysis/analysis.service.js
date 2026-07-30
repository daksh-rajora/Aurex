import axios from 'axios';
import User from '../../models/User.js';
import Analysis from '../../models/Analysis.js';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';
import { repositoryDetailsService } from '../../services/github/repositoryDetails.service.js';
import {
  runAIAnalysisService,
  getAnalysisReportService,
} from './services/aiAnalysis.service.js';

/**
 * Service to initiate repository analysis metadata collection and store in MongoDB.
 *
 * @param {Object} params - Parameters object
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @returns {Promise<Object>} Created Analysis document
 */
export const startAnalysisService = async ({ userId, owner, repo }) => {
  // 1. Verify user authentication
  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  // 2. Verify GitHub account connection
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

  // 3, 4, 5. Fetch repository details, languages, and README via GitHub service layer
  const repoDetails = await repositoryDetailsService({ userId, owner, repo });
  const { repository, languages, readme } = repoDetails;

  // 6. Fetch repository root contents
  let rootContents = [];
  try {
    const contentsRes = await axios.get(
      `${githubConfig.apiBaseUrl}/repos/${owner}/${repo}/contents`,
      {
        headers: {
          Authorization: `Bearer ${user.githubAccessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'Aurex-App',
        },
      }
    );
    rootContents = Array.isArray(contentsRes.data)
      ? contentsRes.data.map((item) => ({
          name: item.name,
          type: item.type,
          path: item.path,
        }))
      : [];
  } catch (err) {
    console.warn(`[Analysis Service] Warning fetching root contents for ${owner}/${repo}:`, err.message);
  }

  // 7 & 8. Store all collected repository metadata in MongoDB with placeholder analysis
  const mainLanguage = repository.language || (languages && Object.keys(languages)[0]) || 'Unknown';

  const analysisDoc = await Analysis.create({
    user: userId,
    repository: {
      owner: repository.owner?.login || owner,
      name: repository.name || repo,
      fullName: repository.full_name || `${owner}/${repo}`,
      htmlUrl: repository.html_url || '',
      defaultBranch: repository.default_branch || 'main',
      description: repository.description || '',
      visibility: repository.visibility || (repository.private ? 'private' : 'public'),
    },
    github: {
      repoId: String(repository.id || ''),
      language: mainLanguage,
      stars: repository.stargazers_count || 0,
      forks: repository.forks_count || 0,
      watchers: repository.watchers_count || 0,
      openIssues: repository.open_issues_count || 0,
      topics: Array.isArray(repository.topics) ? repository.topics : [],
    },
    metadata: {
      languages: languages || {},
      readme: readme || { exists: false, content: null },
      rootContents: rootContents || [],
    },
    analysis: {
      overallScore: 0,
      codeQuality: 0,
      documentation: 0,
      architecture: 0,
      maintainability: 0,
      security: 0,
      performance: 0,
      bestPractices: 0,
      strengths: [],
      weaknesses: [],
      suggestions: [],
      summary: 'Repository data collected successfully. AI analysis has not been executed yet.',
    },
    status: 'Completed',
  });

  return analysisDoc;
};

/**
 * Service to fetch analysis history for the logged-in user.
 *
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Array<Object>>} Formatted analysis history list
 */
export const getAnalysisHistoryService = async (userId) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  const history = await Analysis.find({ user: userId })
    .select('repository status analysis.overallScore createdAt')
    .sort({ createdAt: -1 });

  return history.map((item) => ({
    _id: item._id,
    repository: item.repository?.name || '',
    owner: item.repository?.owner || '',
    status: item.status,
    overallScore: item.analysis?.overallScore ?? 0,
    createdAt: item.createdAt,
  }));
};

/**
 * Service to fetch a single analysis report by analysisId.
 *
 * @param {Object} params - Parameters object
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.analysisId - Analysis Mongo ID
 * @returns {Promise<Object>} Full Analysis document
 */
export const getSingleAnalysisService = async ({ userId, analysisId }) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  const report = await Analysis.findOne({ _id: analysisId, user: userId });
  if (!report) {
    throw new ApiError(404, 'Analysis report not found');
  }

  return report;
};

/**
 * Service to delete an analysis report by analysisId (Only owner can delete).
 *
 * @param {Object} params - Parameters object
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.analysisId - Analysis Mongo ID
 * @returns {Promise<Object>} Deletion result confirmation
 */
export const deleteAnalysisService = async ({ userId, analysisId }) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  const report = await Analysis.findOne({ _id: analysisId, user: userId });
  if (!report) {
    throw new ApiError(404, 'Analysis report not found or unauthorized');
  }

  await Analysis.findByIdAndDelete(analysisId);

  return { id: analysisId, deleted: true };
};

export {
  runAIAnalysisService,
  getAnalysisReportService,
};

export default {
  startAnalysisService,
  getAnalysisHistoryService,
  getSingleAnalysisService,
  deleteAnalysisService,
  runAIAnalysisService,
  getAnalysisReportService,
};
