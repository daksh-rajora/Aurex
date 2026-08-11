import crypto from 'crypto';
import User from '../../models/User.js';
import { sendOtpEmail } from '../email/email.service.js';

/**
 * Service to handle user forgot password request.
 * Generates 6-digit OTP, hashes it, sets 10 min expiry, and dispatches email via Resend.
 *
 * @param {Object} data - { email }
 */
export const forgotPasswordService = async ({ email }) => {
  const sanitizedEmail = email.trim().toLowerCase();

  console.log(`[FORGOT PASSWORD] Processing request for email: ${sanitizedEmail}`);

  const user = await User.findOne({ email: sanitizedEmail });

  // Security Best Practice: Always return generic message if email is not found to prevent user enumeration
  if (!user) {
    console.warn(`[FORGOT PASSWORD WARN] No user account found in MongoDB matching email: "${sanitizedEmail}". Returning generic security message.`);
    return {
      message: 'If the email exists, an OTP has been sent.',
    };
  }

  console.log(`[FORGOT PASSWORD] User account verified in MongoDB (ID: ${user._id}, Name: ${user.fullName}).`);

  // Generate secure 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();

  if (process.env.NODE_ENV === 'development') {
    console.log(`[FORGOT PASSWORD DEV] Generated OTP for ${sanitizedEmail}: [ ${otp} ]`);
  }

  // Hash OTP before storing in database (never store plain text OTP)
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  // Set expiry time for 10 minutes
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  user.resetPasswordOtp = hashedOtp;
  user.resetPasswordOtpExpiry = otpExpiry;
  await user.save();

  console.log(`[FORGOT PASSWORD] Stored hashed OTP & 10-minute expiry in MongoDB for ${sanitizedEmail}. Initiating email dispatch...`);

  // Dispatch email via Resend email service
  await sendOtpEmail(user.email, otp);

  console.log(`[FORGOT PASSWORD] OTP email process completed for ${sanitizedEmail}.`);

  return {
    message: 'OTP sent successfully.',
  };
};

export default forgotPasswordService;
