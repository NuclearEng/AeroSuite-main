import axios from 'axios';
import apiClient, { get, post, put, patch, del, getPaginated } from './apiClient';
import { ApiResponse, PaginatedResponse } from '../types/api.types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Setup default axios create mock
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('GET requests', () => {
    it('should make a GET request and return data on success', async () => {
      const mockResponse: ApiResponse<{ id: number; name: string }> = {
        status: 'success',
        data: { id: 1, name: 'Test' },
        timestamp: new Date().toISOString()
      };
      
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await get<{ id: number; name: string }>('/test');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/test', expect.any(Object));
      expect(result).toEqual({ id: 1, name: 'Test' });
    });
    
    it('should handle error responses properly', async () => {
      const mockErrorResponse = {
        response: {
          status: 400,
          data: {
            status: 'error',
            message: 'Bad request',
            errorCode: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString()
          }
        }
      };
      
      mockedAxios.get.mockRejectedValueOnce(mockErrorResponse);
      
      await expect(get('/test')).rejects.toMatchObject({
        message: 'Bad request',
        code: 'VALIDATION_ERROR',
        status: 400
      });
    });
    
    it('should add authorization header when token exists', async () => {
      const mockResponse: ApiResponse<{ id: number }> = {
        status: 'success',
        data: { id: 1 },
        timestamp: new Date().toISOString()
      };
      
      localStorageMock.setItem('auth_token', 'test-token');
      
      // Mock the interceptor
      const requestInterceptor = mockedAxios.interceptors.request.use as jest.Mock;
      let interceptorFn: any;
      
      requestInterceptor.mockImplementation((fn) => {
        interceptorFn = fn;
        return 1; // Return interceptor ID
      });
      
      // Initialize the client to trigger interceptor setup
      await import('./apiClient');
      
      // Mock the axios get call
      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });
      
      // Call the API
      await get('/test');
      
      // Test that the interceptor adds the auth header
      const config = { headers: {} };
      const modifiedConfig = interceptorFn(config);
      
      expect(modifiedConfig.headers.Authorization).toBe('Bearer test-token');
    });
  });

  describe('POST requests', () => {
    it('should make a POST request with data', async () => {
      const mockResponse: ApiResponse<{ id: number }> = {
        status: 'success',
        data: { id: 1 },
        timestamp: new Date().toISOString()
      };
      
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });
      
      const payload = { name: 'Test' };
      const result = await post<{ id: number }, { name: string }>('/test', payload);
      
      expect(mockedAxios.post).toHaveBeenCalledWith('/test', payload, expect.any(Object));
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('PUT requests', () => {
    it('should make a PUT request with data', async () => {
      const mockResponse: ApiResponse<{ id: number; name: string }> = {
        status: 'success',
        data: { id: 1, name: 'Updated' },
        timestamp: new Date().toISOString()
      };
      
      mockedAxios.put.mockResolvedValueOnce({ data: mockResponse });
      
      const payload = { name: 'Updated' };
      const result = await put<{ id: number; name: string }>('/test/1', payload);
      
      expect(mockedAxios.put).toHaveBeenCalledWith('/test/1', payload, expect.any(Object));
      expect(result).toEqual({ id: 1, name: 'Updated' });
    });
  });

  describe('PATCH requests', () => {
    it('should make a PATCH request with partial data', async () => {
      const mockResponse: ApiResponse<{ id: number; name: string }> = {
        status: 'success',
        data: { id: 1, name: 'Patched' },
        timestamp: new Date().toISOString()
      };
      
      mockedAxios.patch.mockResolvedValueOnce({ data: mockResponse });
      
      const payload = { name: 'Patched' };
      const result = await patch<{ id: number; name: string }>('/test/1', payload);
      
      expect(mockedAxios.patch).toHaveBeenCalledWith('/test/1', payload, expect.any(Object));
      expect(result).toEqual({ id: 1, name: 'Patched' });
    });
  });

  describe('DELETE requests', () => {
    it('should make a DELETE request', async () => {
      const mockResponse: ApiResponse<{ success: boolean }> = {
        status: 'success',
        data: { success: true },
        timestamp: new Date().toISOString()
      };
      
      mockedAxios.delete.mockResolvedValueOnce({ data: mockResponse });
      
      const result = await del<{ success: boolean }>('/test/1');
      
      expect(mockedAxios.delete).toHaveBeenCalledWith('/test/1', expect.any(Object));
      expect(result).toEqual({ success: true });
    });
  });

  describe('Paginated requests', () => {
    it('should handle paginated responses', async () => {
      const mockPaginatedResponse: PaginatedResponse<{ id: number; name: string }> = {
        status: 'success',
        data: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 2,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false
        },
        timestamp: new Date().toISOString()
      };
      
      mockedAxios.get.mockResolvedValueOnce({ data: mockPaginatedResponse });
      
      const result = await getPaginated<{ id: number; name: string }>('/test');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/test', expect.any(Object));
      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalItems).toBe(2);
    });
    
    it('should throw error for invalid paginated response format', async () => {
      const invalidResponse = {
        status: 'success',
        data: { notAnArray: true },
        timestamp: new Date().toISOString()
      };
      
      mockedAxios.get.mockResolvedValueOnce({ data: invalidResponse });
      
      await expect(getPaginated('/test')).rejects.toThrow('Invalid paginated response format');
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.get.mockRejectedValueOnce(networkError);
      
      await expect(get('/test')).rejects.toMatchObject({
        message: 'API request failed',
        code: 'UNKNOWN_ERROR'
      });
    });
    
    it('should handle invalid response format', async () => {
      const invalidResponse = {
        notTheRightFormat: true
      };
      
      mockedAxios.get.mockResolvedValueOnce({ data: invalidResponse });
      
      await expect(get('/test')).rejects.toThrow('Invalid API response format');
    });
  });
}); 