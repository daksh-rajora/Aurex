import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { verifyOtpService } from '../../services/auth/verifyOtp.service.js';

/**
 * Controller to handle POST /api/auth/verify-otp requests.
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const result = await verifyOtpService({ email, otp });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'OTP verified successfully.'));
});

export default verifyOtp;
