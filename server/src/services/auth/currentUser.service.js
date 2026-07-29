import ApiError from '../../utils/ApiError.js';

/**
 * Service to retrieve current authenticated user details.
 *
 * @param {Object} user - Authenticated user object attached to request
 * @returns {Promise<Object>} Clean user object without sensitive fields
 */
export const currentUserService = async (user) => {
  if (!user) {
    throw new ApiError(401, 'User is not authenticated');
  }

  // Convert Mongoose document to plain object if needed
  const userObject = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  // Remove sensitive fields
  delete userObject.password;
  delete userObject.githubAccessToken;

  return userObject;
};

export default currentUserService;
