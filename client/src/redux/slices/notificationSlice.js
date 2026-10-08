import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notificationService.js';
import toast from 'react-hot-toast';

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchNotifications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await notificationService.getNotifications(params);
      return res.data?.data || res.data || res;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchUnreadCountThunk = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationService.getUnreadCount();
      const data = res.data?.data || res.data || res;
      return data.unreadCount ?? 0;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

export const markAsReadThunk = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const res = await notificationService.markAsRead(notificationId);
      const data = res.data?.data || res.data || res;
      return {
        notificationId,
        unreadCount: data.unreadCount,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllAsReadThunk = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllAsRead();
      return 0;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read');
    }
  }
);

export const deleteNotificationThunk = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      const res = await notificationService.deleteNotification(notificationId);
      const data = res.data?.data || res.data || res;
      return {
        notificationId,
        unreadCount: data.unreadCount,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete notification');
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addRealtimeNotification: (state, action) => {
      const newNotif = action.payload;
      if (!newNotif || !newNotif.id) return;

      const exists = state.notifications.some((n) => String(n.id) === String(newNotif.id));
      if (!exists) {
        state.notifications.unshift(newNotif);
        if (!newNotif.read) {
          state.unreadCount += 1;
        }

        // Show toast ONLY for newly received real-time socket events
        toast(`${newNotif.title}\n${newNotif.message}`, {
          duration: 4500,
          icon: '🔔',
          style: {
            background: '#0F172A',
            color: '#F8FAFC',
            border: '1px solid #38BDF8',
            borderRadius: '14px',
            whiteSpace: 'pre-line',
          },
        });
      }
    },
    clearNotificationState: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications || [];
        state.unreadCount = action.payload.unreadCount ?? 0;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Unread Count
      .addCase(fetchUnreadCountThunk.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      // Mark as Read
      .addCase(markAsReadThunk.fulfilled, (state, action) => {
        const { notificationId, unreadCount } = action.payload;
        const target = state.notifications.find((n) => String(n.id) === String(notificationId));
        if (target) {
          target.read = true;
        }
        if (typeof unreadCount === 'number') {
          state.unreadCount = unreadCount;
        } else {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // Mark All as Read
      .addCase(markAllAsReadThunk.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.read = true;
        });
        state.unreadCount = 0;
      })

      // Delete Notification
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const { notificationId, unreadCount } = action.payload;
        const target = state.notifications.find((n) => String(n.id) === String(notificationId));
        const wasUnread = target && !target.read;

        state.notifications = state.notifications.filter((n) => String(n.id) !== String(notificationId));
        if (typeof unreadCount === 'number') {
          state.unreadCount = unreadCount;
        } else if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
  },
});

export const { addRealtimeNotification, clearNotificationState } = notificationSlice.actions;

export {
  fetchNotificationsThunk as fetchNotifications,
  fetchUnreadCountThunk as fetchUnreadCount,
  markAsReadThunk as markNotificationAsRead,
  markAllAsReadThunk as markAllNotificationsAsRead,
  deleteNotificationThunk as deleteNotification,
};

export default notificationSlice.reducer;
