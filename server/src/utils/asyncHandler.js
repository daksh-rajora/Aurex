/**
 * Async wrapper for Express route handlers to automatically catch rejected promises
 * and forward errors to the Express error-handling middleware via next().
 *
 * @param {Function} requestHandler - The async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler;
