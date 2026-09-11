import { Resend } from 'resend';
import ApiError from '../../../utils/ApiError.js';

/**
 * Get dynamic Resend SDK instance based on environment configuration.
 */
export const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
};

/**
 * Verify Resend API Key setup on application startup.
 */
export const verifyResendProvider = () => {
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  if (!apiKey) {
    console.warn('[RESEND WARNING] RESEND_API_KEY is not configured in environment variables. Email delivery will be mocked in local mode.');
    return false;
  }
  console.log('✓ Resend initialized');
  return true;
};

/**
 * Send email using official Resend SDK.
 *
 * @param {Object} options - { to, subject, html, text }
 * @returns {Promise<Object>} Response object
 */
export const sendEmailViaResend = async ({ to, subject, html, text }) => {
  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
  const fromEmail = process.env.EMAIL_FROM || 'Aurex Security <onboarding@resend.dev>';
  const sanitizedTo = typeof to === 'string' ? to.trim().toLowerCase() : to;

  console.log(`Sending email...`);

  // Fallback mock mode if RESEND_API_KEY is missing
  if (!apiKey) {
    console.warn(`[RESEND WARN] RESEND_API_KEY missing in .env. Mock email sent to: ${sanitizedTo}`);
    return { success: true, mocked: true, id: `mock-${Date.now()}` };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(sanitizedTo) ? sanitizedTo : [sanitizedTo],
      subject,
      html,
      text,
    });

    if (error) {
      console.error(`Email failed for ${sanitizedTo}:`, error.message);
      throw new ApiError(500, `Resend Error: ${error.message}`);
    }

    console.log(`Email sent successfully to: ${sanitizedTo} (ID: ${data.id})`);
    return {
      success: true,
      id: data.id,
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error(`Email failed for ${sanitizedTo}:`, err.message);
    throw new ApiError(500, `Failed to send email via Resend: ${err.message}`);
  }
};

export default sendEmailViaResend;
