import axiosInstance from '../utils/axios.js';

export function formatTimeAgo(dateString) {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';
  const diffInSeconds = Math.floor((new Date() - date) / 1000);
  if (diffInSeconds < 60) return 'just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return `${years} years ago`;
}

export function normalizeRepository(repo) {
  if (!repo) return null;

  const fullName = repo.full_name || repo.fullName || repo.name || '';
  const ownerLogin =
    repo.owner?.login ||
    repo.owner?.name ||
    (typeof repo.owner === 'string' ? repo.owner : '') ||
    (fullName.includes('/') ? fullName.split('/')[0] : 'owner');
  const repoName = repo.name || (fullName.includes('/') ? fullName.split('/')[1] : fullName);

  const avatarUrl =
    repo.owner?.avatar_url ||
    repo.owner?.avatarUrl ||
    (ownerLogin && ownerLogin !== 'owner'
      ? `https://github.com/${ownerLogin}.png`
      : `https://avatars.githubusercontent.com/u/9919?v=4`);

  const htmlUrl =
    repo.html_url || repo.url || repo.githubUrl || `https://github.com/${ownerLogin}/${repoName}`;

  return {
    id: String(repo.id || repo.repositoryId || repo._id || `${ownerLogin}-${repoName}`),
    name: repoName,
    fullName: fullName || `${ownerLogin}/${repoName}`,
    owner: {
      login: ownerLogin,
      avatarUrl,
      htmlUrl: repo.owner?.html_url || repo.owner?.htmlUrl || `https://github.com/${ownerLogin}`,
    },
    description: repo.description || 'No description provided for this repository.',
    language: repo.language || 'Markdown',
    stars: repo.stargazers_count ?? repo.stars ?? 0,
    forks: repo.forks_count ?? repo.forks ?? 0,
    openIssues: repo.open_issues_count ?? repo.openIssues ?? 0,
    watchers: repo.watchers_count ?? repo.watchers ?? 0,
    size:
      typeof repo.size === 'number'
        ? `${(repo.size / 1024).toFixed(1)} MB`
        : repo.size || '1.0 MB',
    isPrivate: Boolean(repo.private || repo.visibility === 'private' || repo.isPrivate),
    visibility: repo.visibility || (repo.private || repo.isPrivate ? 'private' : 'public'),
    url: htmlUrl,
    defaultBranch: repo.default_branch || repo.defaultBranch || 'main',
    createdDate: repo.created_at || repo.createdAt
      ? new Date(repo.created_at || repo.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'N/A',
    lastUpdated: formatTimeAgo(repo.updated_at || repo.updatedAt || repo.pushed_at || repo.createdAt),
    lastCommit: repo.pushed_at
      ? `Push on ${new Date(repo.pushed_at).toLocaleDateString()}`
      : 'Latest commit details',
    topics: Array.isArray(repo.topics) ? repo.topics : [],
    isFavorite: repo.isFavorite !== undefined ? Boolean(repo.isFavorite) : true,
    isAnalyzed: Boolean(repo.isAnalyzed),
    healthScore: repo.healthScore || null,
    license:
      typeof repo.license === 'object'
        ? repo.license?.name || repo.license?.spdx_id || 'MIT'
        : repo.license || 'MIT',
  };
}

export const githubService = {
  /**
   * Fetch all connected GitHub repositories for the authenticated user
   */
  getRepositories: async () => {
    const response = await axiosInstance.get('/github/repositories');
    const rawRepos = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];
    return rawRepos.map(normalizeRepository);
  },

  /**
   * Fetch detailed information for a specific repository
   * @param {string} owner - Repository owner (username/org)
   * @param {string} repo - Repository name
   */
  getRepositoryDetails: async (owner, repo) => {
    const response = await axiosInstance.get(`/github/repositories/${owner}/${repo}`);
    return response.data;
  },

  /**
   * Run GitHub repository health analysis
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   */
  analyzeRepository: async (owner, repo) => {
    const response = await axiosInstance.get(`/github/repositories/${owner}/${repo}/analyze`);
    return response.data;
  },

  /**
   * Fetch connected GitHub profile
   */
  getGithubProfile: async () => {
    const response = await axiosInstance.get('/github/profile');
    return response.data;
  },

  /**
   * Link GitHub account token
   */
  connectGithub: async (githubData) => {
    const response = await axiosInstance.post('/github/connect', githubData);
    return response.data;
  },

  /**
   * Toggle repository favorite status in MongoDB
   * @param {Object} payload - { repositoryId, name, fullName, owner, githubUrl, language, stars, forks, isPrivate }
   */
  toggleFavoriteApi: async (payload) => {
    const response = await axiosInstance.post('/github/favorites/toggle', payload);
    return response.data;
  },

  /**
   * Fetch user's saved favorites from MongoDB
   */
  getFavoritesApi: async () => {
    const response = await axiosInstance.get('/github/favorites');
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  },
};

export default githubService;
