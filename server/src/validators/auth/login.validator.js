import { body, validationResult } from 'express-validator';

/**
 * Express-validator rules for user login.
 */
export const loginValidatorRules = [
  body('emailOrUsername')
    .trim()
    .notEmpty()
    .withMessage('Email or username is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Email or username must be between 3 and 100 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

/**
 * Reusable validation middleware to catch and format express-validator errors.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
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
 * Combined login validation middleware array.
 */
export const loginValidator = [...loginValidatorRules, validate];

export default loginValidator;
