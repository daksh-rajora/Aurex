import { body, validationResult } from 'express-validator';

/**
 * Express-validator rules for forgot password request.
 */
export const forgotPasswordValidatorRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

/**
 * Validation handler middleware to format and return validation errors.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * Combined forgot password validation middleware chain.
 */
export const forgotPasswordValidator = [...forgotPasswordValidatorRules, validate];

export default forgotPasswordValidator;
