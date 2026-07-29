import ApiError from '../utils/ApiError.js';

/**
 * Global Express error handling middleware.
 *
 * @param {Error|ApiError} err - Error object caught by Express
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  const isApiError = err instanceof ApiError;

  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : 'Internal Server Error';
  const errors = isApiError ? (err.errors || []) : [];

  const response = {
    success: false,
    statusCode,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  return res.status(statusCode).json(response);
};

export default errorHandler;
