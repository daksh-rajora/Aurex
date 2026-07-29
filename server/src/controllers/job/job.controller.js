import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import {
  createAnalysisJobService,
  getJobStatusService,
  getUserJobsService,
} from '../../services/job/job.service.js';

/**
 * Controller to queue a new background repository analysis job.
 */
export const createAnalysisJob = asyncHandler(async (req, res) => {
  const { owner, repo } = req.body || {};
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!owner || !repo) {
    throw new ApiError(400, 'Owner and repo parameters are required in request body');
  }

  const result = await createAnalysisJobService({
    userId,
    owner,
    repo,
  });

  return res.status(202).json({
    statusCode: 202,
    success: true,
    message: 'Repository analysis job queued successfully',
    jobId: result.jobId,
    data: result,
  });
});

/**
 * Controller to get status and results of a specific job by jobId.
 */
export const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!jobId) {
    throw new ApiError(400, 'jobId parameter is required');
  }

  const job = await getJobStatusService({ userId, jobId });

  return res
    .status(200)
    .json(new ApiResponse(200, job, 'Job status retrieved successfully'));
});

/**
 * Controller to list all background jobs for the authenticated user.
 */
export const getUserJobs = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const jobs = await getUserJobsService(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, jobs, 'User jobs retrieved successfully'));
});

export default {
  createAnalysisJob,
  getJobStatus,
  getUserJobs,
};
