import axios from 'axios';
import Analysis from '../../../models/Analysis.js';
import ApiError from '../../../utils/ApiError.js';
import githubConfig from '../../../config/github.config.js';
import { parseGithubRepoInput } from '../../../utils/githubUrlParser.js';
import { executeAIAnalysis } from '../providers/aiProvider.factory.js';
import { emitAnalysisProgress } from '../../../socket.js';

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
export const publicAnalysisService = async ({ githubUrl, repository, url, userId, provider }) => {
  const rawInput = githubUrl || repository || url;
  if (!rawInput) {
    throw new ApiError(400, 'Please enter a valid public GitHub repository URL.');
  }

  // 1. Parse and validate GitHub URL / input
  const { owner, repo } = parseGithubRepoInput(rawInput);
  const fullNameLower = `${owner.toLowerCase()}/${repo.toLowerCase()}`;

  // 2. Duplicate Analysis Check (Requirement 13)
  // Check if an analysis for this repository is currently Processing or was recently Completed
  const existingProcessingDoc = await Analysis.findOne({
    'repository.fullName': { $regex: new RegExp(`^${owner}/${repo}$`, 'i') },
    status: 'Processing',
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  });

  if (existingProcessingDoc) {
    console.log(`[Public Pipeline] Reusing active processing job: ${existingProcessingDoc._id}`);
    return {
      analysisId: String(existingProcessingDoc._id),
      repository: {
        owner: existingProcessingDoc.repository?.owner || owner,
        name: existingProcessingDoc.repository?.name || repo,
        fullName: existingProcessingDoc.repository?.fullName || `${owner}/${repo}`,
      },
    };
  }

  const existingCompletedDoc = await Analysis.findOne({
    'repository.fullName': { $regex: new RegExp(`^${owner}/${repo}$`, 'i') },
    status: 'Completed',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }).sort({ createdAt: -1 });

  if (existingCompletedDoc) {
    console.log(`[Public Pipeline] Reusing recent completed analysis: ${existingCompletedDoc._id}`);
    return {
      analysisId: String(existingCompletedDoc._id),
      repository: {
        owner: existingCompletedDoc.repository?.owner || owner,
        name: existingCompletedDoc.repository?.name || repo,
        fullName: existingCompletedDoc.repository?.fullName || `${owner}/${repo}`,
      },
    };
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Aurex-App',
  };

  const baseUrl = `${githubConfig.apiBaseUrl}/repos/${owner}/${repo}`;

  // 3. Fetch public repository metadata from GitHub API to verify existence and visibility
  let repoRes;
  try {
    repoRes = await axios.get(baseUrl, { headers, timeout: 15000 });
  } catch (err) {
    if (err.response?.status === 404) {
      throw new ApiError(404, 'Repository not found.');
    }
    if (err.response?.status === 403 && err.response?.headers?.['x-ratelimit-remaining'] === '0') {
      throw new ApiError(429, 'GitHub API rate limit reached. Please try again later.');
    }
    throw new ApiError(
      err.response?.status || 500,
      err.response?.data?.message || 'Unable to analyze this repository right now.'
    );
  }

  const repoData = repoRes.data;

  // 4. Reject private repositories
  if (repoData.private || repoData.visibility === 'private') {
    throw new ApiError(
      400,
      'This repository is private. Only public repositories can be analyzed.'
    );
  }

  const mainLanguage = repoData.language || 'Unknown';
  const repoOwner = repoData.owner?.login || owner;
  const repoName = repoData.name || repo;
  const repoFullName = repoData.full_name || `${repoOwner}/${repoName}`;

  // 5. Create Analysis record in MongoDB with status "Processing" immediately
  const analysisDoc = await Analysis.create({
    user: userId || null,
    repository: {
      owner: repoOwner,
      name: repoName,
      fullName: repoFullName,
      htmlUrl: repoData.html_url || `https://github.com/${repoFullName}`,
      defaultBranch: repoData.default_branch || 'main',
      description: repoData.description || '',
      visibility: 'public',
      license: repoData.license?.name || 'MIT',
      size: repoData.size ? `${Math.round(((repoData.size || 1024) / 1024) * 10) / 10} MB` : '1.0 MB',
    },
    github: {
      repoId: String(repoData.id || ''),
      htmlUrl: repoData.html_url || `https://github.com/${repoFullName}`,
      language: mainLanguage,
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      watchers: repoData.watchers_count || 0,
      openIssues: repoData.open_issues_count || 0,
      topics: Array.isArray(repoData.topics) ? repoData.topics : [],
    },
    metadata: {
      languages: {},
      readme: { exists: false, content: null },
      rootContents: [],
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
    aiProvider: 'OpenRouter',
  });

  const analysisId = String(analysisDoc._id);

  // 6. Execute background pipeline asynchronously (non-blocking)
  const runPipelineAsync = async () => {
    try {
      // 10% Connecting to GitHub
      emitAnalysisProgress({ analysisId, percentage: 10, stage: 'Connecting to GitHub' });
      await new Promise((r) => setTimeout(r, 150));

      // 20% Fetching Repository Metadata
      emitAnalysisProgress({ analysisId, percentage: 20, stage: 'Fetching Repository Metadata' });
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

      // 30% Reading Repository Structure
      emitAnalysisProgress({ analysisId, percentage: 30, stage: 'Reading Repository Structure' });
      await new Promise((r) => setTimeout(r, 150));

      // 45% Detecting Languages
      emitAnalysisProgress({ analysisId, percentage: 45, stage: 'Detecting Languages' });
      analysisDoc.metadata = {
        languages,
        readme: readmeData,
        rootContents,
      };
      if (repoData.language || Object.keys(languages)[0]) {
        analysisDoc.github.language = repoData.language || Object.keys(languages)[0];
      }
      await analysisDoc.save();
      await new Promise((r) => setTimeout(r, 150));

      // 60% Running AI Analysis
      emitAnalysisProgress({ analysisId, percentage: 60, stage: 'Running AI Analysis' });

      const prompt = buildRepositoryPrompt(analysisDoc);
      const selectedProvider = provider || process.env.AI_PROVIDER || 'openrouter';
      const aiResponse = await executeAIAnalysis(prompt, selectedProvider);

      // 75% Generating Security Analysis
      emitAnalysisProgress({ analysisId, percentage: 75, stage: 'Generating Security Analysis' });
      await new Promise((r) => setTimeout(r, 150));

      // 90% Generating Recommendations
      emitAnalysisProgress({ analysisId, percentage: 90, stage: 'Generating Recommendations' });
      await new Promise((r) => setTimeout(r, 150));

      const overallScore = typeof aiResponse.overallScore === 'number'
        ? Math.min(100, Math.max(0, aiResponse.overallScore))
        : 0;

      analysisDoc.analysis = {
        overallScore,
        codeQuality: aiResponse.codeQuality?.score || aiResponse.codeQuality || 0,
        documentation: aiResponse.documentation?.score || aiResponse.documentation || 0,
        architecture: aiResponse.architecture?.score || aiResponse.architecture || 0,
        maintainability: aiResponse.maintainability?.score || aiResponse.maintainability || 0,
        security: aiResponse.security?.score || aiResponse.security || 0,
        performance: aiResponse.performance?.score || aiResponse.performance || 0,
        bestPractices: aiResponse.bestPractices?.score || aiResponse.bestPractices || 0,
        techStack: Array.isArray(aiResponse.techStack) ? aiResponse.techStack : Array.isArray(aiResponse.technologyStack) ? aiResponse.technologyStack : [],
        architectureReview: aiResponse.architectureReview || aiResponse.architecture?.review || '',
        codeQualityReview: aiResponse.codeQualityReview || aiResponse.codeQuality?.review || '',
        documentationReview: aiResponse.documentationReview || aiResponse.documentation?.review || '',
        securityReview: aiResponse.securityReview || aiResponse.security?.review || '',
        performanceReview: aiResponse.performanceReview || aiResponse.performance?.review || '',
        maintainabilityReview: aiResponse.maintainabilityReview || aiResponse.maintainability?.review || '',
        bestPracticesReview: aiResponse.bestPracticesReview || aiResponse.bestPractices?.review || '',
        strengths: Array.isArray(aiResponse.strengths) ? aiResponse.strengths : [],
        weaknesses: Array.isArray(aiResponse.weaknesses) ? aiResponse.weaknesses : [],
        suggestions: Array.isArray(aiResponse.suggestions) ? aiResponse.suggestions : Array.isArray(aiResponse.recommendations) ? aiResponse.recommendations : [],
        recommendations: Array.isArray(aiResponse.recommendations) ? aiResponse.recommendations : [],
        summary: aiResponse.summary || 'Public repository AI analysis completed successfully.',
      };

      // 95% Saving Analysis
      emitAnalysisProgress({ analysisId, percentage: 95, stage: 'Saving Analysis' });

      analysisDoc.status = 'Completed';
      analysisDoc.aiProvider = selectedProvider;
      analysisDoc.completedAt = new Date();

      await analysisDoc.save();

      // 100% Analysis Completed
      emitAnalysisProgress({ analysisId, percentage: 100, stage: 'Analysis Completed', status: 'Completed' });
    } catch (error) {
      console.error(`[Public Pipeline Error] ${error.message}`);
      analysisDoc.status = 'Failed';
      analysisDoc.errorMessage = error.message;
      await analysisDoc.save();

      emitAnalysisProgress({
        analysisId,
        percentage: 0,
        stage: 'Analysis failed',
        status: 'Failed',
        error: error.message,
      });
    }
  };

  runPipelineAsync();

  return {
    analysisId,
    repository: {
      owner: repoOwner,
      name: repoName,
      fullName: repoFullName,
    },
  };
};

export default publicAnalysisService;

