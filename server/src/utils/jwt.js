import jwt from 'jsonwebtoken';
import ApiError from './ApiError.js';

/**
 * Generates an Access Token (JWT) for a given user payload.
 *
 * @param {Object} user - User document or user details object
 * @returns {string} Signed JWT access token
 */
export const generateAccessToken = (user) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  console.log('[DEBUG JWT] Secret during generation:', secret);

  if (!secret) {
    throw new ApiError(500, 'JWT_SECRET is not configured in environment variables');
  }

  const payload = {
    userId: user._id ? user._id.toString() : user.id,
    email: user.email,
    role: user.role,
  };

  try {
    const token = jwt.sign(payload, secret, { expiresIn });
    console.log('[DEBUG JWT] Generated token:', token);
    return token;
  } catch (error) {
    console.error('[DEBUG JWT] Sign error:', error.message);
    throw new ApiError(500, 'Failed to generate access token', [], error.stack);
  }
};

/**
 * Verifies an Access Token (JWT) and returns the decoded payload.
 *
 * @param {string} token - JWT access token to verify
 * @returns {Object} Decoded JWT payload
 * @throws {ApiError} 401 status if token verification fails
 */
export const verifyAccessToken = (token) => {
  const secret = process.env.JWT_SECRET;

  console.log('[DEBUG JWT] Secret during verification:', secret);
  console.log('[DEBUG JWT] Received token for verification:', token);

  if (!secret) {
    throw new ApiError(500, 'JWT_SECRET is not configured in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret);
    console.log('[DEBUG JWT] Decoded payload successfully:', decoded);
    return decoded;
  } catch (error) {
    console.error('[DEBUG JWT] Verification failed with error:', error.name, '-', error.message);
    throw new ApiError(401, 'Invalid or expired token');
  }
};

export default {
  generateAccessToken,
  verifyAccessToken,
};
