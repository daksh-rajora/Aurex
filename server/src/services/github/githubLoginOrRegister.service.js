import axios from 'axios';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../../models/User.js';
import ApiError from '../../utils/ApiError.js';
import githubConfig from '../../config/github.config.js';

/**
 * Service to handle logging in an existing user via GitHub OAuth or auto-registering a new user.
 *
 * @param {string} accessToken - GitHub OAuth access token
 * @returns {Promise<Object>} Aurex User document
 */
export const githubLoginOrRegisterService = async (accessToken) => {
  if (!accessToken) {
    throw new ApiError(400, 'GitHub access token is required');
  }

  let profileData;
  let emailsData = [];

  // 1. Fetch GitHub user profile & emails
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
    console.error('[GitHub Auth Error]', error.response?.data || error.message);
    throw new ApiError(401, 'Failed to fetch GitHub profile for authentication');
  }

  if (!profileData || !profileData.id) {
    throw new ApiError(401, 'Invalid GitHub profile response');
  }

  // 2. Determine primary verified email
  const primaryVerifiedEmailObj = Array.isArray(emailsData)
    ? emailsData.find((e) => e.primary && e.verified) || emailsData.find((e) => e.verified)
    : null;

  const githubEmail =
    primaryVerifiedEmailObj?.email ||
    profileData.email ||
    `${profileData.login}@users.noreply.github.com`;

  const githubIdStr = String(profileData.id);
  const normalizedEmail = githubEmail.trim().toLowerCase();

  // 3. Check if user exists in database by githubId or email
  let user = await User.findOne({
    $or: [{ githubId: githubIdStr }, { email: normalizedEmail }],
  });

  if (user) {
    // Update existing user with GitHub details
    user.githubId = githubIdStr;
    user.githubUsername = profileData.login || '';
    user.githubAccessToken = accessToken;
    user.isGithubConnected = true;

    if (profileData.avatar_url && !user.avatar) {
      user.avatar = profileData.avatar_url;
    }

    await user.save();
    return user;
  }

  // 4. Create new user if not found
  const fullName = profileData.name || profileData.login || 'GitHub User';

  // Ensure unique username
  let baseUsername = (profileData.login || `github_${githubIdStr}`)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
  if (baseUsername.length < 3) baseUsername = `user_${baseUsername}`;

  let username = baseUsername;
  let counter = 1;

  while (await User.findOne({ username })) {
    username = `${baseUsername}${counter}`;
    counter += 1;
  }

  // Generate random password hash for OAuth account
  const randomPassword = crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(randomPassword, 10);

  user = await User.create({
    fullName,
    username,
    email: normalizedEmail,
    password: hashedPassword,
    avatar: profileData.avatar_url || '',
    githubId: githubIdStr,
    githubUsername: profileData.login || '',
    githubAccessToken: accessToken,
    isGithubConnected: true,
  });

  return user;
};

export default githubLoginOrRegisterService;
