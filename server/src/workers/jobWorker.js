import Job from '../models/Job.js';
import { repositoryDetailsService } from '../services/github/repositoryDetails.service.js';
import { repositoryAnalysisService } from '../services/github/repositoryAnalysis.service.js';
import { repositoryReviewService } from '../services/ai/repositoryReview.service.js';

/**
 * Worker function to process a specific analysis job asynchronously.
 *
 * @param {string} jobId - MongoDB Job ID
 */
export const processJob = async (jobId) => {
  const job = await Job.findById(jobId);

  if (!job) {
    console.error(`[Worker] Job ${jobId} not found.`);
    return;
  }

  if (job.status === 'COMPLETED' || job.status === 'FAILED') {
    return;
  }

  try {
    // 1. Mark as PROCESSING & increment attempts
    job.status = 'PROCESSING';
    job.attempts += 1;
    job.progress = 10;
    job.error = null;
    await job.save();

    const { owner, repo } = job.repository;
    const userId = job.user.toString();

    console.log(
      `[Worker] Processing Job ${job._id} for ${owner}/${repo} (Attempt ${job.attempts}/${job.maxAttempts})...`
    );

    // 2. Step 1: Fetch Repository Details (35%)
    const details = await repositoryDetailsService({ userId, owner, repo });
    job.progress = 35;
    await job.save();

    // 3. Step 2: Run Repository Health Analysis (65%)
    const analysis = await repositoryAnalysisService({ userId, owner, repo });
    job.progress = 65;
    await job.save();

    // 4. Step 3: Run AI Repository Review (90%)
    let aiReview = null;
    try {
      aiReview = await repositoryReviewService({ userId, owner, repo });
    } catch (aiErr) {
      console.warn(`[Worker] AI review notice for Job ${job._id}:`, aiErr.message);
      aiReview = { summary: 'AI Review unavailable or skipped.', verdict: 'Analysis completed.' };
    }

    job.progress = 90;
    await job.save();

    // 5. Complete Job (100%)
    job.status = 'COMPLETED';
    job.progress = 100;
    job.result = {
      repository: details.repository,
      languages: details.languages,
      contributors: details.contributors,
      readme: details.readme,
      analysis,
      aiReview,
    };
    job.error = null;
    await job.save();

    console.log(`[Worker] Successfully completed Job ${job._id} for ${owner}/${repo}`);
  } catch (error) {
    console.error(`[Worker] Error processing Job ${job._id}:`, error.message);

    if (job.attempts < job.maxAttempts) {
      // Re-queue for retry
      job.status = 'QUEUED';
      job.progress = 0;
      job.error = `Attempt ${job.attempts} failed: ${error.message}. Retrying...`;
      await job.save();

      // Schedule retry asynchronously after 3 seconds
      setTimeout(() => {
        processJob(job._id).catch((err) =>
          console.error(`[Worker Retry Error] ${err.message}`)
        );
      }, 3000);
    } else {
      // Exceeded max attempts, mark as FAILED
      job.status = 'FAILED';
      job.error = `Failed after ${job.attempts} attempts: ${error.message}`;
      await job.save();
    }
  }
};

/**
 * Worker poller to pick up stuck QUEUED jobs upon server startup.
 */
export const startWorkerPoller = async () => {
  try {
    const queuedJobs = await Job.find({ status: 'QUEUED' }).limit(5);
    for (const job of queuedJobs) {
      processJob(job._id).catch((err) =>
        console.error(`[Worker Poller Error] ${err.message}`)
      );
    }
  } catch (error) {
    console.error(`[Worker Poller Initializer Error] ${error.message}`);
  }
};

export default {
  processJob,
  startWorkerPoller,
};
