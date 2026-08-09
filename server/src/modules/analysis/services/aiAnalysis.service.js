import Analysis from '../../../models/Analysis.js';
import ApiError from '../../../utils/ApiError.js';
import { generateRepositoryAnalysis } from '../../../services/ai/openrouter.service.js';
import { emitAnalysisProgress } from '../../../socket.js';

/**
 * Service to execute OpenRouter AI analysis on an existing Analysis document.
 *
 * @param {Object} params - Service parameters
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.analysisId - MongoDB Analysis document ID
 * @returns {Promise<Object>} Updated Analysis document with AI results
 */
export const runAIAnalysisService = async ({ userId, analysisId }) => {
  console.log(`[Pipeline] Analyze Request received for Analysis ID: ${analysisId}`);

  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  const analysisDoc = await Analysis.findById(analysisId);
  if (!analysisDoc) {
    throw new ApiError(404, 'Analysis report not found');
  }

  if (analysisDoc.user && analysisDoc.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized access to analysis report');
  }

  analysisDoc.status = 'Processing';
  analysisDoc.aiProvider = 'OpenRouter';
  await analysisDoc.save();

  try {
    const repoPayload = {
      name: analysisDoc.repository?.name || 'Repository',
      fullName: analysisDoc.repository?.fullName || `${analysisDoc.repository?.owner}/${analysisDoc.repository?.name}`,
      description: analysisDoc.repository?.description || '',
      readme: analysisDoc.metadata?.readme?.content || '',
      languages: analysisDoc.metadata?.languages || { [analysisDoc.github?.language || 'TypeScript']: 100 },
      topics: analysisDoc.github?.topics || [],
      stars: analysisDoc.github?.stars || 0,
      forks: analysisDoc.github?.forks || 0,
      openIssues: analysisDoc.github?.openIssues || 0,
      license: analysisDoc.repository?.license || 'MIT',
      defaultBranch: analysisDoc.repository?.defaultBranch || 'main',
      rootContents: analysisDoc.metadata?.rootContents || [],
    };

    // Emit Stage 60%
    emitAnalysisProgress({ analysisId, percentage: 60, stage: 'Running AI analysis' });

    // Call OpenRouter AI service with strict type sanitization
    const aiResult = await generateRepositoryAnalysis(repoPayload);

    // Emit Stage 75%
    emitAnalysisProgress({ analysisId, percentage: 75, stage: 'Generating code quality report' });

    // Emit Stage 85%
    emitAnalysisProgress({ analysisId, percentage: 85, stage: 'Generating security review' });

    analysisDoc.analysis = {
      // Numbers
      overallScore: aiResult.overallScore,
      codeQuality: aiResult.codeQuality,
      documentation: aiResult.documentation,
      architecture: aiResult.architecture,
      maintainability: aiResult.maintainability,
      security: aiResult.security,
      performance: aiResult.performance,
      bestPractices: aiResult.bestPractices,

      // Text Reviews
      architectureReview: aiResult.architectureReview,
      codeQualityReview: aiResult.codeQualityReview,
      documentationReview: aiResult.documentationReview,
      securityReview: aiResult.securityReview,
      performanceReview: aiResult.performanceReview,
      maintainabilityReview: aiResult.maintainabilityReview,
      bestPracticesReview: aiResult.bestPracticesReview,

      // Arrays & Summary
      summary: aiResult.summary,
      techStack: aiResult.technologyStack,
      strengths: aiResult.strengths,
      weaknesses: aiResult.weaknesses,
      recommendations: aiResult.recommendations,
      suggestions: aiResult.recommendations,
    };

    // Emit Stage 92%
    emitAnalysisProgress({ analysisId, percentage: 92, stage: 'Saving report' });

    console.log(`[Pipeline] Saving MongoDB Analysis document (${analysisId})...`);

    analysisDoc.status = 'Completed';
    analysisDoc.completedAt = new Date();
    analysisDoc.aiProvider = 'OpenRouter';
    analysisDoc.errorMessage = '';

    await analysisDoc.save();

    // Emit Stage 100%
    emitAnalysisProgress({
      analysisId,
      percentage: 100,
      stage: 'Analysis completed',
      status: 'Completed',
    });

    console.log(`[Pipeline] Analysis completed successfully for ID: ${analysisId}`);
    return analysisDoc;
  } catch (error) {
    console.error(`[Pipeline Error] Analysis execution failed for ID ${analysisId}:`, error);

    const exactErrorMessage = error.message || 'OpenRouter AI analysis failed';

    analysisDoc.status = 'Failed';
    analysisDoc.aiProvider = 'OpenRouter';
    analysisDoc.errorMessage = exactErrorMessage;
    await analysisDoc.save();

    emitAnalysisProgress({
      analysisId,
      percentage: 0,
      stage: 'Analysis failed',
      status: 'Failed',
      error: exactErrorMessage,
    });

    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, exactErrorMessage);
  }
};

/**
 * Service to fetch complete AI analysis report for an authenticated user.
 */
export const getAnalysisReportService = async ({ userId, analysisId }) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication is required');
  }

  const analysisDoc = await Analysis.findById(analysisId);
  if (!analysisDoc) {
    throw new ApiError(404, 'Analysis report not found');
  }

  if (analysisDoc.user && analysisDoc.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized access to analysis report');
  }

  return analysisDoc;
};

export default {
  runAIAnalysisService,
  getAnalysisReportService,
};
