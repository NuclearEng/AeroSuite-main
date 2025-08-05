import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAuthHeader } from '../utils/auth';

// API configuration
interface ApiConfig {
  baseURL: string;
  version: string;
  timeout: number;
  headers: Record<string, string>;
}

class VersionedApiService {
  private config: ApiConfig;
  
  constructor(config?: Partial<ApiConfig>) {
    this.config = {
      baseURL: process.env.REACT_APP_API_URL || '/api',
      version: process.env.REACT_APP_API_VERSION || 'v1',
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...config,
    };
  }
  
  /**
   * Create an axios request config with authentication and version headers
   * @param config - Additional axios config
   * @returns Axios request config
   */
  private createRequestConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
    return {
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        ...this.config.headers,
        ...getAuthHeader(),
        'X-API-Version': this.config.version,
      },
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
      return response.data;
    } catch (error) {
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
      return response.data;
    } catch (error) {
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
      return response.data;
    } catch (error) {
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
      return response.data;
    } catch (error) {
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
   * @throws Enhanced error object
   */
  private handleError(error: AxiosError): never {
    // Check for API version deprecation warning
    const deprecationWarning = error.response?.headers?.['warning'];
    const sunsetDate = error.response?.headers?.['x-api-sunset'];
    
    if (deprecationWarning) {
      console.warn(`API Deprecation Warning: ${deprecationWarning}`);
    }
    
    if (sunsetDate) {
      console.warn(`API Sunset Date: ${sunsetDate}`);
    }
    
    // Extract error details from response
    const errorData = error.response?.data as any;
    const enhancedError: any = new Error(
      errorData?.message || error.message || 'An unknown error occurred'
    );
    
    enhancedError.status = error.response?.status;
    enhancedError.code = errorData?.error?.code || 'UNKNOWN_ERROR';
    enhancedError.originalError = error;
    
    throw enhancedError;
  }
  
  /**
   * Set the API version to use
   * @param version - API version (e.g., 'v1', 'v2')
   */
  public setVersion(version: string): void {
    this.config.version = version;
  }
  
  /**
   * Get the current API version
   * @returns Current API version
   */
  public getVersion(): string {
    return this.config.version;
  }
  
  /**
   * Check if an API version is supported
   * @returns Promise with supported versions info
   */
  public async getSupportedVersions(): Promise<any> {
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
      return response.data;
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }
}

// Create and export default instance
const versionedApi = new VersionedApiService();
export default versionedApi;

// Export class for custom instances
export { VersionedApiService }; 