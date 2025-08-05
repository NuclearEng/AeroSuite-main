import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import { offlineQueue } from './offlineQueue';

// API configuration
const API_CONFIG = {
  baseURL: 'https://api.aerosuite.com',
  version: 'v1',
  timeout: 30000,
};

// Request interceptor to add auth token
axios.interceptors.request.use(
  async (config) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    
    // If offline, queue the request and throw an error
    if (!netInfo.isConnected) {
      if (config.method !== 'get') {
        offlineQueue.addToQueue({
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers,
        });
        throw new Error('OFFLINE_QUEUED');
      } else {
        throw new Error('OFFLINE');
      }
    }
    
    // Add auth token to request
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add device info
    config.headers['X-Device-Platform'] = Platform.OS;
    config.headers['X-Device-Version'] = Platform.Version;
    config.headers['X-App-Version'] = '1.0.0'; // Should be dynamic in real app
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.baseURL}/${API_CONFIG.version}/auth/refresh`, {
            refreshToken,
          });
          
          // Save new tokens
          await AsyncStorage.setItem('authToken', response.data.token);
          await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
          
          // Retry the original request
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, logout user
        await AsyncStorage.removeItem('authToken');
        await AsyncStorage.removeItem('refreshToken');
        // In a real app, you would dispatch a logout action here
      }
    }
    
    return Promise.reject(error);
  }
);

class ApiService {
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise} - Response promise
   */
  static async get(endpoint, params = {}) {
    try {
      const response = await axios.get(
        `${API_CONFIG.baseURL}/${API_CONFIG.version}/${endpoint}`,
        {
          params,
          timeout: API_CONFIG.timeout,
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise} - Response promise
   */
  static async post(endpoint, data = {}) {
    try {
      const response = await axios.post(
        `${API_CONFIG.baseURL}/${API_CONFIG.version}/${endpoint}`,
        data,
        {
          timeout: API_CONFIG.timeout,
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise} - Response promise
   */
  static async put(endpoint, data = {}) {
    try {
      const response = await axios.put(
        `${API_CONFIG.baseURL}/${API_CONFIG.version}/${endpoint}`,
        data,
        {
          timeout: API_CONFIG.timeout,
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} - Response promise
   */
  static async delete(endpoint) {
    try {
      const response = await axios.delete(
        `${API_CONFIG.baseURL}/${API_CONFIG.version}/${endpoint}`,
        {
          timeout: API_CONFIG.timeout,
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Upload a file
   * @param {string} endpoint - API endpoint
   * @param {Object} file - File object { uri, name, type }
   * @param {Object} additionalData - Additional form data
   * @returns {Promise} - Response promise
   */
  static async uploadFile(endpoint, file, additionalData = {}) {
    try {
      const formData = new FormData();
      
      // Add file to form data
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'file.jpg',
        type: file.type || 'image/jpeg',
      });
      
      // Add additional data
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
      
      const response = await axios.post(
        `${API_CONFIG.baseURL}/${API_CONFIG.version}/${endpoint}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // Longer timeout for uploads
        }
      );
      
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @throws {Error} - Enhanced error
   */
  static handleError(error) {
    // Special handling for offline errors
    if (error.message === 'OFFLINE_QUEUED') {
      return { queued: true, message: 'Request queued for when connection is restored' };
    }
    
    if (error.message === 'OFFLINE') {
      throw new Error('No internet connection available');
    }
    
    // Extract error details from response
    const errorData = error.response?.data;
    const enhancedError = new Error(
      errorData?.message || error.message || 'An unknown error occurred'
    );
    
    enhancedError.status = error.response?.status;
    enhancedError.code = errorData?.error?.code || 'UNKNOWN_ERROR';
    enhancedError.originalError = error;
    
    throw enhancedError;
  }
  
  /**
   * Process any pending offline requests
   */
  static async processPendingRequests() {
    const pendingRequests = offlineQueue.getQueue();
    if (pendingRequests.length === 0) return;
    
    // Process each request
    for (const request of pendingRequests) {
      try {
        await axios({
          url: request.url,
          method: request.method,
          data: request.data,
          headers: request.headers,
        });
        
        // Remove from queue if successful
        offlineQueue.removeFromQueue(request.id);
      } catch (error) {
        console.error('Failed to process offline request:', error);
      }
    }
  }
}

// Listen for network status changes
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    // When connection is restored, process pending requests
    ApiService.processPendingRequests();
  }
});

export default ApiService; 