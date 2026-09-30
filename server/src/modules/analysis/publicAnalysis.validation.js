import { body, validationResult } from 'express-validator';
import ApiError from '../../utils/ApiError.js';

export const validatePublicAnalysis = [
  body().custom((value, { req }) => {
    const rawInput = req.body?.githubUrl || req.body?.url || req.body?.repository;

    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      throw new Error('Please enter a valid public GitHub repository URL.');
    }
    return true;
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg, errors.array());
    }
    next();
  },
];

export default validatePublicAnalysis;

