import axiosInstance from '../utils/axios.js';

export const authService = {
  /**
   * Login user with email and password
   * @param {Object} credentials - { email, password }
   */
  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // Ignore logout API failure
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },
};

export default authService;
