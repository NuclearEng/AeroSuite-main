import { apiCache, PersistentCache, IndexedDBCache } from '../utils/caching';

// Define TTLs for different types of data
const TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 2 * 60 * 60 * 1000, // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// Cache for larger datasets
const largeDataCache = new IndexedDBCache<any>('aerosuite-data', 'api-responses', TTL.MEDIUM);

// Cache for user-specific data
const userDataCache = new PersistentCache<any>('user-data', TTL.SHORT);

/**
 * Base API URL from environment
 */
const API_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Generic fetch function with error handling
 */
async function fetchWithCache<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheTTL: number = TTL.SHORT,
  useCache: boolean = true,
  cacheKey?: string
): Promise<T> {
  // Generate cache key if not provided
  const key = cacheKey || `${endpoint}:${JSON.stringify(options)}`;
  
  // Check cache first if enabled
  if (useCache) {
    const cachedData = apiCache.get(key);
    if (cachedData) {
      return cachedData as T;
    }
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the result if enabled
    if (useCache) {
      apiCache.set(key, data, cacheTTL);
    }
    
    return data as T;
  } catch (_error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Get a list of items with caching
 */
async function getList<T>(
  endpoint: string,
  params: Record<string, string> = {},
  cacheTTL: number = TTL.SHORT,
  useCache: boolean = true
): Promise<T[]> {
  // Build query string
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  
  return fetchWithCache<T[]>(url, { method: 'GET' }, cacheTTL, useCache);
}

/**
 * Get a single item with caching
 */
async function getItem<T>(
  endpoint: string,
  id: string | number,
  useCache: boolean = true,
  cacheTTL: number = TTL.MEDIUM
): Promise<T> {
  return fetchWithCache<T>(`${endpoint}/${id}`, { method: 'GET' }, cacheTTL, useCache);
}

/**
 * Create an item (no caching for POST)
 */
async function createItem<T>(endpoint: string, data: any): Promise<T> {
  return fetchWithCache<T>(
    endpoint,
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    0,
    false
  );
}

/**
 * Update an item and invalidate cache
 */
async function updateItem<T>(endpoint: string, id: string | number, data: any): Promise<T> {
  // Invalidate caches for this item
  const itemCacheKey = `${endpoint}/${id}:{"method":"GET"}`;
  apiCache.delete(itemCacheKey);
  
  // Invalidate list caches for this endpoint
  const cacheKeys = apiCache.keys();
  cacheKeys.forEach(key => {
    if (key.startsWith(`${endpoint}?`) || key === `${endpoint}:{"method":"GET"}`) {
      apiCache.delete(key);
    }
  });
  
  return fetchWithCache<T>(
    `${endpoint}/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    0,
    false
  );
}

/**
 * Delete an item and invalidate cache
 */
async function deleteItem<T>(endpoint: string, id: string | number): Promise<T> {
  // Invalidate caches for this item
  const itemCacheKey = `${endpoint}/${id}:{"method":"GET"}`;
  apiCache.delete(itemCacheKey);
  
  // Invalidate list caches for this endpoint
  const cacheKeys = apiCache.keys();
  cacheKeys.forEach(key => {
    if (key.startsWith(`${endpoint}?`) || key === `${endpoint}:{"method":"GET"}`) {
      apiCache.delete(key);
    }
  });
  
  return fetchWithCache<T>(
    `${endpoint}/${id}`,
    { method: 'DELETE' },
    0,
    false
  );
}

/**
 * Get a large dataset using IndexedDB caching
 */
async function getLargeDataset<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  // Build query string and cache key
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${endpoint}?${queryString}` : endpoint;
  const cacheKey = url;
  
  // Try to get from IndexedDB cache first
  try {
    const cachedData = await largeDataCache.get(cacheKey);
    if (cachedData) {
      return cachedData as T;
    }
  } catch (_error) {
    console.error('Error accessing IndexedDB cache:', error);
  }
  
  // Fetch from API if not in cache
  const response = await fetch(`${API_URL}${url}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Store in IndexedDB cache
  try {
    await largeDataCache.set(cacheKey, data, TTL.MEDIUM);
  } catch (_error) {
    console.error('Error storing in IndexedDB cache:', error);
  }
  
  return data as T;
}

/**
 * Clear all caches
 */
async function clearAllCaches(): Promise<void> {
  // Clear in-memory cache
  apiCache.clear();
  
  // Clear persistent caches
  userDataCache.clear();
  
  // Clear IndexedDB cache
  try {
    await largeDataCache.clear();
  } catch (_error) {
    console.error('Error clearing IndexedDB cache:', error);
  }
}

/**
 * Clear expired cache entries
 */
async function evictExpired(): Promise<void> {
  // Clear expired entries from in-memory cache
  apiCache.evictExpired();
  
  // Clear expired entries from persistent cache
  userDataCache.evictExpired();
  
  // Clear expired entries from IndexedDB cache
  try {
    await largeDataCache.evictExpired();
  } catch (_error) {
    console.error('Error evicting expired entries from IndexedDB cache:', error);
  }
}

// Specific API services with caching
const supplierService = {
  getSuppliers: (params: Record<string, string> = {}) => 
    getList<any>('/suppliers', params, TTL.MEDIUM),
  
  getSupplier: (id: string | number) => 
    getItem<any>('/suppliers', id, true, TTL.MEDIUM),
  
  createSupplier: (data: any) => 
    createItem<any>('/suppliers', data),
  
  updateSupplier: (id: string | number, data: any) => 
    updateItem<any>('/suppliers', id, data),
  
  deleteSupplier: (id: string | number) => 
    deleteItem<any>('/suppliers', id),
  
  getSupplierStats: (id: string | number) => 
    getItem<any>(`/suppliers/${id}/stats`, '', true, TTL.SHORT),
};

const customerService = {
  getCustomers: (params: Record<string, string> = {}) => 
    getList<any>('/customers', params, TTL.MEDIUM),
  
  getCustomer: (id: string | number) => 
    getItem<any>('/customers', id, true, TTL.MEDIUM),
  
  createCustomer: (data: any) => 
    createItem<any>('/customers', data),
  
  updateCustomer: (id: string | number, data: any) => 
    updateItem<any>('/customers', id, data),
  
  deleteCustomer: (id: string | number) => 
    deleteItem<any>('/customers', id),
  
  getCustomerActivity: (id: string | number) => 
    getItem<any>(`/customers/${id}/activity`, '', true, TTL.SHORT),
};

const inspectionService = {
  getInspections: (params: Record<string, string> = {}) => 
    getList<any>('/inspections', params, TTL.SHORT),
  
  getInspection: (id: string | number) => 
    getItem<any>('/inspections', id, true, TTL.SHORT),
  
  createInspection: (data: any) => 
    createItem<any>('/inspections', data),
  
  updateInspection: (id: string | number, data: any) => 
    updateItem<any>('/inspections', id, data),
  
  deleteInspection: (id: string | number) => 
    deleteItem<any>('/inspections', id),
  
  getInspectionAnalytics: () => 
    fetchWithCache<any>('/inspections/analytics', { method: 'GET' }, TTL.MEDIUM, true),
};

const reportService = {
  getReports: (params: Record<string, string> = {}) => 
    getList<any>('/reports', params, TTL.LONG),
  
  getReport: (id: string | number) => 
    getItem<any>('/reports', id, true, TTL.LONG),
  
  generateReport: (data: any) => 
    createItem<any>('/reports', data),
  
  getLargeReportData: (id: string | number) => 
    getLargeDataset<any>(`/reports/${id}/data`),
};

// Export the services
export {
  apiCache,
  TTL,
  fetchWithCache,
  getList,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getLargeDataset,
  clearAllCaches,
  evictExpired,
  supplierService,
  customerService,
  inspectionService,
  reportService,
}; 