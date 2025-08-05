import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/auth.slice';
import supplierReducer from './slices/supplier.slice';
import inspectionReducer from './slices/inspection.slice';
import uiReducer from './slices/ui.slice';
import dashboardReducer from './slices/dashboard.slice';
import notificationsReducer from './slices/notifications.slice';
import featureFlagsReducer from './slices/featureFlags.slice';
import appReducer from './slices/app.slice';

/**
 * Configure Redux store with performance optimizations
 */
const rootReducer = combineReducers({
  app: appReducer,
  auth: authReducer,
  supplier: supplierReducer,
  inspection: inspectionReducer,
  ui: uiReducer,
  dashboard: dashboardReducer,
  notifications: notificationsReducer,
  featureFlags: featureFlagsReducer
});

const store = configureStore({
  reducer: rootReducer,
  // Enable Redux DevTools only in development
  devTools: process.env.NODE_ENV !== 'production',
  // Middleware customization for better performance
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Enable serializable check in development only
      serializableCheck: process.env.NODE_ENV !== 'production',
      // Enable immutability check in development only
      immutableCheck: process.env.NODE_ENV !== 'production',
    }),
});

// Export types for better TypeScript integration
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// Create typed hooks for better type safety
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export { store };
export default store; 