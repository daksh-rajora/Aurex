import { body, validationResult } from 'express-validator';

/**
 * Express-validator rules for OTP verification.
 */
export const verifyOtpValidatorRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be a 6-digit number')
    .matches(/^\d{6}$/)
    .withMessage('OTP must contain only digits'),
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
 * Combined OTP verification validation middleware chain.
 */
export const verifyOtpValidator = [...verifyOtpValidatorRules, validate];

export default verifyOtpValidator;
