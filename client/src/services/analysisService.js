import axiosInstance from '../utils/axios.js';

export const analysisService = {
  /**
   * Initiate public analysis for any GitHub repository URL or owner/repo string
   * @param {string} repositoryOrUrl
   */
  startPublicAnalysis: async (repositoryOrUrl) => {
    try {
      const response = await axiosInstance.post('/analysis/public', { githubUrl: repositoryOrUrl });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const fallbackRes = await axiosInstance.post('/public-analysis', { githubUrl: repositoryOrUrl, repository: repositoryOrUrl });
        return fallbackRes.data;
      }
      throw err;
    }
  },

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
   * Fetch analysis history for the logged-in user with search, filter & pagination params
   * @param {Object} [params]
   */
  getAnalysisHistory: async (params = {}) => {
    const response = await axiosInstance.get('/analysis/history', { params });
    return response.data;
  },

  /**
   * Delete single analysis report document by analysisId
   * @param {string} analysisId
   */
  deleteAnalysis: async (analysisId) => {
    const response = await axiosInstance.delete(`/analysis/${analysisId}`);
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

  /**
   * Download analysis report as PDF blob
   * @param {string} analysisId
   */
  downloadAnalysisPdf: async (analysisId) => {
    const response = await axiosInstance.get(`/analysis/${analysisId}/pdf`, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Generate / enable public share link for analysis report
   * @param {string} analysisId
   */
  generateShareLink: async (analysisId) => {
    const response = await axiosInstance.post(`/analysis/${analysisId}/share`);
    return response.data;
  },

  /**
   * Fetch public shared analysis report by token (No Auth)
   * @param {string} token
   */
  getSharedAnalysis: async (token) => {
    const response = await axiosInstance.get(`/analysis/shared/${token}`);
    return response.data;
  },

  /**
   * Disable public share link for analysis report
   * @param {string} analysisId
   */
  disableShareLink: async (analysisId) => {
    const response = await axiosInstance.delete(`/analysis/${analysisId}/share`);
    return response.data;
  },
};

export default analysisService;


