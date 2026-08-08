import axiosInstance from '../utils/axios.js';

export const analysisService = {
  /**
   * Initiate analysis for a repository with payload body
   * @param {Object} payload - { repositoryId, repositoryName, owner, githubUrl, language }
   */
  startAnalysisApi: async (payload) => {
    const response = await axiosInstance.post('/analysis/start', payload);
    return response.data;
  },

  /**
   * Initiate analysis for a repository with URL params
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   */
  startAnalysis: async (owner, repo) => {
    const response = await axiosInstance.post(`/analysis/${owner}/${repo}`);
    return response.data;
  },

  /**
   * Execute AI analysis on an existing analysis record
   * @param {string} analysisId
   * @param {string} [provider]
   */
  runAIAnalysis: async (analysisId, provider = 'openrouter') => {
    const response = await axiosInstance.post(`/analysis/${analysisId}/run`, { provider });
    return response.data;
  },

  /**
   * Fetch analysis history for the logged-in user
   */
  getAnalysisHistory: async () => {
    const response = await axiosInstance.get('/analysis/history');
    return response.data;
  },

  /**
   * Get single analysis report summary
   * @param {string} analysisId
   */
  getSingleAnalysis: async (analysisId) => {
    const response = await axiosInstance.get(`/analysis/${analysisId}`);
    return response.data;
  },

  /**
   * Get full detailed AI report document
   * @param {string} analysisId
   */
  getAnalysisReport: async (analysisId) => {
    const response = await axiosInstance.get(`/analysis/${analysisId}/report`);
    return response.data;
  },
};

export default analysisService;
