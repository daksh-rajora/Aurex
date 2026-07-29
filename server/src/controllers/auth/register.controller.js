import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { registerUserService } from '../../services/auth/registerUser.service.js';

/**
 * Controller to handle user registration.
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  const user = await registerUserService({
    fullName,
    username,
    email,
    password,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, 'User registered successfully'));
});
