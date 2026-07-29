import ApiError from '../../utils/ApiError.js';
import { repositoryDetailsService } from './repositoryDetails.service.js';

/**
 * Deterministic calculation of Documentation Score (0-100)
 */
const calculateDocumentationScore = (repoData, readme) => {
  let score = 0;
  const summaryPoints = [];

  if (repoData.description && repoData.description.trim().length > 0) {
    score += 15;
    summaryPoints.push('Has repository description');
  }

  if (readme && readme.exists && readme.content) {
    score += 40;
    const len = readme.content.length;

    if (len >= 1500) {
      score += 25;
      summaryPoints.push('Extensive README documentation');
    } else if (len >= 500) {
      score += 15;
      summaryPoints.push('Standard README documentation');
    } else {
      score += 5;
      summaryPoints.push('Basic README documentation');
    }

    const lowerContent = readme.content.toLowerCase();
    const commonSections = ['install', 'usage', 'license', 'feature', 'getting started', 'api'];
    const matchedSections = commonSections.filter((sec) => lowerContent.includes(sec));

    if (matchedSections.length >= 3) {
      score += 20;
      summaryPoints.push('Contains key setup and usage sections');
    } else if (matchedSections.length >= 1) {
      score += 10;
    }
  } else {
    summaryPoints.push('Missing README file');
  }

  score = Math.min(100, Math.max(0, score));
  return {
    score,
    summary: summaryPoints.join('. ') || 'Documentation needs improvement.',
  };
};

/**
 * Deterministic calculation of Activity Score (0-100)
 */
const calculateActivityScore = (repoData, contributors) => {
  let score = 0;
  const summaryPoints = [];

  const lastPush = repoData.pushed_at ? new Date(repoData.pushed_at) : null;
  if (lastPush) {
    const daysSincePush = Math.floor((new Date() - lastPush) / (1000 * 60 * 60 * 24));
    if (daysSincePush <= 14) {
      score += 50;
      summaryPoints.push('Active commits within the last 2 weeks');
    } else if (daysSincePush <= 60) {
      score += 35;
      summaryPoints.push('Active commits within the last 2 months');
    } else if (daysSincePush <= 180) {
      score += 20;
      summaryPoints.push('Commits within the last 6 months');
    } else {
      score += 5;
      summaryPoints.push('Inactive for over 6 months');
    }
  }

  const contributorCount = Array.isArray(contributors) ? contributors.length : 0;
  if (contributorCount >= 10) {
    score += 35;
    summaryPoints.push('Large active contributor community');
  } else if (contributorCount >= 3) {
    score += 25;
    summaryPoints.push('Multiple active contributors');
  } else if (contributorCount >= 1) {
    score += 15;
    summaryPoints.push('Single contributor codebase');
  }

  if (repoData.open_issues_count === 0) {
    score += 15;
    summaryPoints.push('Zero pending open issues');
  } else if (repoData.open_issues_count <= 10) {
    score += 10;
  }

  score = Math.min(100, Math.max(0, score));
  return {
    score,
    summary: summaryPoints.join('. ') || 'Low repository activity.',
  };
};

/**
 * Deterministic calculation of Maintenance Score (0-100)
 */
const calculateMaintenanceScore = (repoData) => {
  let score = 0;
  const summaryPoints = [];

  if (!repoData.archived) {
    score += 30;
    summaryPoints.push('Active, non-archived repository');
  } else {
    summaryPoints.push('Archived repository');
  }

  if (repoData.license && repoData.license.key) {
    score += 30;
    summaryPoints.push(`Open source license (${repoData.license.spdx_id || repoData.license.name})`);
  } else {
    summaryPoints.push('No license declared');
  }

  if (['main', 'master'].includes(repoData.default_branch)) {
    score += 20;
    summaryPoints.push(`Standard default branch (${repoData.default_branch})`);
  }

  if (repoData.has_issues && repoData.has_wiki) {
    score += 20;
    summaryPoints.push('Issues and Wiki enabled');
  } else if (repoData.has_issues) {
    score += 10;
  }

  score = Math.min(100, Math.max(0, score));
  return {
    score,
    summary: summaryPoints.join('. ') || 'Maintenance health check passed.',
  };
};

/**
 * Deterministic calculation of Popularity Score (0-100)
 */
const calculatePopularityScore = (repoData) => {
  let score = 0;
  const summaryPoints = [];

  const stars = repoData.stargazers_count || 0;
  const forks = repoData.forks_count || 0;
  const watchers = repoData.watchers_count || 0;

  if (stars >= 100) score += 45;
  else if (stars >= 25) score += 35;
  else if (stars >= 5) score += 20;
  else if (stars > 0) score += 10;

  if (forks >= 50) score += 35;
  else if (forks >= 10) score += 25;
  else if (forks >= 1) score += 15;

  if (watchers >= 20) score += 20;
  else if (watchers >= 1) score += 10;

  if (stars === 0 && forks === 0) {
    summaryPoints.push('Early-stage project with low engagement');
  } else {
    summaryPoints.push(`${stars} stars, ${forks} forks, and ${watchers} watchers`);
  }

  score = Math.min(100, Math.max(0, score));
  return {
    score,
    summary: summaryPoints.join('. '),
  };
};

/**
 * Service to analyze repository health and generate structured report.
 *
 * @param {Object} params - Service parameters
 * @param {string} params.userId - Aurex user ID (_id)
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @returns {Promise<Object>} Structured repository analysis report
 */
export const repositoryAnalysisService = async ({ userId, owner, repo }) => {
  // 1. Fetch complete repository details
  const details = await repositoryDetailsService({ userId, owner, repo });

  const { repository: repoData, contributors, readme } = details;

  // 2. Calculate category scores
  const documentation = calculateDocumentationScore(repoData, readme);
  const activity = calculateActivityScore(repoData, contributors);
  const maintenance = calculateMaintenanceScore(repoData);
  const popularity = calculatePopularityScore(repoData);

  // 3. Calculate weighted overall score
  const overallScore = Math.round(
    documentation.score * 0.3 +
    activity.score * 0.3 +
    maintenance.score * 0.2 +
    popularity.score * 0.2
  );

  // 4. Derive Strengths, Weaknesses, and Recommendations
  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (documentation.score >= 75) {
    strengths.push('Well-documented repository with a comprehensive README');
  } else {
    weaknesses.push('Documentation is sparse or missing key setup instructions');
    recommendations.push('Enhance README with installation, usage examples, and architecture overview');
  }

  if (activity.score >= 70) {
    strengths.push('Active commit history and healthy developer contributions');
  } else {
    weaknesses.push('Infrequent commit activity or single contributor dependency');
    recommendations.push('Maintain regular commits and encourage open-source contributions');
  }

  if (repoData.license && repoData.license.key) {
    strengths.push(`Clear open-source license (${repoData.license.spdx_id || repoData.license.name})`);
  } else {
    weaknesses.push('No open-source license provided');
    recommendations.push('Add an explicit LICENSE file (e.g. MIT, Apache 2.0)');
  }

  if (repoData.stargazers_count > 10) {
    strengths.push(`Community interest with ${repoData.stargazers_count} stars`);
  }

  if (repoData.archived) {
    weaknesses.push('Repository is archived and read-only');
  }

  return {
    overallScore,
    documentation,
    activity,
    maintenance,
    popularity,
    strengths,
    weaknesses,
    recommendations,
  };
};

export default repositoryAnalysisService;
