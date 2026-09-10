import crypto from 'crypto';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Service to verify 6-digit OTP for password reset.
 *
 * @param {Object} data - { email, otp }
 */
export const verifyOtpService = async ({ email, otp }) => {
  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedOtp = otp.trim();

  // Query user including hidden resetPasswordOtp and resetPasswordOtpExpiry fields
  const user = await User.findOne({ email: sanitizedEmail }).select(
    '+resetPasswordOtp +resetPasswordOtpExpiry'
  );

  if (!user) {
    throw new ApiError(400, 'Invalid request or user not found');
  }

  if (!user.resetPasswordOtp) {
    throw new ApiError(400, 'No active OTP request found. Please request a new OTP.');
  }

  if (!user.resetPasswordOtpExpiry || user.resetPasswordOtpExpiry < new Date()) {
    throw new ApiError(400, 'OTP code has expired. Please request a new OTP.');
  }

  // Hash incoming OTP using SHA-256 to compare with stored hash
  const hashedInputOtp = crypto.createHash('sha256').update(sanitizedOtp).digest('hex');

  const storedOtpBuffer = Buffer.from(user.resetPasswordOtp, 'hex');
  const inputOtpBuffer = Buffer.from(hashedInputOtp, 'hex');

  if (storedOtpBuffer.length !== inputOtpBuffer.length || !crypto.timingSafeEqual(storedOtpBuffer, inputOtpBuffer)) {
    throw new ApiError(400, 'Invalid verification code. Please check and try again.');
  }

  return {
    verified: true,
    message: 'OTP verified successfully.',
  };
};

export default verifyOtpService;
