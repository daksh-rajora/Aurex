import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { currentUserService } from '../../services/auth/currentUser.service.js';

/**
 * Controller to handle fetching current authenticated user profile.
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await currentUserService(req.user);

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Current user fetched successfully'));
});

export default getCurrentUser;
