import { body, validationResult } from 'express-validator';
import ApiError from '../../utils/ApiError.js';

export const validatePublicAnalysis = [
  body().custom((value, { req }) => {
    const repository = req.body?.repository;
    const url = req.body?.url;

    if ((!repository || typeof repository !== 'string' || !repository.trim()) &&
        (!url || typeof url !== 'string' || !url.trim())) {
      throw new Error('Please provide either "repository" (e.g. "facebook/react") or "url" (e.g. "https://github.com/facebook/react")');
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
