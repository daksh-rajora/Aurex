import axios from 'axios';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';

/**
 * Service to link a GitHub account to an authenticated Aurex user.
 *
 * @param {string} userId - Aurex user ID (_id)
 * @param {string} accessToken - GitHub OAuth access token
 * @returns {Promise<Object>} Updated Aurex user object without sensitive fields
 */
export const githubConnectService = async (userId, accessToken) => {
  if (!userId) {
    throw new ApiError(401, 'User is not authenticated');
  }

  if (!accessToken) {
    throw new ApiError(400, 'GitHub access token is required');
  }

  // 1. Fetch user from database
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  let profileData;
  let emailsData = [];

  // 2. Fetch GitHub User Profile & Verified Emails from GitHub API
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Aurex-App',
    };

    const [profileRes, emailsRes] = await Promise.all([
      axios.get(`${githubConfig.apiBaseUrl}/user`, { headers }),
      axios.get(`${githubConfig.apiBaseUrl}/user/emails`, { headers }).catch(() => ({ data: [] })),
    ]);

    profileData = profileRes.data;
    emailsData = emailsRes.data || [];
  } catch (error) {
    console.error('[GitHub Connect Error]', error.response?.data || error.message);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, 'Failed to fetch GitHub profile or user details');
  }

  if (!profileData || !profileData.id) {
    throw new ApiError(401, 'Invalid profile response from GitHub');
  }

  // 3. Extract primary verified email from GitHub if available
  const primaryVerifiedEmailObj = Array.isArray(emailsData)
    ? emailsData.find((e) => e.primary && e.verified) || emailsData.find((e) => e.verified)
    : null;

  const githubEmail = primaryVerifiedEmailObj?.email || profileData.email;

  // 4. Prepare updates for MongoDB
  user.githubId = String(profileData.id);
  user.githubUsername = profileData.login || '';
  user.githubAccessToken = accessToken;
  user.isGithubConnected = true;

  if (profileData.avatar_url && !user.avatar) {
    user.avatar = profileData.avatar_url;
  }

  // Update email only if current email is empty/missing
  if (!user.email && githubEmail) {
    user.email = githubEmail.trim().toLowerCase();
  }

  await user.save();

  // 5. Fetch updated user excluding sensitive fields
  const updatedUser = await User.findById(user._id).select(
    '-password -githubAccessToken'
  );

  return updatedUser;
};

export default githubConnectService;
