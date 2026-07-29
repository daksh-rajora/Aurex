import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Service to register a new user in Aurex.
 *
 * @param {Object} userData - Registration details
 * @param {string} userData.fullName - Full name of the user
 * @param {string} userData.username - Chosen username
 * @param {string} userData.email - User email address
 * @param {string} userData.password - User password
 * @returns {Promise<Object>} Created user object without sensitive fields
 */
export const registerUserService = async (userData = {}) => {
  const { fullName, username, email, password } = userData;

  // 1. Validate required fields
  if (!fullName || !username || !email || !password) {
    throw new ApiError(
      400,
      'All fields (fullName, username, email, password) are required'
    );
  }

  // 2. Trim string values & 3. Convert email and username to lowercase
  const trimmedFullName = fullName.trim();
  const trimmedUsername = username.trim().toLowerCase();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedFullName || !trimmedUsername || !trimmedEmail || !password) {
    throw new ApiError(400, 'Fields cannot be empty or blank');
  }

  // 4. Check if a user already exists with email or username
  const existingUser = await User.findOne({
    $or: [{ email: trimmedEmail }, { username: trimmedUsername }],
  });

  // 5. If user exists, throw 409 Conflict
  if (existingUser) {
    if (existingUser.email === trimmedEmail) {
      throw new ApiError(409, 'User with this email already exists');
    }
    if (existingUser.username === trimmedUsername) {
      throw new ApiError(409, 'User with this username already exists');
    }
    throw new ApiError(409, 'User with this email or username already exists');
  }

  // 6. Hash password using bcrypt with 10 salt rounds
  const hashedPassword = await bcrypt.hash(password, 10);

  // 7. Create the new user
  const user = await User.create({
    fullName: trimmedFullName,
    username: trimmedUsername,
    email: trimmedEmail,
    password: hashedPassword,
  });

  // 8. Omit password and githubAccessToken from returned object
  const createdUser = await User.findById(user._id).select(
    '-password -githubAccessToken'
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      'Something went wrong while registering the user'
    );
  }

  // 9. Return the created user
  return createdUser;
};
