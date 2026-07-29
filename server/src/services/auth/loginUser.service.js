import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Service to authenticate user login in Aurex.
 *
 * @param {Object} credentials - User credentials
 * @param {string} credentials.emailOrUsername - User's email or username
 * @param {string} credentials.password - User's plain text password
 * @returns {Promise<Object>} Authenticated user document without password and githubAccessToken
 */
export const loginUserService = async (credentials = {}) => {
  const { emailOrUsername, password } = credentials;

  // 1. Validate required fields
  if (!emailOrUsername || !password) {
    throw new ApiError(400, 'Both email/username and password are required');
  }

  // 2. Trim input values & 3. Convert email/username to lowercase
  const identifier = emailOrUsername.trim().toLowerCase();

  if (!identifier || !password) {
    throw new ApiError(400, 'Email/username and password cannot be blank');
  }

  // 4. Find user by email OR username & 5. Explicitly select password field
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select('+password');

  // 6. If user is not found, throw 401 Invalid credentials
  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // 7. Compare the password using bcrypt.compare()
  const isPasswordValid = await bcrypt.compare(password, user.password);

  // 8. If password does not match, throw 401 Invalid credentials
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // 10. Fetch user excluding sensitive fields (password and githubAccessToken)
  const loggedInUser = await User.findById(user._id).select(
    '-password -githubAccessToken'
  );

  return loggedInUser;
};
