import SecurityScan from '../../models/SecurityScan.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import asyncHandler from '../../utils/asyncHandler.js';
import {
  startSecurityScanService,
  getSecurityOverviewService,
} from '../../services/security/securityScan.service.js';

/**
 * @desc    Fetch aggregated security overview metrics from MongoDB
 * @route   GET /api/security/overview
 * @access  Public / Optional Auth
 */
export const getSecurityOverview = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const overview = await getSecurityOverviewService(userId);
  return res.status(200).json(new ApiResponse(200, overview, 'Security overview fetched successfully'));
});

/**
 * @desc    Initiate a new security vulnerability & SAST scan
 * @route   POST /api/security/scan
 * @access  Public / Optional Auth
 */
export const startSecurityScan = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const { owner, repo, githubUrl } = req.body;

  if (!githubUrl && (!owner || !repo)) {
    throw new ApiError(400, 'Either githubUrl or (owner and repo) must be provided.');
  }

  const result = await startSecurityScanService({
    userId,
    owner,
    repo,
    githubUrl,
  });

  return res.status(202).json(new ApiResponse(202, result, 'Security scan initiated successfully'));
});

/**
 * @desc    List past security scans with pagination and filters
 * @route   GET /api/security/scans
 * @access  Public / Optional Auth
 */
export const getSecurityScans = asyncHandler(async (req, res) => {
  const userId = req.user?._id || null;
  const { repository, status, page = 1, limit = 10 } = req.query;

  const query = {};
  if (userId) {
    query.user = userId;
  }
  if (repository) {
    query['repository.fullName'] = { $regex: new RegExp(repository, 'i') };
  }
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const total = await SecurityScan.countDocuments(query);
  const scans = await SecurityScan.find(query)
    .select('-findings.evidence') // omit large evidence in list view for performance
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit, 10));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        scans,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
      'Security scans fetched successfully'
    )
  );
});

/**
 * @desc    Get detailed security scan record by scanId
 * @route   GET /api/security/scans/:scanId
 * @access  Public / Optional Auth
 */
export const getSecurityScanById = asyncHandler(async (req, res) => {
  const { scanId } = req.params;

  const scan = await SecurityScan.findById(scanId);
  if (!scan) {
    throw new ApiError(404, 'Security scan record not found');
  }

  // Authorization check for private repository scans
  if (scan.repository?.visibility === 'private' && scan.user) {
    if (!req.user || req.user._id.toString() !== scan.user.toString()) {
      throw new ApiError(403, 'Unauthorized access to private repository security scan.');
    }
  }

  return res.status(200).json(new ApiResponse(200, scan, 'Security scan details fetched successfully'));
});

/**
 * @desc    Get latest security scan for a specific repository
 * @route   GET /api/security/latest/:owner/:repo
 * @access  Public / Optional Auth
 */
export const getLatestScanForRepo = asyncHandler(async (req, res) => {
  const { owner, repo } = req.params;
  const fullName = `${owner}/${repo}`;

  const query = {
    'repository.fullName': { $regex: new RegExp(`^${fullName}$`, 'i') },
  };

  const scan = await SecurityScan.findOne(query).sort({ createdAt: -1 });

  if (!scan) {
    return res.status(200).json(
      new ApiResponse(200, null, 'No security scan found for this repository yet.')
    );
  }

  return res.status(200).json(new ApiResponse(200, scan, 'Latest security scan fetched successfully'));
});

export default {
  getSecurityOverview,
  startSecurityScan,
  getSecurityScans,
  getSecurityScanById,
  getLatestScanForRepo,
};
