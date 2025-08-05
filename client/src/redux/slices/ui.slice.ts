import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeVariant } from '../../theme/themeConfig';

// Define types
export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  autoHide?: boolean;
  duration?: number;
}

export interface UiState {
  darkMode: boolean;
  themeVariant: ThemeVariant;
  sidebarOpen: boolean;
  notifications: Notification[];
  isLoading: Record<string, boolean>;
}

// Initial state
const initialState: UiState = {
  darkMode: localStorage.getItem('darkMode') === 'true',
  themeVariant: (localStorage.getItem('themeVariant') as ThemeVariant) || 'blue',
  sidebarOpen: localStorage.getItem('sidebarOpen') !== 'false',
  notifications: [],
  isLoading: {},
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', String(state.darkMode));
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', String(state.darkMode));
    },
    setThemeVariant: (state, action: PayloadAction<ThemeVariant>) => {
      state.themeVariant = action.payload;
      localStorage.setItem('themeVariant', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      localStorage.setItem('sidebarOpen', String(state.sidebarOpen));
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
      localStorage.setItem('sidebarOpen', String(state.sidebarOpen));
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({
        ...action.payload,
        id,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter((notification) => notification.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      const { key, isLoading } = action.payload;
      state.isLoading[key] = isLoading;
    },
  },
});

export const {
  toggleDarkMode,
  setDarkMode,
  setThemeVariant,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer; 