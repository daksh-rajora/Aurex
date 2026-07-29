import { param, validationResult } from 'express-validator';
import ApiError from '../../utils/ApiError.js';

export const validateStartAnalysis = [
  param('owner')
    .trim()
    .notEmpty()
    .withMessage('Repository owner is required'),
  param('repo')
    .trim()
    .notEmpty()
    .withMessage('Repository name is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(
        400,
        errors.array()[0].msg,
        errors.array()
      );
    }
    next();
  },
];

export const validateAnalysisId = [
  param('analysisId')
    .trim()
    .isMongoId()
    .withMessage('Invalid Analysis ID format'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(
        400,
        errors.array()[0].msg,
        errors.array()
      );
    }
    next();
  },
];
