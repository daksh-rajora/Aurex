import axiosInstance from '../utils/axios.js';

export const performanceService = {
  /**
   * Fetch aggregate performance overview metrics
   */
  getPerformanceOverview: async () => {
    const response = await axiosInstance.get('/performance/overview');
    return response.data?.data || response.data;
  },

  /**
   * Fetch list of repositories analyzed with performance data
   */
  getPerformanceRepositories: async () => {
    const response = await axiosInstance.get('/performance/repositories');
    return response.data?.data || response.data;
  },

  /**
   * Get detailed performance report for a specific analysis
   * @param {string} analysisId
   */
  getPerformanceReport: async (analysisId) => {
    const response = await axiosInstance.get(`/performance/${analysisId}`);
    return response.data?.data || response.data;
  },

  /**
   * Get latest performance report for a repository
   * @param {string} owner
   * @param {string} repo
   */
  getLatestPerformance: async (owner, repo) => {
    const response = await axiosInstance.get(`/performance/latest/${owner}/${repo}`);
    return response.data?.data || response.data;
  },
};

export default performanceService;
