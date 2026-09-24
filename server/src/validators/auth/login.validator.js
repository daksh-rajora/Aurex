import { body, validationResult } from 'express-validator';

/**
 * Express-validator rules for user login using email and password.
 */
export const loginValidatorRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Please enter your email')
    .isEmail()
    .withMessage('Please enter a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Please enter your password'),
];

/**
 * Validation middleware to catch and format express-validator errors.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorArray = errors.array();
    const firstError = errorArray[0];

    const formattedErrors = errorArray.map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: firstError.path || firstError.param,
      errors: formattedErrors,
    });
  }

  next();
};

/**
 * Combined login validation middleware.
 */
export const loginValidator = [...loginValidatorRules, validate];

export default loginValidator;
