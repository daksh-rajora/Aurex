import axiosInstance from '../utils/axios.js';

export const recruiterService = {
  /**
   * Initiate public candidate GitHub repository analysis in Recruiter Mode
   * @param {string} repositoryUrl
   * @param {string} [provider]
   */
  startRecruiterAnalysis: async (repositoryUrl, provider = 'openrouter') => {
    const response = await axiosInstance.post('/recruiter/analyze', {
      repositoryUrl,
      provider,
    });
    return response.data;
  },

  /**
   * Fetch recruiter analysis history for logged in user
   * @param {Object} [params] - { page, limit, search, status, sort }
   */
  getRecruiterHistory: async (params = {}) => {
    const response = await axiosInstance.get('/recruiter/history', { params });
    return response.data;
  },
};

export default recruiterService;
