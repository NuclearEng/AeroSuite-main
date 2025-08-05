import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import clientCache from './cacheService';
import { getAuthHeader } from '../utils/auth';
import { store } from '../redux/store';
import { setApiVersion, setApiVersionWarning } from '../redux/slices/appSlice';

// API configuration
interface ApiConfig {
  baseURL: string;
  version: string;
  timeout: number;
  headers: Record<string, string>;
  useVendorMediaType: boolean;
}

// Version compatibility status
export enum VersionCompatibility {
  FULL = 'full',
  PARTIAL = 'partial',
  NONE = 'none'
}

// Version information
export interface VersionInfo {
  version: string;
  url: string;
  isDefault: boolean;
  releaseDate: string;
  deprecationDate: string | null;
  sunsetDate: string | null;
  status: 'active' | 'deprecated' | 'inactive';
  message: string;
}

// API version metadata
export interface ApiVersionMetadata {
  currentVersion: string;
  supportedVersions: VersionInfo[];
  defaultVersion: string;
}

// API service class
class ApiService {
  private config: ApiConfig;
  private versionMetadata: ApiVersionMetadata | null = null;
  private versionCheckPromise: Promise<ApiVersionMetadata> | null = null;
  
  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseURL: process.env.REACT_APP_API_URL || '/api',
      version: process.env.REACT_APP_API_VERSION || 'v1',
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      useVendorMediaType: true,
      ...config,
    };

    // Initialize version check
    this.checkApiVersion();
  }
  
  /**
   * Create an axios request config with authentication and version headers
   * @param config - Additional axios config
   * @returns Axios request config
   */
  private createRequestConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
    const headers = {
      ...this.config.headers,
      ...getAuthHeader(),
      'X-API-Version': this.config.version,
    };

    // Use vendor media type if enabled
    if (this.config.useVendorMediaType) {
      headers['Accept'] = `application/vnd.aerosuite.${this.config.version}+json`;
    }

    return {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers,
      ...config,
    };
  }
  
  /**
   * Make a GET request
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @param config - Additional axios config
   * @returns Promise with response data
   */
  public async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.get(
        this.getVersionedEndpoint(endpoint),
        this.createRequestConfig({
          params,
          ...config,
        })
      );
      
      this.checkResponseVersionHeaders(response);
      return response.data;
    } catch (_error) {
      return this.handleError(error as AxiosError);
    }
  }
  
  /**
   * Make a POST request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param config - Additional axios config
   * @returns Promise with response data
   */
  public async post<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.post(
        this.getVersionedEndpoint(endpoint),
        data,
        this.createRequestConfig(config)
      );
      
      this.checkResponseVersionHeaders(response);
      return response.data;
    } catch (_error) {
      return this.handleError(error as AxiosError);
    }
  }
  
  /**
   * Make a PUT request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param config - Additional axios config
   * @returns Promise with response data
   */
  public async put<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.put(
        this.getVersionedEndpoint(endpoint),
        data,
        this.createRequestConfig(config)
      );
      
      this.checkResponseVersionHeaders(response);
      return response.data;
    } catch (_error) {
      return this.handleError(error as AxiosError);
    }
  }
  
  /**
   * Make a DELETE request
   * @param endpoint - API endpoint
   * @param config - Additional axios config
   * @returns Promise with response data
   */
  public async delete<T = any>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.delete(
        this.getVersionedEndpoint(endpoint),
        this.createRequestConfig(config)
      );
      
      this.checkResponseVersionHeaders(response);
      return response.data;
    } catch (_error) {
      return this.handleError(error as AxiosError);
    }
  }
  
  /**
   * Make a PATCH request
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param config - Additional axios config
   * @returns Promise with response data
   */
  public async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.patch(
        this.getVersionedEndpoint(endpoint),
        data,
        this.createRequestConfig(config)
      );
      
      this.checkResponseVersionHeaders(response);
      return response.data;
    } catch (_error) {
      return this.handleError(error as AxiosError);
    }
  }
  
  /**
   * Get a versioned endpoint URL
   * @param endpoint - API endpoint
   * @returns Versioned endpoint URL
   */
  private getVersionedEndpoint(endpoint: string): string {
    // If the endpoint already starts with a version (v1, v2, etc.), use it as is
    if (/^\/v\d+\//i.test(endpoint)) {
      return endpoint;
    }
    
    // Otherwise, prepend the configured version
    return `/${this.config.version}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }
  
  /**
   * Handle API errors
   * @param error - Axios error
   * @returns Rejected promise with error details
   */
  private handleError(error: AxiosError): Promise<never> {
    // Check for API version issues
    if (error.response) {
      const apiVersion = error.response.headers['x-api-version'];
      const warning = error.response.headers['warning'];
      const deprecation = error.response.headers['deprecation'];
      const sunset = error.response.headers['sunset'];

      // Handle version warnings
      if (apiVersion && (warning || deprecation)) {
        const warningMessage = warning || `API version ${apiVersion} is deprecated`;
        store.dispatch(setApiVersionWarning({
          message: warningMessage,
          version: apiVersion,
          sunset: sunset || null
        }));
      }
    }

    // Standard error handling
    const errorResponse = {
      status: error.response?.status || 500,
      message: error.message || 'Unknown error',
      data: error.response?.data || {},
    };

    return Promise.reject(errorResponse);
  }
  
  /**
   * Set the API version to use
   * @param version - API version (e.g., 'v1', 'v2')
   */
  public setVersion(version: string): void {
    this.config.version = version;
    store.dispatch(setApiVersion(version));
  }
  
  /**
   * Get the current API version
   * @returns Current API version
   */
  public getVersion(): string {
    return this.config.version;
  }
  
  /**
   * Toggle vendor media type usage
   * @param useVendorMediaType - Whether to use vendor media type
   */
  public setUseVendorMediaType(useVendorMediaType: boolean): void {
    this.config.useVendorMediaType = useVendorMediaType;
  }
  
  /**
   * Check API version information
   * @returns Promise with API version metadata
   */
  public async checkApiVersion(): Promise<ApiVersionMetadata> {
    // Return cached metadata if available
    if (this.versionMetadata) {
      return Promise.resolve(this.versionMetadata);
    }
    
    // Return existing promise if already checking
    if (this.versionCheckPromise) {
      return this.versionCheckPromise;
    }
    
    // Create new promise for version check
    this.versionCheckPromise = new Promise<ApiVersionMetadata>(async (resolve, reject) => {
      try {
        // Use direct axios call to avoid version prefix
        const response = await axios.get(
          `${this.config.baseURL}`,
          {
            headers: {
              ...this.config.headers,
              ...getAuthHeader(),
            },
          }
        );
        
        const data = response.data;
        this.versionMetadata = {
          currentVersion: data.currentVersion,
          supportedVersions: data.supportedVersions,
          defaultVersion: data.supportedVersions.find((v: VersionInfo) => v.isDefault)?.version || 'v1'
        };
        
        // Update current version if needed
        if (this.config.version !== data.currentVersion) {
          this.config.version = data.currentVersion;
          store.dispatch(setApiVersion(data.currentVersion));
        }
        
        resolve(this.versionMetadata);
      } catch (_error) {
        reject(error);
      } finally {
        this.versionCheckPromise = null;
      }
    });
    
    return this.versionCheckPromise;
  }
  
  /**
   * Get API version compatibility information
   * @param clientVersion - Client API version
   * @param serverVersion - Server API version
   * @returns Promise with compatibility information
   */
  public async getVersionCompatibility(clientVersion: string, serverVersion: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.config.baseURL}/versions/compatibility/${clientVersion}/${serverVersion}`,
        {
          headers: {
            ...this.config.headers,
            ...getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (_error) {
      return this.handleError(error as AxiosError);
    }
  }
  
  /**
   * Get migration guide between API versions
   * @param fromVersion - Source API version
   * @param toVersion - Target API version
   * @returns Promise with migration guide
   */
  public async getMigrationGuide(fromVersion: string, toVersion: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.config.baseURL}/versions/migration/${fromVersion}/${toVersion}`,
        {
          headers: {
            ...this.config.headers,
            ...getAuthHeader(),
          },
        }
      );
      return response.data;
    } catch (_error) {
      return this.handleError(error as AxiosError);
    }
  }
  
  /**
   * Check response headers for API version information
   * @param response - Axios response
   */
  private checkResponseVersionHeaders(response: AxiosResponse): void {
    const apiVersion = response.headers['x-api-version'];
    const warning = response.headers['warning'];
    const deprecation = response.headers['deprecation'];
    const sunset = response.headers['sunset'];
    
    // Update current API version if it's different
    if (apiVersion && apiVersion !== this.config.version) {
      this.config.version = apiVersion;
      store.dispatch(setApiVersion(apiVersion));
    }
    
    // Handle version warnings
    if (apiVersion && (warning || deprecation)) {
      const warningMessage = warning || `API version ${apiVersion} is deprecated`;
      store.dispatch(setApiVersionWarning({
        message: warningMessage,
        version: apiVersion,
        sunset: sunset || null
      }));
    }
  }
}

// Create and export default instance
const apiService = new ApiService();
export default apiService;

// Export class for custom instances
export { ApiService };

// Cache configuration
const CACHE_ENABLED = process.env.REACT_APP_ENABLE_CLIENT_CACHE !== 'false';
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Error types
export interface ApiError {
  message: string;
  errors?: Record<string, string>;
  code?: string;
  status?: number;
}

// API response type
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Error response type
interface ApiErrorResponse {
  success: boolean;
  message: string;
  code?: string;
  errors?: Record<string, string>;
}

// Cache options type
export interface CacheOptions {
  useCache?: boolean;
  ttl?: number;
  cacheKey?: string;
}

/**
 * Standardized API error handler
 * Creates consistent error objects from axios errors
 */
const apiErrorHandler = (error: AxiosError): ApiError => {
  const apiError: ApiError = {
    message: 'An unexpected error occurred',
    status: error.response?.status || 500,
  };
  
  if (error.response?.data) {
    const errorData = error.response.data as ApiErrorResponse;
    apiError.message = errorData.message || apiError.message;
    apiError.errors = errorData.errors;
    apiError.code = errorData.code;
  }
  
  return apiError;
};

/**
 * Generate a cache key for an API request
 */
const generateCacheKey = (url: string, config?: AxiosRequestConfig): string => {
  const method = config?.method || 'GET';
  const params = config?.params ? JSON.stringify(config.params) : '';
  const data = config?.data ? JSON.stringify(config.data) : '';
  
  return `${method}:${url}:${params}:${data}`;
};

// Axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Add token to headers if it exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorData = error.response?.data as ApiErrorResponse;
      
      // You can implement token refresh logic here if needed
      // For now, just log the user out
      if (errorData?.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('token');
        window.location.href = '/login?expired=true';
        return Promise.reject(apiErrorHandler(error));
      }
    }

    // Return standardized error format
    return Promise.reject(apiErrorHandler(error));
  }
);

// Generic request method with caching
const request = async <T>(
  config: AxiosRequestConfig, 
  cacheOptions: CacheOptions = {}
): Promise<T> => {
  // Extract cache options with defaults
  const { 
    useCache = CACHE_ENABLED, 
    ttl = DEFAULT_CACHE_TTL,
    cacheKey
  } = cacheOptions;
  
  // Only use cache for GET requests
  const canUseCache = useCache && (!config.method || config.method === 'GET');
  
  // Generate cache key if caching is enabled
  const key = canUseCache ? (cacheKey || generateCacheKey(config.url || '', config)) : '';
  
  try {
    // Try to get from cache first if caching is enabled
    if (canUseCache && key) {
      const cachedData = clientCache.get<T>(key);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Make the actual request
    const response: AxiosResponse<ApiResponse<T>> = await apiClient(config);
    const responseData = response.data.data;
    
    // Cache the response if caching is enabled
    if (canUseCache && key) {
      clientCache.set<T>(key, responseData, ttl);
    }
    
    return responseData;
  } catch (_error) {
    if (axios.isAxiosError(error)) {
      throw apiErrorHandler(error);
    }
    throw error;
  }
};

/**
 * Clear all cache entries that match a URL pattern
 * @param urlPattern Regular expression pattern to match URLs
 * @returns Number of cache entries cleared
 */
export const clearCacheByPattern = (urlPattern: RegExp): number => {
  return clientCache.clearPattern(urlPattern);
};

/**
 * Clear the entire cache
 */
export const clearAllCache = (): void => {
  clientCache.clear();
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return clientCache.getStats();
};

// Enhanced HTTP methods with caching
const api = {
  get: <T>(url: string, config?: AxiosRequestConfig, cacheOptions?: CacheOptions) => 
    request<T>({ ...config, method: 'GET', url }, cacheOptions),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    // Invalidate cache for related GET endpoints after POST
    const pattern = new RegExp(`^GET:${url.split('/').slice(0, -1).join('/')}.*`);
    clearCacheByPattern(pattern);
    
    return request<T>({ ...config, method: 'POST', url, data });
  },
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    // Invalidate cache for related GET endpoints after PUT
    const pattern = new RegExp(`^GET:${url}.*`);
    clearCacheByPattern(pattern);
    
    return request<T>({ ...config, method: 'PUT', url, data });
  },
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => {
    // Invalidate cache for related GET endpoints after PATCH
    const pattern = new RegExp(`^GET:${url}.*`);
    clearCacheByPattern(pattern);
    
    return request<T>({ ...config, method: 'PATCH', url, data });
  },
    
  delete: <T>(url: string, config?: AxiosRequestConfig) => {
    // Invalidate cache for related GET endpoints after DELETE
    const pattern = new RegExp(`^GET:${url.split('/').slice(0, -1).join('/')}.*`);
    clearCacheByPattern(pattern);
    
    return request<T>({ ...config, method: 'DELETE', url });
  },
};

export default api;

/**
 * Fetch performance metrics data
 * @returns {Promise<any>} Performance metrics data
 */
export const fetchPerformanceMetrics = async () => {
  try {
    const response = await api.get('/api/performance/metrics');
    return response.data;
  } catch (_error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
}; 