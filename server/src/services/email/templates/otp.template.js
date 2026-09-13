/**
 * Generates Aurex branded HTML template for Password Reset OTP verification.
 *
 * @param {Object} params - { otp, fullName }
 * @returns {string} HTML string
 */
export const generateOtpEmailTemplate = ({ otp }) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Verification - Aurex</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0B1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC; -webkit-font-smoothing: antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B1120; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 480px; background-color: #141B2D; border: 1px solid #2A3247; border-radius: 16px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <!-- Aurex Brand Header -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <h1 style="margin: 0; font-size: 30px; font-weight: 800; color: #A5B4FC; letter-spacing: -0.5px;">
                  Aurex
                </h1>
                <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: 600; color: #94A3B8; letter-spacing: 1.5px; text-transform: uppercase;">
                  Developer Intelligence Platform
                </p>
              </td>
            </tr>

            <!-- Heading -->
            <tr>
              <td align="center" style="padding-bottom: 16px;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">
                  Password Reset Verification
                </h2>
              </td>
            </tr>

            <!-- Message Body -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; color: #94A3B8; line-height: 1.6;">
                  We received a request to reset your Aurex account password.
                </p>
              </td>
            </tr>

            <!-- Premium Highlighted OTP Box -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <div style="background-color: #0F172A; border: 1px solid #2A3247; border-radius: 12px; padding: 18px 32px; display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #A5B4FC; box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);">
                  ${otp}
                </div>
              </td>
            </tr>

            <!-- Expiry & Security Note -->
            <tr>
              <td align="center" style="padding-bottom: 24px; border-bottom: 1px solid #2A3247;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #CBD5E1;">
                  This code expires in <strong style="color: #F8FAFC;">10 minutes</strong>.
                </p>
                <p style="margin: 0; font-size: 12px; color: #64748B;">
                  If you didn't request this password reset, simply ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top: 24px;">
                <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #E2E8F0;">
                  © Aurex
                </p>
                <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                  Developer Intelligence Platform
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

export default generateOtpEmailTemplate;
