import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { handleApiError } from '../utils/errorHandling';

// Constants
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const API_TIMEOUT = Number(process.env.REACT_APP_API_TIMEOUT) || 30000;

// Types
export interface ApiConfig {
  version: string;
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

class ApiService {
  private config: ApiConfig;
  private instance: AxiosInstance;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      version: '1',
      baseURL: API_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1',
        'Accept': 'application/json'
      },
      ...config,
    };

    this.instance = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: this.config.headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.response.use(
      (response) => response,
      (error) => {
        const appError = handleApiError(error);
        throw appError;
      }
    );
  }

  public async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  public async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  public async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  public async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  public async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

const api = new ApiService();
export default api;