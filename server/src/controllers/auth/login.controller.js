import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { loginUserService } from '../../services/auth/loginUser.service.js';

/**
 * Controller to handle user login requests.
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { emailOrUsername, password } = req.body;

  const authData = await loginUserService({
    emailOrUsername,
    password,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, authData, 'Login successful'));
});

export default loginUser;
