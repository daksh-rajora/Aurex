import { Router } from 'express';
import { loginUser } from '../../controllers/auth/login.controller.js';
import { loginValidator } from '../../validators/auth/login.validator.js';

const router = Router();

/**
 * @route   POST /login
 * @desc    Authenticate user and return authenticated user details
 * @access  Public
 */
router.post('/login', loginValidator, loginUser);

/*
 * Future Auth Route Placeholders:
 * - POST /logout
 * - GET /me
 * - POST /refresh-token
 * - POST /forgot-password
 * - POST /reset-password
 */

export default router;
