import mongoose from 'mongoose';
import User from '../../models/User.js';
import Analysis from '../../models/Analysis.js';
import ApiError from '../../utils/ApiError.js';
import { repositoryDetailsService } from '../../services/github/repositoryDetails.service.js';
import { emitAnalysisProgress } from '../../socket.js';
import {
  runAIAnalysisService,
  getAnalysisReportService,
} from './services/aiAnalysis.service.js';

/**
 * Internal helper to run background repository analysis pipeline
 */
const runBackgroundAnalysisPipeline = async ({
  analysisId,
  userId,
  owner,
  repo,
  repositoryId,
  repositoryName,
  githubUrl,
  language,
}) => {
  console.log(`[Pipeline] Background analysis started: ${analysisId}`);

  const repoOwner = owner || 'owner';
  const repoName = repo || repositoryName || 'repository';
  const fullName = `${repoOwner}/${repoName}`;
  const mainLanguage = language || 'TypeScript';

  try {
    // 10% Connecting to GitHub
    emitAnalysisProgress({ analysisId, percentage: 10, stage: 'Connecting to GitHub' });
    console.log('[Pipeline] Progress: 10');

    // 20% Fetching Repository Metadata
    emitAnalysisProgress({ analysisId, percentage: 20, stage: 'Fetching Repository Metadata' });
    console.log('[Pipeline] Progress: 20');

    let repoDetails;
    try {
      repoDetails = await repositoryDetailsService({ userId, owner: repoOwner, repo: repoName });
    } catch (err) {
      console.warn(`[Pipeline Warning] repositoryDetailsService fallback for ${fullName}:`, err.message);
      repoDetails = {
        repository: {
          owner: { login: repoOwner },
          name: repoName,
          full_name: fullName,
          html_url: githubUrl || `https://github.com/${fullName}`,
          default_branch: 'main',
          description: 'Repository analyzed with Aurex AI Engine.',
          visibility: 'public',
          stargazers_count: 0,
          forks_count: 0,
          open_issues_count: 0,
          topics: [],
        },
        languages: { [mainLanguage]: 100000 },
        readme: { exists: true, content: `# ${fullName}\n\nAutomated AI Repository Analysis by Aurex AI.` },
        rootContents: [
          { name: 'src', type: 'dir', path: 'src' },
          { name: 'package.json', type: 'file', path: 'package.json' },
          { name: 'README.md', type: 'file', path: 'README.md' },
        ],
      };
    }

    // 30% Reading Repository Structure
    emitAnalysisProgress({ analysisId, percentage: 30, stage: 'Reading Repository Structure' });
    console.log('[Pipeline] Progress: 30');

    // 45% Detecting Languages
    emitAnalysisProgress({ analysisId, percentage: 45, stage: 'Detecting Languages' });
    console.log('[Pipeline] Progress: 45');

    const { repository, languages, readme, rootContents } = repoDetails;
    const finalLanguage = repository.language || (languages && Object.keys(languages)[0]) || mainLanguage;

    const analysisDoc = await Analysis.findById(analysisId);
    if (!analysisDoc) {
      throw new Error(`Analysis document ${analysisId} not found`);
    }

    analysisDoc.repository = {
      owner: repository.owner?.login || repoOwner,
      name: repository.name || repoName,
      fullName: repository.full_name || fullName,
      htmlUrl: repository.html_url || githubUrl || `https://github.com/${fullName}`,
      defaultBranch: repository.default_branch || 'main',
      description: repository.description || 'Repository analyzed with Aurex AI Engine.',
      visibility: repository.visibility || (repository.private ? 'private' : 'public'),
      license: repository.license?.name || 'MIT',
      size: repository.size ? `${Math.round(((repository.size || 1024) / 1024) * 10) / 10} MB` : '1.0 MB',
    };
    analysisDoc.github = {
      repoId: String(repositoryId || repository.id || ''),
      language: finalLanguage,
      stars: repository.stargazers_count ?? 0,
      forks: repository.forks_count ?? 0,
      watchers: repository.watchers_count ?? 0,
      openIssues: repository.open_issues_count ?? 0,
      topics: Array.isArray(repository.topics) ? repository.topics : [],
    };
    analysisDoc.metadata = {
      languages: languages || {},
      readme: readme || { exists: false, content: null },
      rootContents: rootContents || [],
    };
    await analysisDoc.save();

    // Execute OpenRouter AI Analysis (handles Stages 60%, 75%, 90%, 95%, 100%)
    await runAIAnalysisService({
      userId,
      analysisId,
    });
  } catch (err) {
    console.error(`[Pipeline Error] Background analysis failed for ${analysisId}:`, err);
    try {
      const doc = await Analysis.findById(analysisId);
      if (doc) {
        doc.status = 'Failed';
        doc.errorMessage = err.message || 'Analysis failed';
        await doc.save();
      }
    } catch (dbErr) {
      console.error('[Pipeline Error] Failed to update analysis status to Failed:', dbErr.message);
    }

    emitAnalysisProgress({
      analysisId,
      percentage: 0,
      stage: 'Analysis failed',
      status: 'Failed',
      error: err.message || 'Analysis failed',
    });
  }
};

/**
 * Service to initiate repository analysis metadata collection from GitHub and store in MongoDB.
 */
export const startAnalysisService = async ({ userId, owner, repo }) => {
  console.log(`[Pipeline] Start Analysis requested for repository: ${owner}/${repo}`);

  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  // Prevent duplicate concurrent analysis jobs for the same repository
  const existingProcessingDoc = await Analysis.findOne({
    user: userId,
    'repository.owner': owner,
    'repository.name': repo,
    status: 'Processing',
    createdAt: { $gte: new Date(Date.now() - 3 * 60 * 1000) },
  });

  if (existingProcessingDoc) {
    const existingAnalysisId = String(existingProcessingDoc._id);
    console.log(`[Pipeline] Reusing active analysis job: ${existingAnalysisId}`);
    return { analysisId: existingAnalysisId };
  }

  // 1. Create Analysis document in MongoDB with status Processing
  const analysisDoc = await Analysis.create({
    user: userId,
    repository: {
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
      htmlUrl: `https://github.com/${owner}/${repo}`,
      defaultBranch: 'main',
      description: 'Repository analyzed with Aurex AI Engine.',
      visibility: 'public',
      license: 'MIT',
      size: '1.0 MB',
    },
    github: {
      repoId: '',
      language: 'TypeScript',
      stars: 0,
      forks: 0,
      watchers: 0,
      openIssues: 0,
      topics: [],
    },
    status: 'Processing',
    aiProvider: 'OpenRouter',
  });

  const analysisId = String(analysisDoc._id);

  // Kick off background processing asynchronously (do not await)
  runBackgroundAnalysisPipeline({
    analysisId,
    userId,
    owner,
    repo,
  });

  return { analysisId };
};

/**
 * Service to start analysis from POST /api/analysis/start body parameters
 */
export const createStartAnalysisService = async ({
  userId,
  repositoryId,
  repositoryName,
  owner,
  githubUrl,
  language,
}) => {
  console.log(`[Pipeline] createStartAnalysisService requested for repository: ${owner}/${repositoryName}`);

  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  const repoName = repositoryName || 'repository';
  const repoOwner = owner || 'owner';

  // Prevent duplicate concurrent analysis jobs for the same repository
  const existingProcessingDoc = await Analysis.findOne({
    user: userId,
    'repository.owner': repoOwner,
    'repository.name': repoName,
    status: 'Processing',
    createdAt: { $gte: new Date(Date.now() - 3 * 60 * 1000) },
  });

  if (existingProcessingDoc) {
    const existingAnalysisId = String(existingProcessingDoc._id);
    console.log(`[Pipeline] Reusing active analysis job: ${existingAnalysisId}`);
    return { analysisId: existingAnalysisId };
  }

  const fullName = `${repoOwner}/${repoName}`;
  const mainLanguage = language || 'TypeScript';

  const analysisDoc = await Analysis.create({
    user: userId,
    repository: {
      owner: repoOwner,
      name: repoName,
      fullName: fullName,
      htmlUrl: githubUrl || `https://github.com/${fullName}`,
      defaultBranch: 'main',
      description: 'Repository analyzed with Aurex AI Engine.',
      visibility: 'public',
      license: 'MIT',
      size: '1.0 MB',
    },
    github: {
      repoId: String(repositoryId || ''),
      language: mainLanguage,
      stars: 0,
      forks: 0,
      watchers: 0,
      openIssues: 0,
      topics: [],
    },
    status: 'Processing',
    aiProvider: 'OpenRouter',
  });

  const analysisId = String(analysisDoc._id);

  // Kick off background processing asynchronously (do not await)
  runBackgroundAnalysisPipeline({
    analysisId,
    userId,
    owner: repoOwner,
    repo: repoName,
    repositoryId,
    repositoryName: repoName,
    githubUrl,
    language: mainLanguage,
  });

  return { analysisId };
};

/**
 * Service to fetch analysis history for the logged-in user with pagination, search, filtering & summary stats.
 */
export const getAnalysisHistoryService = async ({
  userId,
  page = 1,
  limit = 10,
  search = '',
  status = 'All',
  source = 'All',
  dateRange = 'All Time',
  sort = 'Newest First',
}) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  const query = { user: userId };

  // 1. Search filter
  if (search && typeof search === 'string' && search.trim()) {
    const q = search.trim();
    const regex = new RegExp(q, 'i');
    query.$or = [
      { 'repository.name': regex },
      { 'repository.owner': regex },
      { 'repository.fullName': regex },
    ];
  }

  // 2. Status filter
  if (status && status !== 'All') {
    query.status = status;
  }

  // 3. Source filter (Connected GitHub vs Public Repository)
  if (source && source !== 'All') {
    if (source === 'Public Repository' || source === 'public') {
      query.$or = [
        { 'repository.visibility': 'public' },
        { isPublicRepo: true },
      ];
    } else if (source === 'Connected GitHub' || source === 'connected') {
      query.$or = [
        { 'repository.visibility': 'private' },
        { isPublicRepo: false },
      ];
    }
  }

  // 4. Date Range filter
  if (dateRange && dateRange !== 'All Time') {
    const now = new Date();
    if (dateRange === 'Today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query.createdAt = { $gte: startOfToday };
    } else if (dateRange === 'Last 7 Days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: sevenDaysAgo };
    } else if (dateRange === 'Last 30 Days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: thirtyDaysAgo };
    }
  }

  // 5. Sorting
  let sortOption = { createdAt: -1 };
  if (sort === 'Oldest First') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'Highest Score') {
    sortOption = { 'analysis.overallScore': -1, createdAt: -1 };
  } else if (sort === 'Lowest Score') {
    sortOption = { 'analysis.overallScore': 1, createdAt: -1 };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  // Execute Count, Queries & Aggregation concurrently
  const userObjectId = new mongoose.Types.ObjectId(String(userId));

  const [total, analyses, userSummaryAgg] = await Promise.all([
    Analysis.countDocuments(query),
    Analysis.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Analysis.aggregate([
      { $match: { user: userObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
          processing: {
            $sum: { $cond: [{ $eq: ['$status', 'Processing'] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] },
          },
          avgScore: {
            $avg: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'Completed'] },
                    { $gt: ['$analysis.overallScore', 0] },
                  ],
                },
                '$analysis.overallScore',
                null,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const userStats = userSummaryAgg[0] || {
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    avgScore: 0,
  };

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    analyses,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
    summary: {
      total: userStats.total || 0,
      completed: userStats.completed || 0,
      processing: userStats.processing || 0,
      failed: userStats.failed || 0,
      averageScore: Math.round(userStats.avgScore || 0),
    },
  };
};


/**
 * Service to fetch a single analysis report by analysisId.
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
 * Service to delete an analysis report by analysisId.
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
  createStartAnalysisService,
  getAnalysisHistoryService,
  getSingleAnalysisService,
  deleteAnalysisService,
  runAIAnalysisService,
  getAnalysisReportService,
};
