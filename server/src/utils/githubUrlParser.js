import ApiError from './ApiError.js';

/**
 * Parses and validates GitHub repository inputs in various formats:
 * - https://github.com/facebook/react
 * - http://github.com/facebook/react
 * - github.com/facebook/react
 * - facebook/react
 * - https://github.com/facebook/react/
 * - https://github.com/facebook/react.git
 *
 * Rejects:
 * - Profile URLs (e.g. github.com/facebook)
 * - System/Settings URLs (e.g. github.com/settings, github.com/orgs/...)
 * - Issue / PR / tree / blob URLs (e.g. github.com/owner/repo/issues/1)
 * - Non-GitHub domains
 *
 * @param {string} input - Repository string or GitHub URL
 * @returns {{ owner: string, repo: string }} Extracted owner and repo name
 * @throws {ApiError} 400 Bad Request if format is invalid or malformed
 */
export const parseGithubRepoInput = (input) => {
  const invalidUrlMessage = 'Please enter a valid public GitHub repository URL.';

  if (!input || typeof input !== 'string' || !input.trim()) {
    throw new ApiError(400, invalidUrlMessage);
  }

  let clean = input.trim();

  // 1. Check for domain if full URL is supplied
  if (/^https?:\/\//i.test(clean)) {
    try {
      const parsedUrl = new URL(clean);
      const hostname = parsedUrl.hostname.toLowerCase();
      if (hostname !== 'github.com' && hostname !== 'www.github.com') {
        throw new ApiError(400, invalidUrlMessage);
      }
      clean = parsedUrl.pathname;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(400, invalidUrlMessage);
    }
  } else if (/^(www\.)?github\.com/i.test(clean)) {
    clean = clean.replace(/^(www\.)?github\.com/i, '');
  }

  // 2. Remove trailing .git or trailing slashes
  clean = clean.replace(/\.git\/?$/i, '').replace(/\/+$/, '').replace(/^\/+/, '');

  // 3. Split path components
  const parts = clean.split('/').filter(Boolean);

  // Must have exactly owner and repo (2 parts)
  if (parts.length !== 2) {
    throw new ApiError(400, invalidUrlMessage);
  }

  const owner = parts[0].trim();
  const repo = parts[1].trim();

  // 4. Reject system/reserved GitHub keywords
  const reservedSystemKeywords = new Set([
    'settings', 'orgs', 'organizations', 'notifications', 'trending', 'explore',
    'sponsors', 'pricing', 'features', 'enterprise', 'topics', 'collections',
    'events', 'search', 'login', 'signup', 'marketplace', 'site', 'about', 'team'
  ]);

  if (reservedSystemKeywords.has(owner.toLowerCase()) || reservedSystemKeywords.has(repo.toLowerCase())) {
    throw new ApiError(400, invalidUrlMessage);
  }

  // 5. Validate GitHub username and repository name rules
  const validNamePattern = /^[a-zA-Z0-9_.-]+$/;

  if (!validNamePattern.test(owner) || !validNamePattern.test(repo)) {
    throw new ApiError(400, invalidUrlMessage);
  }

  return { owner, repo };
};

export default parseGithubRepoInput;

