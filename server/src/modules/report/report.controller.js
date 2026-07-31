import asyncHandler from '../../utils/asyncHandler.js';
import ApiError from '../../utils/ApiError.js';
import { generateAnalysisPdfReportService } from './report.service.js';

/**
 * Controller to handle downloading a PDF analysis report.
 *
 * @route GET /api/report/:analysisId/download
 * @access Private
 */
export const downloadReport = asyncHandler(async (req, res) => {
  const { analysisId } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const { pdfBuffer, fileName } = await generateAnalysisPdfReportService({
    userId,
    analysisId,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  return res.status(200).send(pdfBuffer);
});

export default {
  downloadReport,
};
