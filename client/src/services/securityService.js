import axiosInstance from '../utils/axios.js';

export const securityService = {
  /**
   * Fetch aggregated security overview metrics from MongoDB
   */
  getSecurityOverview: async () => {
    const response = await axiosInstance.get('/security/overview');
    return response.data?.data || response.data;
  },

  /**
   * Initiate a security vulnerability and SAST scan
   * @param {Object} payload - { owner, repo } or { githubUrl }
   */
  startSecurityScan: async (payload) => {
    const response = await axiosInstance.post('/security/scan', payload);
    return response.data?.data || response.data;
  },

  /**
   * Fetch past security scans with pagination and filters
   * @param {Object} [params] - { repository, status, page, limit }
   */
  getSecurityScans: async (params = {}) => {
    const response = await axiosInstance.get('/security/scans', { params });
    return response.data?.data || response.data;
  },

  /**
   * Get single detailed security scan report by scanId
   * @param {string} scanId
   */
  getSecurityScanById: async (scanId) => {
    const response = await axiosInstance.get(`/security/scans/${scanId}`);
    return response.data?.data || response.data;
  },

  /**
   * Get the latest security scan for a specific repository
   * @param {string} owner
   * @param {string} repo
   */
  getLatestScanForRepo: async (owner, repo) => {
    const response = await axiosInstance.get(`/security/latest/${owner}/${repo}`);
    return response.data?.data || response.data;
  },
};

export default securityService;
