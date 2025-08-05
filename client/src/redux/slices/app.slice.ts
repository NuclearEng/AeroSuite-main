/**
 * App Redux Slice
 * 
 * Manages application-wide state including API version information
 * 
 * @task TS376 - API versioning strategy implementation
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// API version warning interface
export interface ApiVersionWarning {
  message: string;
  version: string;
  sunset: string | null;
}

// App state interface
interface AppState {
  apiVersion: string;
  apiVersionWarning: ApiVersionWarning | null;
  showVersionWarningBanner: boolean;
  migrationGuideUrl: string | null;
}

// Initial state
const initialState: AppState = {
  apiVersion: process.env.REACT_APP_API_VERSION || 'v1',
  apiVersionWarning: null,
  showVersionWarningBanner: false,
  migrationGuideUrl: null,
};

// Create the app slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    /**
     * Set the current API version
     */
    setApiVersion: (state, action: PayloadAction<string>) => {
      state.apiVersion = action.payload;
    },
    
    /**
     * Set API version warning
     */
    setApiVersionWarning: (state, action: PayloadAction<ApiVersionWarning>) => {
      state.apiVersionWarning = action.payload;
      state.showVersionWarningBanner = true;
      
      // Generate migration guide URL
      const currentVersion = state.apiVersion;
      const latestVersion = action.payload.version;
      if (currentVersion !== latestVersion) {
        state.migrationGuideUrl = `/api/versions/migration/${currentVersion}/${latestVersion}`;
      }
    },
    
    /**
     * Dismiss API version warning banner
     */
    dismissVersionWarningBanner: (state) => {
      state.showVersionWarningBanner = false;
    },
    
    /**
     * Clear API version warning
     */
    clearApiVersionWarning: (state) => {
      state.apiVersionWarning = null;
      state.showVersionWarningBanner = false;
      state.migrationGuideUrl = null;
    },
  },
});

// Export actions
export const {
  setApiVersion,
  setApiVersionWarning,
  dismissVersionWarningBanner,
  clearApiVersionWarning,
} = appSlice.actions;

// Export reducer
export default appSlice.reducer; 