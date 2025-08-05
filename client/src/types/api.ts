import { AxiosResponse } from 'axios';

// Define a typed API response interface
export interface ApiResponse<T = any> extends AxiosResponse<T> {
  data: T;
}

// Re-export axios types for convenience
export type { AxiosRequestConfig, AxiosError } from 'axios';