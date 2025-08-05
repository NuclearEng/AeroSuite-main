/**
 * Feature Flags Redux Slice
 * 
 * This slice manages the feature flags state in the Redux store.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FeatureFlag } from '../../services/featureFlags.service';

// Define the state structure
export interface FeatureFlagsState {
  flags: Record<string, FeatureFlag>;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

// Initial state
const initialState: FeatureFlagsState = {
  flags: {},
  loading: false,
  error: null,
  initialized: false
};

// Create the slice
const featureFlagsSlice = createSlice({
  name: 'featureFlags',
  initialState,
  reducers: {
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Set all flags
    setFlags: (state, action: PayloadAction<Record<string, FeatureFlag>>) => {
      state.flags = action.payload;
      state.initialized = true;
      state.loading = false;
      state.error = null;
    },
    
    // Add a new flag
    addFlag: (state, action: PayloadAction<{ key: string; flag: FeatureFlag }>) => {
      const { key, flag } = action.payload;
      state.flags[key] = flag;
    },
    
    // Update an existing flag
    updateFlag: (state, action: PayloadAction<{ key: string; flag: Partial<FeatureFlag> }>) => {
      const { key, flag } = action.payload;
      if (state.flags[key]) {
        state.flags[key] = { ...state.flags[key], ...flag };
      }
    },
    
    // Toggle a flag's enabled state
    toggleFlag: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      if (state.flags[key]) {
        state.flags[key].enabled = !state.flags[key].enabled;
      }
    },
    
    // Remove a flag
    removeFlag: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      delete state.flags[key];
    },
    
    // Reset the state
    resetFeatureFlags: () => initialState
  }
});

// Export actions
export const {
  setLoading,
  setError,
  setFlags,
  addFlag,
  updateFlag,
  toggleFlag,
  removeFlag,
  resetFeatureFlags
} = featureFlagsSlice.actions;

// Export the reducer
export default featureFlagsSlice.reducer; 