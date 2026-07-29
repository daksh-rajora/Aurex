import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';
import { generateAccessToken } from '../../utils/jwt.js';

/**
 * Service to authenticate a user during login and generate access token.
 *
 * @param {Object} loginData - Login credentials
 * @param {string} loginData.emailOrUsername - User's email or username
 * @param {string} loginData.password - User's plain text password
 * @returns {Promise<Object>} Object containing authenticated user and accessToken
 */
export const loginUserService = async (loginData = {}) => {
  const { emailOrUsername, password } = loginData;

  // 1. Validate that both fields are provided
  if (!emailOrUsername || !password) {
    throw new ApiError(400, 'Both email/username and password are required');
  }

  // 2. Trim string values & convert identifier to lowercase
  const trimmedIdentifier = String(emailOrUsername).trim().toLowerCase();
  const trimmedPassword = String(password).trim();

  if (!trimmedIdentifier || !trimmedPassword) {
    throw new ApiError(400, 'Email/username and password cannot be empty');
  }

  // 3. Search for user by email OR username & explicitly select password + githubAccessToken
  const user = await User.findOne({
    $or: [{ email: trimmedIdentifier }, { username: trimmedIdentifier }],
  }).select('+password +githubAccessToken');

  // 4. If no user exists, throw 401
  if (!user) {
    throw new ApiError(401, 'Invalid email/username or password');
  }

  // 5. Compare the provided password with the hashed password
  const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email/username or password');
  }

  // 6. Generate JWT access token
  const accessToken = generateAccessToken(user);

  // 7. Remove sensitive fields before returning
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.githubAccessToken;

  // 8. Return user object and accessToken
  return {
    user: userObject,
    accessToken,
  };
};

export default loginUserService;
