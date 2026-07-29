import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import User from '../models/User.js';

/**
 * Authentication middleware to verify JWT access token and attach user to request object.
 */
export const authenticateUser = asyncHandler(async (req, res, next) => {
  // 1. Read Authorization header
  const authHeader =
    req.header('Authorization') ||
    req.header('authorization') ||
    req.headers['authorization'] ||
    req.headers.Authorization;

  console.log('[DEBUG AUTH] Authorization header received:', authHeader);

  let token;

  // 2. Extract token from Bearer scheme
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    } else {
      token = authHeader.trim();
    }
  }

  // Handle accidental quotes wrapped around token in Postman headers
  if (token && ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'")))) {
    token = token.slice(1, -1).trim();
  }

  console.log('[DEBUG AUTH] Extracted token:', token);

  // 3. If token is missing, throw 401
  if (!token) {
    throw new ApiError(401, 'Authentication token is required');
  }

  // 4. Verify token using verifyAccessToken() utility
  const decoded = verifyAccessToken(token);

  // 5. Extract user ID from decoded payload
  const userId = decoded?.userId || decoded?._id || decoded?.id;

  console.log('[DEBUG AUTH] Extracted userId from decoded token:', userId);

  if (!userId) {
    throw new ApiError(401, 'Invalid authentication token payload');
  }

  // 6. Find user in MongoDB & exclude sensitive fields
  const user = await User.findById(userId).select('-password -githubAccessToken');

  // 7. If user does not exist, throw 401
  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  // 8. Attach authenticated user to req.user
  req.user = user;

  // 9. Call next()
  next();
});

export default authenticateUser;
