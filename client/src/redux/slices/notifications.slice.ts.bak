import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define notification type
export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  read: boolean;
  createdAt: string;
  link?: string;
  resourceType?: string;
  resourceId?: string;
}

// Define notifications state
export interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/notifications');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/notifications/read-all');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }
);

// Notifications slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Add a new notification
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    
    // Set unread count (used by real-time notifications)
    setUnreadCount: {
      reducer: (state, action: PayloadAction<number>) => {
        state.unreadCount = action.payload;
      },
      prepare: (value: number | ((prev: number) => number)) => {
        if (typeof value === 'function') {
          // If value is a function, call it with the current value from localStorage
          const currentCount = parseInt(localStorage.getItem('unreadNotifications') || '0', 10);
          const newCount = value(currentCount);
          localStorage.setItem('unreadNotifications', newCount.toString());
          return { payload: newCount };
        }
        // Otherwise, just use the value directly
        localStorage.setItem('unreadNotifications', value.toString());
        return { payload: value };
      },
    },
    
    // Clear all notifications
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder.addCase(fetchNotifications.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
      localStorage.setItem('unreadNotifications', action.payload.unreadCount.toString());
    });
    builder.addCase(fetchNotifications.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Mark as read
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const index = state.items.findIndex((item) => item._id === action.payload._id);
      if (index !== -1) {
        state.items[index].read = true;
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
          localStorage.setItem('unreadNotifications', state.unreadCount.toString());
        }
      }
    });
    
    // Mark all as read
    builder.addCase(markAllAsRead.fulfilled, (state) => {
      state.items.forEach((item) => {
        item.read = true;
      });
      state.unreadCount = 0;
      localStorage.setItem('unreadNotifications', '0');
    });
  },
});

export const { addNotification, setUnreadCount, clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer; 