import axios from 'axios';
import Analysis from '../../../models/Analysis.js';
import ApiError from '../../../utils/ApiError.js';
import githubConfig from '../../../config/github.config.js';
import { parseGithubRepoInput } from '../../../utils/githubUrlParser.js';
import { executeAIAnalysis } from '../providers/aiProvider.factory.js';

/**
 * Generates structured prompt for repository AI evaluation.
 */
const buildRepositoryPrompt = (analysisDoc) => {
  const { repository, github, metadata } = analysisDoc;

  const repoName = repository?.fullName || `${repository?.owner}/${repository?.name}`;
  const description = repository?.description || 'No description provided.';
  const defaultBranch = repository?.defaultBranch || 'main';
  const visibility = repository?.visibility || 'public';

  const language = github?.language || 'Unknown';
  const stars = github?.stars || 0;
  const forks = github?.forks || 0;
  const watchers = github?.watchers || 0;
  const openIssues = github?.openIssues || 0;
  const topics = Array.isArray(github?.topics) && github.topics.length > 0
    ? github.topics.join(', ')
    : 'None';

  const languagesBreakdown = metadata?.languages
    ? JSON.stringify(metadata.languages)
    : '{}';

  const readmeContent = metadata?.readme?.exists && metadata?.readme?.content
    ? metadata.readme.content.slice(0, 3000)
    : 'No README file available.';

  const rootFiles = Array.isArray(metadata?.rootContents)
    ? metadata.rootContents.map((item) => `${item.type === 'dir' ? '[DIR]' : '[FILE]'} ${item.name}`).join('\n')
    : 'No root contents recorded.';

  return `
You are a Senior Software Architect and Technical Auditor. Perform an in-depth repository review for the following public project:

=== REPOSITORY OVERVIEW ===
Full Name: ${repoName}
Description: ${description}
Primary Language: ${language}
Visibility: ${visibility}
Default Branch: ${defaultBranch}
Topics: ${topics}
Stats: ${stars} Stars, ${forks} Forks, ${watchers} Watchers, ${openIssues} Open Issues

=== LANGUAGE BREAKDOWN ===
${languagesBreakdown}

=== ROOT DIRECTORY STRUCTURE ===
${rootFiles}

=== README DOCUMENTATION ===
"${readmeContent}"

=== INSTRUCTIONS ===
Evaluate the project and return a STRICT JSON object matching EXACTLY the following structure (no extra text, no markdown wrappers):

{
  "overallScore": 88,
  "techStack": ["List", "of", "detected", "technologies"],
  "architecture": {
    "score": 90,
    "review": "Detailed evaluation of directory layout and architectural patterns."
  },
  "codeQuality": {
    "score": 85,
    "review": "Assessment of maintainability, language standards, and conventions."
  },
  "documentation": {
    "score": 90,
    "review": "Evaluation of README quality, setup instructions, and documentation."
  },
  "security": {
    "score": 88,
    "review": "Analysis of potential security risks, sensitive data exposure, and advisories."
  },
  "performance": {
    "score": 86,
    "review": "Assessment of runtime efficiency and build optimizations."
  },
  "maintainability": {
    "score": 88,
    "review": "Evaluation of modularity and ease of maintenance."
  },
  "bestPractices": {
    "score": 89,
    "review": "Adherence to software engineering standards."
  },
  "strengths": [
    "Key strength point 1",
    "Key strength point 2",
    "Key strength point 3"
  ],
  "weaknesses": [
    "Area needing improvement 1",
    "Area needing improvement 2"
  ],
  "suggestions": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ],
  "summary": "Concise executive summary covering the project purpose, architecture, and overall readiness."
}
`;
};

/**
 * Service to execute Public Repository Analysis.
 *
 * @param {Object} params - Service parameters
 * @param {string} [params.repository] - Owner/repo or GitHub URL
 * @param {string} [params.url] - Alternative GitHub URL
 * @param {string} [params.userId] - Optional authenticated user ID
 * @param {string} [params.provider] - Optional AI provider
 * @returns {Promise<Object>} Complete Analysis document report
 */
export const publicAnalysisService = async ({ repository, url, userId, provider }) => {
  const rawInput = repository || url;
  if (!rawInput) {
    throw new ApiError(400, 'Either "repository" or "url" must be provided in request body');
  }

  // 1. Parse and validate GitHub URL / input
  const { owner, repo } = parseGithubRepoInput(rawInput);

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Aurex-App',
  };

  const baseUrl = `${githubConfig.apiBaseUrl}/repos/${owner}/${repo}`;

  // 2. Fetch public repository metadata from GitHub API
  let repoRes;
  try {
    repoRes = await axios.get(baseUrl, { headers, timeout: 15000 });
  } catch (err) {
    if (err.response?.status === 404) {
      throw new ApiError(404, `Repository "${owner}/${repo}" not found on GitHub`);
    }
    throw new ApiError(
      err.response?.status || 500,
      err.response?.data?.message || `Failed to fetch public repository "${owner}/${repo}" from GitHub`
    );
  }

  const repoData = repoRes.data;

  // 3. Reject private repositories
  if (repoData.private || repoData.visibility === 'private') {
    throw new ApiError(
      400,
      `Repository "${owner}/${repo}" is private. Public analysis is only available for public repositories.`
    );
  }

  // Concurrently fetch languages, README, and root contents
  const [languagesRes, readmeRes, contentsRes] = await Promise.all([
    axios.get(`${baseUrl}/languages`, { headers }).catch(() => ({ data: {} })),
    axios.get(`${baseUrl}/readme`, { headers }).catch(() => null),
    axios.get(`${baseUrl}/contents`, { headers }).catch(() => null),
  ]);

  const languages = languagesRes.data || {};

  let readmeData = { exists: false, content: null };
  if (readmeRes?.data?.content) {
    try {
      readmeData = {
        exists: true,
        content: Buffer.from(readmeRes.data.content, 'base64').toString('utf-8'),
      };
    } catch {
      readmeData = { exists: false, content: null };
    }
  }

  const rootContents = Array.isArray(contentsRes?.data)
    ? contentsRes.data.map((item) => ({
        name: item.name,
        type: item.type,
        path: item.path,
      }))
    : [];

  const mainLanguage = repoData.language || Object.keys(languages)[0] || 'Unknown';

  // 4. Create Analysis record in MongoDB
  const analysisDoc = await Analysis.create({
    user: userId || null,
    repository: {
      owner: repoData.owner?.login || owner,
      name: repoData.name || repo,
      fullName: repoData.full_name || `${owner}/${repo}`,
      htmlUrl: repoData.html_url || `https://github.com/${owner}/${repo}`,
      defaultBranch: repoData.default_branch || 'main',
      description: repoData.description || '',
      visibility: repoData.visibility || 'public',
    },
    github: {
      repoId: String(repoData.id || ''),
      language: mainLanguage,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      watchers: repoData.watchers_count || 0,
      openIssues: repoData.open_issues_count || 0,
      topics: Array.isArray(repoData.topics) ? repoData.topics : [],
    },
    metadata: {
      languages,
      readme: readmeData,
      rootContents,
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
      summary: 'Public repository data collected successfully. Executing AI Analysis...',
    },
    status: 'Processing',
  });

  // 5. Execute AI analysis using existing provider factory & prompt builder
  try {
    const prompt = buildRepositoryPrompt(analysisDoc);
    const selectedProvider = provider || process.env.AI_PROVIDER || 'gemini';
    const aiResponse = await executeAIAnalysis(prompt, selectedProvider);

    const overallScore = typeof aiResponse.overallScore === 'number'
      ? Math.min(100, Math.max(0, aiResponse.overallScore))
      : 0;

    analysisDoc.analysis = {
      overallScore,
      codeQuality: aiResponse.codeQuality?.score || 0,
      documentation: aiResponse.documentation?.score || 0,
      architecture: aiResponse.architecture?.score || 0,
      maintainability: aiResponse.maintainability?.score || 0,
      security: aiResponse.security?.score || 0,
      performance: aiResponse.performance?.score || 0,
      bestPractices: aiResponse.bestPractices?.score || 0,
      techStack: Array.isArray(aiResponse.techStack) ? aiResponse.techStack : [],
      architectureReview: aiResponse.architecture?.review || '',
      codeQualityReview: aiResponse.codeQuality?.review || '',
      documentationReview: aiResponse.documentation?.review || '',
      securityReview: aiResponse.security?.review || '',
      performanceReview: aiResponse.performance?.review || '',
      maintainabilityReview: aiResponse.maintainability?.review || '',
      bestPracticesReview: aiResponse.bestPractices?.review || '',
      strengths: Array.isArray(aiResponse.strengths) ? aiResponse.strengths : [],
      weaknesses: Array.isArray(aiResponse.weaknesses) ? aiResponse.weaknesses : [],
      suggestions: Array.isArray(aiResponse.suggestions) ? aiResponse.suggestions : [],
      summary: aiResponse.summary || 'Public repository AI analysis completed successfully.',
    };

    analysisDoc.status = 'Completed';
    analysisDoc.aiProvider = selectedProvider;

    await analysisDoc.save();
    return analysisDoc;
  } catch (error) {
    analysisDoc.status = 'Failed';
    await analysisDoc.save();

    if (error instanceof ApiError) throw error;
    throw new ApiError(500, `Public repository AI analysis failed: ${error.message}`);
  }
};

export default publicAnalysisService;
