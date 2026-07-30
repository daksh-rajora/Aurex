import ApiError from './ApiError.js';

/**
 * Parses and validates GitHub repository inputs in various formats:
 * - https://github.com/facebook/react
 * - http://github.com/facebook/react
 * - github.com/facebook/react
 * - facebook/react
 * - https://github.com/facebook/react.git
 *
 * @param {string} input - Repository string or GitHub URL
 * @returns {{ owner: string, repo: string }} Extracted owner and repo name
 * @throws {ApiError} 400 Bad Request if format is invalid or malformed
 */
export const parseGithubRepoInput = (input) => {
  if (!input || typeof input !== 'string' || !input.trim()) {
    throw new ApiError(400, 'Repository or GitHub URL is required');
  }

  let clean = input.trim();

  // 1. Remove protocol (http:// or https://)
  clean = clean.replace(/^https?:\/\//i, '');

  // 2. Remove domain (github.com/ or www.github.com/)
  clean = clean.replace(/^(www\.)?github\.com\//i, '');

  // 3. Remove trailing .git or trailing slashes
  clean = clean.replace(/\.git\/?$/i, '').replace(/\/+$/, '');

  // 4. Split path components
  const parts = clean.split('/').filter(Boolean);

  if (parts.length < 2) {
    throw new ApiError(
      400,
      'Invalid GitHub repository format. Expected "owner/repo" or "https://github.com/owner/repo"'
    );
  }

  const owner = parts[0].trim();
  const repo = parts[1].trim();

  // 5. Validate GitHub username and repository name rules
  const validNamePattern = /^[a-zA-Z0-9_.-]+$/;

  if (!validNamePattern.test(owner) || !validNamePattern.test(repo)) {
    throw new ApiError(
      400,
      'Malformed owner or repository name. Invalid characters detected.'
    );
  }

  return { owner, repo };
};

export default parseGithubRepoInput;
