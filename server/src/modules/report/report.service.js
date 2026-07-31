import mongoose from 'mongoose';
import Analysis from '../../models/Analysis.js';
import ApiError from '../../utils/ApiError.js';
import { generateAnalysisPdf } from './pdfGenerator.service.js';

/**
 * Service to verify analysis ownership, ensure completion, and generate PDF report buffer.
 *
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated user's ID
 * @param {string} params.analysisId - Target analysis MongoDB ID
 * @returns {Promise<Object>} Object containing pdfBuffer and formatted filename
 */
export const generateAnalysisPdfReportService = async ({ userId, analysisId }) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!analysisId || !mongoose.Types.ObjectId.isValid(analysisId)) {
    throw new ApiError(400, 'Invalid analysis ID format');
  }

  // Fetch complete analysis document
  const analysisDoc = await Analysis.findById(analysisId);

  if (!analysisDoc) {
    throw new ApiError(404, 'Repository analysis report not found');
  }

  // Verify ownership (or public access if user matches)
  if (analysisDoc.user && analysisDoc.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'Access denied. You can only download PDF reports for your own analyses');
  }

  // Verify completion status
  if (analysisDoc.status !== 'Completed') {
    throw new ApiError(
      400,
      `PDF report can only be generated for completed analyses (Current status: ${analysisDoc.status})`
    );
  }

  // Generate PDF Buffer
  const pdfBuffer = await generateAnalysisPdf(analysisDoc);

  const owner = analysisDoc.repository?.owner || 'repo';
  const name = analysisDoc.repository?.name || 'analysis';
  const fileName = `Aurex_Report_${owner}_${name}.pdf`.replace(/[^a-zA-Z0-9_\-\.]/g, '_');

  return {
    pdfBuffer,
    fileName,
  };
};

export default {
  generateAnalysisPdfReportService,
};
