import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Service to reset user password and clear OTP credentials.
 *
 * @param {Object} data - { email, password }
 */
export const resetPasswordService = async ({ email, password }) => {
  const sanitizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: sanitizedEmail });

  if (!user) {
    throw new ApiError(404, 'User account not found.');
  }

  // Hash the new password using bcrypt
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Update password and clear reset OTP credentials
  user.password = hashedPassword;
  user.resetPasswordOtp = null;
  user.resetPasswordOtpExpiry = null;

  await user.save();

  console.log(`[RESET PASSWORD SUCCESS] Password updated and OTP cleared for user: ${sanitizedEmail}`);

  return {
    message: 'Password updated successfully.',
  };
};

export default resetPasswordService;
