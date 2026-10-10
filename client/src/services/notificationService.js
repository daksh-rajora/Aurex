import axiosInstance from '../utils/axios.js';

export const notificationService = {
  /**
   * Fetch user notifications with pagination & unread filter
   * @param {Object} [params] - { page, limit, unreadOnly }
   */
  getNotifications: async (params = {}) => {
    const response = await axiosInstance.get('/notifications', { params });
    return response.data;
  },

  /**
   * Fetch user's unread notification count
   */
  getUnreadCount: async () => {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark single notification as read
   * @param {string} notificationId
   */
  markAsRead: async (notificationId) => {
    const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const response = await axiosInstance.patch('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete single notification
   * @param {string} notificationId
   */
  deleteNotification: async (notificationId) => {
    const response = await axiosInstance.delete(`/notifications/${notificationId}`);
    return response.data;
  },
};

export default notificationService;
