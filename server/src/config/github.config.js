import 'dotenv/config';

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const callbackUrl = process.env.GITHUB_CALLBACK_URL;

// Validate required GitHub OAuth environment variables
const missingVars = [];
if (!clientId) missingVars.push('GITHUB_CLIENT_ID');
if (!clientSecret) missingVars.push('GITHUB_CLIENT_SECRET');
if (!callbackUrl) missingVars.push('GITHUB_CALLBACK_URL');

if (missingVars.length > 0) {
  throw new Error(
    `Missing GitHub OAuth configuration: ${missingVars.join(', ')} must be defined in environment variables.`
  );
}

/**
 * GitHub OAuth Configuration Object
 */
export const githubConfig = {
  clientId,
  clientSecret,
  callbackUrl,
  authorizeUrl: 'https://github.com/login/oauth/authorize',
  accessTokenUrl: 'https://github.com/login/oauth/access_token',
  apiBaseUrl: 'https://api.github.com',
};

export default githubConfig;
