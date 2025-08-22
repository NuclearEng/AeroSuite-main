/**
 * Configuration utility for the AeroSuite application
 * Provides access to environment-specific configuration settings
 */

// Default configuration
const defaultConfig = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://api.aerosuite.com',
  websocketUrl: process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.aerosuite.com/ws',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  features: {
    realTimeNotifications: true,
    offlineMode: true,
    analytics: true,
  },
};

// Configuration by environment
const environmentConfigs: Record<string, Partial<typeof defaultConfig>> = {
  development: {
    apiUrl: 'http://localhost:5000',
    websocketUrl: 'ws://localhost:5000/ws',
  },
  test: {
    apiUrl: 'http://localhost:5000',
    websocketUrl: 'ws://localhost:5000/ws',
  },
  production: {
    // Production uses the default config
  },
};

// Merge default config with environment-specific config
const config = {
  ...defaultConfig,
  ...(environmentConfigs[process.env.NODE_ENV || 'development'] || {}),
};

/**
 * Get the application configuration
 * @returns Application configuration
 */
export const getConfig = () => {
  return config;
};

/**
 * Get a specific configuration value
 * @param key Configuration key
 * @returns Configuration value
 */
export const getConfigValue = <K extends keyof typeof config>(key: K): typeof config[K] => {
  return config[key];
};

/**
 * Check if a feature is enabled
 * @param feature Feature name
 * @returns True if the feature is enabled
 */
export const isFeatureEnabled = (feature: keyof typeof config.features): boolean => {
  return !!config.features[feature];
};

export default {
  getConfig,
  getConfigValue,
  isFeatureEnabled,
}; 