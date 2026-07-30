import Analysis from '../../../models/Analysis.js';
import ApiError from '../../../utils/ApiError.js';
import { executeAIAnalysis } from '../providers/aiProvider.factory.js';

/**
 * Generates a structured AI prompt using repository metadata stored in MongoDB.
 *
 * @param {Object} analysisDoc - MongoDB Analysis document
 * @returns {string} Formatted prompt string for AI provider
 */
const buildRepositoryAnalysisPrompt = (analysisDoc) => {
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
You are a Senior Software Architect and Technical Auditor. Perform an in-depth repository review based on the following metadata:

=== REPOSITORY OVERVIEW ===
Full Name: ${repoName}
Description: ${description}
Primary Language: ${language}
Visibility: ${visibility}
Default Branch: ${defaultBranch}
Topics: ${topics}
Stats: ${stars} Stars, ${forks} Forks, ${watchers} Watchers, ${openIssues} Open Issues

=== LANGUAGE BREAKDOWN (Bytes) ===
${languagesBreakdown}

=== ROOT DIRECTORY STRUCTURE ===
${rootFiles}

=== README DOCUMENTATION (Snippet) ===
"${readmeContent}"

=== INSTRUCTIONS ===
Evaluate the project and return a STRICT JSON object matching EXACTLY the following structure (no extra text, no markdown wrappers):

{
  "overallScore": 85,
  "techStack": ["List", "of", "detected", "technologies"],
  "architecture": {
    "score": 85,
    "review": "Detailed assessment of directory structure and project layout."
  },
  "codeQuality": {
    "score": 80,
    "review": "Assessment of maintainability, language standards, and conventions."
  },
  "documentation": {
    "score": 90,
    "review": "Evaluation of README quality, setup instructions, and clarity."
  },
  "security": {
    "score": 88,
    "review": "Analysis of potential security risks, sensitive file exposure, and safety."
  },
  "performance": {
    "score": 82,
    "review": "Assessment of technology efficiency and build setup."
  },
  "maintainability": {
    "score": 85,
    "review": "Evaluation of modularity and ease of future maintenance."
  },
  "bestPractices": {
    "score": 87,
    "review": "Adherence to industry software engineering best practices."
  },
  "strengths": [
    "Key strength point 1",
    "Key strength point 2",
    "Key strength point 3"
  ],
  "weaknesses": [
    "Area for improvement 1",
    "Area for improvement 2"
  ],
  "suggestions": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ],
  "summary": "Concise executive summary covering the overall health and readiness of the repository."
}
`;
};

/**
 * Service to execute AI analysis on an existing Analysis document.
 *
 * @param {Object} params - Service parameters
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.analysisId - MongoDB Analysis document ID
 * @param {string} [params.provider] - Optional AI provider ('openai' | 'gemini' | 'claude')
 * @returns {Promise<Object>} Updated Analysis document with AI results
 */
export const runAIAnalysisService = async ({ userId, analysisId, provider }) => {
  // 1 & 2. Authenticate user & Fetch Analysis document
  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  const analysisDoc = await Analysis.findById(analysisId);
  if (!analysisDoc) {
    throw new ApiError(404, 'Analysis report not found');
  }

  // 3. Verify ownership
  if (analysisDoc.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized access to analysis report');
  }

  // Mark status as Processing while running AI
  analysisDoc.status = 'Processing';
  await analysisDoc.save();

  try {
    // 4 & 5. Collect stored repository data & Generate structured prompt
    const prompt = buildRepositoryAnalysisPrompt(analysisDoc);

    // 6 & 7. Send prompt to AI provider & receive AI response
    const selectedProvider = provider || process.env.AI_PROVIDER || 'openai';
    const aiResponse = await executeAIAnalysis(prompt, selectedProvider);

    // 8. Update Analysis document with structured AI analysis results
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
      summary: aiResponse.summary || 'AI Analysis completed successfully.',
    };

    analysisDoc.status = 'Completed';
    analysisDoc.aiProvider = selectedProvider;

    await analysisDoc.save();
    return analysisDoc;
  } catch (error) {
    // Update status to Failed if AI request fails
    analysisDoc.status = 'Failed';
    await analysisDoc.save();

    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `AI Analysis execution failed: ${error.message}`);
  }
};

/**
 * Service to fetch complete AI analysis report for an authenticated user.
 *
 * @param {Object} params - Service parameters
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.analysisId - MongoDB Analysis document ID
 * @returns {Promise<Object>} Full Analysis document report
 */
export const getAnalysisReportService = async ({ userId, analysisId }) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  const analysisDoc = await Analysis.findById(analysisId);
  if (!analysisDoc) {
    throw new ApiError(404, 'Analysis report not found');
  }

  if (analysisDoc.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized access to analysis report');
  }

  return analysisDoc;
};

export default {
  runAIAnalysisService,
  getAnalysisReportService,
};
