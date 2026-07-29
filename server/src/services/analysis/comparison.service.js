import ApiError from '../../utils/ApiError.js';
import { repositoryDetailsService } from '../github/repositoryDetails.service.js';
import { repositoryAnalysisService } from '../github/repositoryAnalysis.service.js';

/**
 * Service to compare two GitHub repositories using Aurex's analysis engine.
 *
 * @param {Object} params - Parameters object
 * @param {string} params.userId - Authenticated user ID
 * @param {Object} params.repositoryOne - First repo object { owner, repo }
 * @param {Object} params.repositoryTwo - Second repo object { owner, repo }
 * @returns {Promise<Object>} Structured comparison report
 */
export const compareRepositoriesService = async ({ userId, repositoryOne, repositoryTwo }) => {
  if (!userId) {
    throw new ApiError(401, 'User is not authenticated');
  }

  if (!repositoryOne?.owner || !repositoryOne?.repo) {
    throw new ApiError(400, 'repositoryOne owner and repo are required');
  }

  if (!repositoryTwo?.owner || !repositoryTwo?.repo) {
    throw new ApiError(400, 'repositoryTwo owner and repo are required');
  }

  // Concurrently fetch details and analysis for both repositories
  const [repo1Details, repo1Analysis, repo2Details, repo2Analysis] = await Promise.all([
    repositoryDetailsService({ userId, owner: repositoryOne.owner, repo: repositoryOne.repo }),
    repositoryAnalysisService({ userId, owner: repositoryOne.owner, repo: repositoryOne.repo }),
    repositoryDetailsService({ userId, owner: repositoryTwo.owner, repo: repositoryTwo.repo }),
    repositoryAnalysisService({ userId, owner: repositoryTwo.owner, repo: repositoryTwo.repo }),
  ]);

  const score1 = repo1Analysis.overallScore;
  const score2 = repo2Analysis.overallScore;

  let winner = 'Tie';
  if (score1 > score2) {
    winner = `${repositoryOne.owner}/${repositoryOne.repo}`;
  } else if (score2 > score1) {
    winner = `${repositoryTwo.owner}/${repositoryTwo.repo}`;
  }

  const scoreDifference = Math.abs(score1 - score2);

  const getSubWinner = (val1, val2) => {
    if (val1 > val2) return `${repositoryOne.owner}/${repositoryOne.repo}`;
    if (val2 > val1) return `${repositoryTwo.owner}/${repositoryTwo.repo}`;
    return 'Tie';
  };

  const documentationWinner = getSubWinner(
    repo1Analysis.documentation?.score || 0,
    repo2Analysis.documentation?.score || 0
  );

  const activityWinner = getSubWinner(
    repo1Analysis.activity?.score || 0,
    repo2Analysis.activity?.score || 0
  );

  const maintenanceWinner = getSubWinner(
    repo1Analysis.maintenance?.score || 0,
    repo2Analysis.maintenance?.score || 0
  );

  const popularityWinner = getSubWinner(
    repo1Analysis.popularity?.score || 0,
    repo2Analysis.popularity?.score || 0
  );

  const recommendations = [];
  if (winner !== 'Tie') {
    recommendations.push(
      `Consider adopting practices from ${winner}, which achieved a higher overall health score.`
    );
  }

  if (documentationWinner !== 'Tie') {
    recommendations.push(
      `${documentationWinner} exhibits superior documentation completeness and README quality.`
    );
  }

  const summary =
    winner === 'Tie'
      ? `${repositoryOne.owner}/${repositoryOne.repo} and ${repositoryTwo.owner}/${repositoryTwo.repo} achieved an identical overall score of ${score1}/100.`
      : `${winner} outperforms with an overall score of ${Math.max(score1, score2)}/100 (+${scoreDifference} points).`;

  return {
    repositoryOne: {
      owner: repositoryOne.owner,
      repo: repositoryOne.repo,
      details: repo1Details,
      analysis: repo1Analysis,
    },
    repositoryTwo: {
      owner: repositoryTwo.owner,
      repo: repositoryTwo.repo,
      details: repo2Details,
      analysis: repo2Analysis,
    },
    comparison: {
      winner,
      scoreDifference,
      documentationWinner,
      activityWinner,
      maintenanceWinner,
      popularityWinner,
      summary,
      recommendations,
    },
  };
};

export default compareRepositoriesService;
