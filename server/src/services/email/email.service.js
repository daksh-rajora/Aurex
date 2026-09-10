import { sendEmailViaResend } from './providers/resend.provider.js';
import generateOtpEmailTemplate from './templates/otp.template.js';

/**
 * Reusable function to send OTP email via Resend Provider.
 *
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP verification code
 * @returns {Promise<Object>} Status response
 */
export const sendOtpEmail = async (email, otp) => {
  const sanitizedEmail = email.trim().toLowerCase();
  const htmlContent = generateOtpEmailTemplate({ otp });
  const subject = `${otp} is your Aurex password reset verification code`;
  const textContent = `We received a request to reset your Aurex account password. Your verification code is: ${otp}. This code expires in 10 minutes. If you didn't request this, ignore this email.`;

  return await sendEmailViaResend({
    to: sanitizedEmail,
    subject,
    html: htmlContent,
    text: textContent,
  });
};

export const emailService = {
  sendOtpEmail,
  sendPasswordResetOtp: async ({ email, otp }) => sendOtpEmail(email, otp),
};

export default emailService;
