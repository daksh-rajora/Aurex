import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { forgotPasswordService } from '../../services/auth/forgotPassword.service.js';

/**
 * Controller to handle POST /api/auth/forgot-password requests.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await forgotPasswordService({ email });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'If the email exists, an OTP has been sent.'));
});

export default forgotPassword;
