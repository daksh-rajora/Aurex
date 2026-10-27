import axiosInstance from '../utils/axios.js';

export const reportService = {
  /**
   * Fetch aggregate summary statistics of repository reports for the dashboard cards
   */
  getReportsSummary: async () => {
    const response = await axiosInstance.get('/report/summary');
    return response.data?.data || response.data;
  },

  /**
   * Download repository analysis PDF report as binary blob
   * @param {string} analysisId
   */
  downloadPdf: async (analysisId) => {
    const response = await axiosInstance.get(`/report/${analysisId}/download`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default reportService;
