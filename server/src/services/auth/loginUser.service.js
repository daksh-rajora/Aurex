import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';
import { generateAccessToken } from '../../utils/jwt.js';

/**
 * Service to authenticate a user during login and generate access token.
 *
 * @param {Object} loginData - { email, password }
 * @returns {Promise<Object>} Object containing authenticated user and accessToken
 */
export const loginUserService = async (loginData = {}) => {
  const { email, password } = loginData;

  // 1. Validate that required fields are provided
  if (!email || !email.trim()) {
    throw new ApiError(400, 'Please enter your email');
  }

  if (!password || !password.trim()) {
    throw new ApiError(400, 'Please enter your password');
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const trimmedPassword = password.trim();

  // 2. Search for user by email in MongoDB
  const user = await User.findOne({ email: sanitizedEmail }).select('+password +githubAccessToken');

  // 3. If no user exists, throw 404 User not found
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // 4. Compare the provided password with the hashed password
  const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Incorrect password');
  }

  // 5. Generate JWT access token
  const accessToken = generateAccessToken(user);

  // 6. Remove sensitive fields before returning
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.githubAccessToken;

  // 7. Return user object and accessToken
  return {
    user: userObject,
    accessToken,
  };
};

export default loginUserService;
