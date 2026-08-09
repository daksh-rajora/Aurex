import { Router } from 'express';
import { registerUser } from '../controllers/auth/register.controller.js';
import registerValidator from '../validators/auth/register.validator.js';
import { loginUser } from '../controllers/auth/login.controller.js';
import loginValidator from '../validators/auth/login.validator.js';
import { getCurrentUser } from '../controllers/auth/currentUser.controller.js';
import { forgotPassword } from '../controllers/auth/forgotPassword.controller.js';
import forgotPasswordValidator from '../validators/auth/forgotPassword.validator.js';
import { verifyOtp } from '../controllers/auth/verifyOtp.controller.js';
import verifyOtpValidator from '../validators/auth/verifyOtp.validator.js';
import { resetPassword } from '../controllers/auth/resetPassword.controller.js';
import resetPasswordValidator from '../validators/auth/resetPassword.validator.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = Router();

/**
 * Authentication Routes
 */

// POST /register - Register a new user
router.post('/register', registerValidator, registerUser);

// POST /login - Authenticate user
router.post('/login', loginValidator, loginUser);

// POST /forgot-password - Request password reset OTP
router.post('/forgot-password', forgotPasswordValidator, forgotPassword);

// POST /verify-otp & /verify-reset-otp - Verify password reset 6-digit OTP
router.post('/verify-otp', verifyOtpValidator, verifyOtp);
router.post('/verify-reset-otp', verifyOtpValidator, verifyOtp);

// POST /reset-password - Reset password using verified OTP credentials
router.post('/reset-password', resetPasswordValidator, resetPassword);

// GET /me - Get current authenticated user details
router.get('/me', authenticateUser, getCurrentUser);

export default router;
