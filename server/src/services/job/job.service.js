import Job from '../../models/Job.js';
import ApiError from '../../utils/ApiError.js';
import { processJob } from '../../workers/jobWorker.js';

/**
 * Service to queue a new repository analysis background job.
 *
 * @param {Object} params - Service parameters
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @returns {Promise<Object>} Created job reference
 */
export const createAnalysisJobService = async ({ userId, owner, repo }) => {
  if (!userId) {
    throw new ApiError(401, 'User is not authenticated');
  }

  if (!owner || !repo) {
    throw new ApiError(400, 'Both owner and repo parameters are required');
  }

  // 1. Create Job document with status QUEUED
  const job = await Job.create({
    user: userId,
    repository: {
      owner: owner.trim(),
      repo: repo.trim(),
    },
    status: 'QUEUED',
    progress: 0,
  });

  // 2. Trigger worker asynchronously non-blocking
  setImmediate(() => {
    processJob(job._id).catch((err) =>
      console.error(`[Background Job Execution Error] ${err.message}`)
    );
  });

  return {
    jobId: job._id.toString(),
    status: job.status,
    repository: job.repository,
  };
};

/**
 * Service to get status and results of a specific job.
 *
 * @param {Object} params - Service parameters
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.jobId - Job ID
 * @returns {Promise<Object>} Job document
 */
export const getJobStatusService = async ({ userId, jobId }) => {
  if (!userId) {
    throw new ApiError(401, 'User is not authenticated');
  }

  const job = await Job.findOne({ _id: jobId, user: userId });

  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  return job;
};

/**
 * Service to list all background jobs for the authenticated user.
 *
 * @param {string} userId - Authenticated user ID
 * @returns {Promise<Array<Object>>} List of jobs
 */
export const getUserJobsService = async (userId) => {
  if (!userId) {
    throw new ApiError(401, 'User is not authenticated');
  }

  const jobs = await Job.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
  return jobs;
};

export default {
  createAnalysisJobService,
  getJobStatusService,
  getUserJobsService,
};
