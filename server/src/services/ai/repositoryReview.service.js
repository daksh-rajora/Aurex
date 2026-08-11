import ApiError from '../../utils/ApiError.js';
import { repositoryDetailsService } from '../github/repositoryDetails.service.js';
import { repositoryAnalysisService } from '../github/repositoryAnalysis.service.js';
import { generateAIReview } from './aiProvider.js';

/**
 * Service to orchestrate fetching repository data, running analysis, and generating an AI review.
 *
 * @param {Object} params - Service parameters
 * @param {string} params.userId - Aurex user ID
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @returns {Promise<Object>} AI-generated repository review object
 */
export const repositoryReviewService = async ({ userId, owner, repo }) => {
  if (!userId) {
    throw new ApiError(401, 'User is not authenticated');
  }

  if (!owner || !repo) {
    throw new ApiError(400, 'Both owner and repo parameters are required');
  }

  // 1. Concurrently fetch repository details and static analysis metrics
  const [details, analysis] = await Promise.all([
    repositoryDetailsService({ userId, owner, repo }),
    repositoryAnalysisService({ userId, owner, repo }),
  ]);

  const { repository, languages, contributors, readme } = details;

  // 2. Build structured prompt for LLM
  const prompt = `
Perform a thorough, senior-level code & repository audit for the following GitHub project:

Repository: ${repository.full_name || `${owner}/${repo}`}
Description: ${repository.description || 'No description provided'}
Primary Language: ${repository.language || 'Unknown'}
Languages Used: ${JSON.stringify(languages)}
Stars: ${repository.stargazers_count || 0}, Forks: ${repository.forks_count || 0}, Open Issues: ${repository.open_issues_count || 0}
Contributors Count: ${contributors.length || 0}
Static Analysis Overall Score: ${analysis.overallScore}/100
Documentation Score: ${analysis.documentation?.score}/100
Activity Score: ${analysis.activity?.score}/100
Maintenance Score: ${analysis.maintenance?.score}/100
Popularity Score: ${analysis.popularity?.score}/100

README Snippet:
"${readme.exists && readme.content ? readme.content.slice(0, 2000) : 'No README file found'}"

Respond ONLY with a JSON object containing the following exact keys:
{
  "summary": "Brief 2-3 sentence overview of the project architecture and purpose",
  "strengths": ["Array of top 3 architectural/code strengths"],
  "weaknesses": ["Array of top 3 areas needing improvement"],
  "security": ["Array of security recommendations"],
  "performance": ["Array of performance optimization suggestions"],
  "maintainability": ["Array of maintainability recommendations"],
  "documentation": ["Array of documentation improvements"],
  "beginnerFriendliness": "Evaluation of how easy it is for new contributors to onboard",
  "verdict": "Final concise verdict on repository health and production readiness"
}
`;

  // 3. Generate review using configured AI Provider (OpenAI or OpenRouter)
  const aiReview = await generateAIReview(prompt);

  // 4. Sanitize and format response object
  return {
    summary: aiReview.summary || 'Repository review completed.',
    strengths: Array.isArray(aiReview.strengths) ? aiReview.strengths : [],
    weaknesses: Array.isArray(aiReview.weaknesses) ? aiReview.weaknesses : [],
    security: Array.isArray(aiReview.security) ? aiReview.security : [],
    performance: Array.isArray(aiReview.performance) ? aiReview.performance : [],
    maintainability: Array.isArray(aiReview.maintainability) ? aiReview.maintainability : [],
    documentation: Array.isArray(aiReview.documentation) ? aiReview.documentation : [],
    beginnerFriendliness: aiReview.beginnerFriendliness || 'Moderate onboarding effort required.',
    verdict: aiReview.verdict || 'Repository meets standard open-source criteria.',
  };
};

export default repositoryReviewService;
