import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { resetPasswordService } from '../../services/auth/resetPassword.service.js';

/**
 * Controller to handle POST /api/auth/reset-password requests.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await resetPasswordService({ email, password });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Password updated successfully.'));
});

export default resetPassword;
