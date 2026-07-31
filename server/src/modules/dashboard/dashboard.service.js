import mongoose from 'mongoose';
import Analysis from '../../models/Analysis.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Service to aggregate overview statistics for the authenticated user's dashboard.
 * Uses a single MongoDB aggregation pipeline with $facet to optimize performance.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated user's ID
 * @returns {Promise<Object>} Aggregated overview metrics
 */
export const getDashboardOverviewService = async (userId) => {
  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const overviewResult = await Analysis.aggregate([
    {
      $match: {
        user: userObjectId,
      },
    },
    {
      $facet: {
        totalStats: [
          {
            $group: {
              _id: null,
              totalAnalyses: { $sum: 1 },
              distinctRepos: {
                $addToSet: {
                  $ifNull: [
                    '$repository.fullName',
                    { $concat: ['$repository.owner', '/', '$repository.name'] },
                  ],
                },
              },
              publicAnalyses: {
                $sum: {
                  $cond: [
                    { $eq: [{ $toLower: { $ifNull: ['$repository.visibility', 'public'] } }, 'public'] },
                    1,
                    0,
                  ],
                },
              },
              privateAnalyses: {
                $sum: {
                  $cond: [
                    { $eq: [{ $toLower: '$repository.visibility' }, 'private'] },
                    1,
                    0,
                  ],
                },
              },
              completedAnalyses: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0],
                },
              },
              failedAnalyses: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0],
                },
              },
            },
          },
        ],
        completedStats: [
          {
            $match: { status: 'Completed' },
          },
          {
            $group: {
              _id: null,
              averageScore: { $avg: '$analysis.overallScore' },
              highestScore: { $max: '$analysis.overallScore' },
              lowestScore: { $min: '$analysis.overallScore' },
            },
          },
        ],
      },
    },
  ]);

  const totalStats = overviewResult[0]?.totalStats[0] || {};
  const completedStats = overviewResult[0]?.completedStats[0] || {};

  const totalAnalyses = totalStats.totalAnalyses || 0;
  const publicAnalyses = totalStats.publicAnalyses || 0;
  const privateAnalyses = totalStats.privateAnalyses || 0;
  const completedAnalyses = totalStats.completedAnalyses || 0;
  const failedAnalyses = totalStats.failedAnalyses || 0;
  const repositoriesAnalysed = totalStats.distinctRepos ? totalStats.distinctRepos.filter(Boolean).length : 0;

  const averageScore =
    completedStats.averageScore != null
      ? Math.round(completedStats.averageScore * 100) / 100
      : 0;
  const highestScore = completedStats.highestScore ?? 0;
  const lowestScore = completedStats.lowestScore ?? 0;

  return {
    totalAnalyses,
    averageScore,
    highestScore,
    lowestScore,
    repositoriesAnalysed,
    publicAnalyses,
    privateAnalyses,
    completedAnalyses,
    failedAnalyses,
  };
};

/**
 * Service to fetch the most recent analyses for the authenticated user.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated user's ID
 * @param {number} limit - Maximum number of analyses to return (default: 10)
 * @returns {Promise<Array>} List of recent analysis records
 */
export const getRecentAnalysesService = async (userId, limit = 10) => {
  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const parsedLimit = Math.max(1, parseInt(limit, 10) || 10);

  const recentAnalyses = await Analysis.aggregate([
    {
      $match: { user: userObjectId },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: parsedLimit,
    },
    {
      $project: {
        _id: 1,
        repositoryName: '$repository.name',
        owner: '$repository.owner',
        fullName: '$repository.fullName',
        overallScore: '$analysis.overallScore',
        status: 1,
        createdAt: 1,
      },
    },
  ]);

  return recentAnalyses;
};

/**
 * Service to aggregate programming language statistics for the user's analyzed repositories.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated user's ID
 * @returns {Promise<Array>} List of languages with repo count and average AI score
 */
export const getLanguageStatsService = async (userId) => {
  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const languageStats = await Analysis.aggregate([
    {
      $match: {
        user: userObjectId,
        'github.language': { $exists: true, $ne: null, $ne: '' },
      },
    },
    {
      $group: {
        _id: '$github.language',
        repositorySet: {
          $addToSet: {
            $ifNull: [
              '$repository.fullName',
              { $concat: ['$repository.owner', '/', '$repository.name'] },
            ],
          },
        },
        analysisCount: { $sum: 1 },
        averageScore: {
          $avg: {
            $cond: [{ $eq: ['$status', 'Completed'] }, '$analysis.overallScore', null],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        language: '$_id',
        repositoryCount: { $size: '$repositorySet' },
        analysisCount: 1,
        averageScore: {
          $cond: [
            { $eq: ['$averageScore', null] },
            0,
            { $round: ['$averageScore', 2] },
          ],
        },
      },
    },
    {
      $sort: { repositoryCount: -1, analysisCount: -1, averageScore: -1 },
    },
  ]);

  return languageStats;
};

/**
 * Service to aggregate user's analysis count and average score trends grouped by period.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated user's ID
 * @param {string} period - Grouping period: 'day', 'week', or 'month' (default: 'day')
 * @returns {Promise<Object>} Object containing period and list of trend data points
 */
export const getDashboardTrendsService = async (userId, period = 'day') => {
  if (!userId) {
    throw new ApiError(400, 'User ID is required');
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  let dateFormat = '%Y-%m-%d';
  const normalizedPeriod = (period || 'day').toLowerCase();

  if (normalizedPeriod === 'week') {
    dateFormat = '%G-W%V';
  } else if (normalizedPeriod === 'month') {
    dateFormat = '%Y-%m';
  }

  const trends = await Analysis.aggregate([
    {
      $match: {
        user: userObjectId,
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: dateFormat,
            date: '$createdAt',
          },
        },
        totalAnalyses: { $sum: 1 },
        completedAnalyses: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
        },
        failedAnalyses: {
          $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] },
        },
        averageScore: {
          $avg: {
            $cond: [{ $eq: ['$status', 'Completed'] }, '$analysis.overallScore', null],
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        totalAnalyses: 1,
        completedAnalyses: 1,
        failedAnalyses: 1,
        averageScore: {
          $cond: [
            { $eq: ['$averageScore', null] },
            0,
            { $round: ['$averageScore', 2] },
          ],
        },
      },
    },
  ]);

  return {
    period: normalizedPeriod,
    trends,
  };
};

export default {
  getDashboardOverviewService,
  getRecentAnalysesService,
  getLanguageStatsService,
  getDashboardTrendsService,
};
