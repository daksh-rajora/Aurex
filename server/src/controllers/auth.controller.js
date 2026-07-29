import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';

/**
 * Controller to handle user registration.
 */
export const registerUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Register endpoint is ready'));
});

/**
 * Controller to handle user login.
 */
export const loginUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Login endpoint is ready'));
});

/**
 * Controller to handle user logout.
 */
export const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Logout endpoint is ready'));
});

/**
 * Controller to get current authenticated user profile.
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Get current user endpoint is ready'));
});
