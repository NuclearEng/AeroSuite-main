import { openDB, deleteDB, IDBPDatabase } from 'idb';

// Database name and version
const DB_NAME = 'aerosuite-offline';
const DB_VERSION = 1;

// Store names
export const STORE_NAMES = {
  INSPECTIONS: 'inspections',
  SUPPLIERS: 'suppliers',
  CUSTOMERS: 'customers',
  PENDING_REQUESTS: 'pendingRequests',
  USER_DATA: 'userData',
  SETTINGS: 'settings',
};

interface PendingRequest {
  id: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

// Initialize the database
const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORE_NAMES.INSPECTIONS)) {
        const inspectionsStore = db.createObjectStore(STORE_NAMES.INSPECTIONS, { keyPath: 'id' });
        inspectionsStore.createIndex('supplierId', 'supplierId');
        inspectionsStore.createIndex('customerId', 'customerId');
        inspectionsStore.createIndex('status', 'status');
        inspectionsStore.createIndex('syncStatus', 'syncStatus');
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.SUPPLIERS)) {
        const suppliersStore = db.createObjectStore(STORE_NAMES.SUPPLIERS, { keyPath: 'id' });
        suppliersStore.createIndex('name', 'name');
        suppliersStore.createIndex('syncStatus', 'syncStatus');
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.CUSTOMERS)) {
        const customersStore = db.createObjectStore(STORE_NAMES.CUSTOMERS, { keyPath: 'id' });
        customersStore.createIndex('name', 'name');
        customersStore.createIndex('syncStatus', 'syncStatus');
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.PENDING_REQUESTS)) {
        const pendingRequestsStore = db.createObjectStore(STORE_NAMES.PENDING_REQUESTS, { keyPath: 'id' });
        pendingRequestsStore.createIndex('timestamp', 'timestamp');
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.USER_DATA)) {
        db.createObjectStore(STORE_NAMES.USER_DATA, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
        db.createObjectStore(STORE_NAMES.SETTINGS, { keyPath: 'id' });
      }
    },
  });
};

// Basic cache service for offline support
const persistenceService = {
  /**
   * Initialize the database
   */
  init: async (): Promise<void> => {
    try {
      await initDB();
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  },

  /**
   * Get all items from a store
   * @param storeName Name of the store
   * @returns Array of items
   */
  getAll: async <T>(storeName: string): Promise<T[]> => {
    try {
      const db = await initDB();
      return db.getAll(storeName);
    } catch (error) {
      console.error(`Error getting items from ${storeName}:`, error);
      return [];
    }
  },

  /**
   * Get an item by ID
   * @param storeName Name of the store
   * @param id Item ID
   * @returns The item or undefined
   */
  getById: async <T>(storeName: string, id: string): Promise<T | undefined> => {
    try {
      const db = await initDB();
      return db.get(storeName, id);
    } catch (error) {
      console.error(`Error getting item ${id} from ${storeName}:`, error);
      return undefined;
    }
  },

  /**
   * Add or update an item
   * @param storeName Name of the store
   * @param item Item to add or update
   * @returns The item ID
   */
  put: async <T extends { id: string }>(storeName: string, item: T): Promise<string> => {
    try {
      const db = await initDB();
      // Add syncStatus for tracking offline changes
      const itemWithSyncStatus = {
        ...item,
        syncStatus: 'pending',
        lastModified: Date.now(),
      };
      await db.put(storeName, itemWithSyncStatus);
      return item.id;
    } catch (error) {
      console.error(`Error adding/updating item in ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Delete an item by ID
   * @param storeName Name of the store
   * @param id Item ID
   */
  delete: async (storeName: string, id: string): Promise<void> => {
    try {
      const db = await initDB();
      await db.delete(storeName, id);
    } catch (error) {
      console.error(`Error deleting item ${id} from ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Clear all items from a store
   * @param storeName Name of the store
   */
  clear: async (storeName: string): Promise<void> => {
    try {
      const db = await initDB();
      await db.clear(storeName);
    } catch (error) {
      console.error(`Error clearing store ${storeName}:`, error);
      throw error;
    }
  },

  /**
   * Add a pending request for sync when online
   * @param request Request to add
   * @returns The request ID
   */
  addPendingRequest: async (request: Omit<PendingRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> => {
    try {
      const db = await initDB();
      const id = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pendingRequest: PendingRequest = {
        ...request,
        id,
        timestamp: Date.now(),
        retryCount: 0,
      };
      await db.put(STORE_NAMES.PENDING_REQUESTS, pendingRequest);
      return id;
    } catch (error) {
      console.error('Error adding pending request:', error);
      throw error;
    }
  },

  /**
   * Get all pending requests
   * @returns Array of pending requests
   */
  getPendingRequests: async (): Promise<PendingRequest[]> => {
    try {
      const db = await initDB();
      return db.getAll(STORE_NAMES.PENDING_REQUESTS);
    } catch (error) {
      console.error('Error getting pending requests:', error);
      return [];
    }
  },

  /**
   * Delete a pending request
   * @param id Request ID
   */
  deletePendingRequest: async (id: string): Promise<void> => {
    try {
      const db = await initDB();
      await db.delete(STORE_NAMES.PENDING_REQUESTS, id);
    } catch (error) {
      console.error(`Error deleting pending request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update request retry count
   * @param id Request ID
   * @param retryCount New retry count
   */
  updateRequestRetryCount: async (id: string, retryCount: number): Promise<void> => {
    try {
      const db = await initDB();
      const request = await db.get(STORE_NAMES.PENDING_REQUESTS, id);
      if (request) {
        request.retryCount = retryCount;
        await db.put(STORE_NAMES.PENDING_REQUESTS, request);
      }
    } catch (error) {
      console.error(`Error updating retry count for request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Save user data for offline access
   * @param userData User data to save
   */
  saveUserData: async (userData: any): Promise<void> => {
    try {
      const db = await initDB();
      await db.put(STORE_NAMES.USER_DATA, { id: 'userData', ...userData });
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  },

  /**
   * Get user data
   * @returns User data or undefined
   */
  getUserData: async (): Promise<any | undefined> => {
    try {
      const db = await initDB();
      return db.get(STORE_NAMES.USER_DATA, 'userData');
    } catch (error) {
      console.error('Error getting user data:', error);
      return undefined;
    }
  },

  /**
   * Save application settings
   * @param settings Settings to save
   */
  saveSettings: async (settings: any): Promise<void> => {
    try {
      const db = await initDB();
      await db.put(STORE_NAMES.SETTINGS, { id: 'settings', ...settings });
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  /**
   * Get application settings
   * @returns Settings or undefined
   */
  getSettings: async (): Promise<any | undefined> => {
    try {
      const db = await initDB();
      return db.get(STORE_NAMES.SETTINGS, 'settings');
    } catch (error) {
      console.error('Error getting settings:', error);
      return undefined;
    }
  },

  /**
   * Calculate database size
   * @returns Size in bytes
   */
  getDatabaseSize: async (): Promise<number> => {
    try {
      let totalSize = 0;
      const db = await initDB();
      
      for (const storeName of Object.values(STORE_NAMES)) {
        const items = await db.getAll(storeName);
        const storeSize = new Blob([JSON.stringify(items)]).size;
        totalSize += storeSize;
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating database size:', error);
      return 0;
    }
  },

  /**
   * Delete the database
   */
  deleteDatabase: async (): Promise<void> => {
    try {
      await deleteDB(DB_NAME);
    } catch (error) {
      console.error('Error deleting database:', error);
      throw error;
    }
  },
};

export default persistenceService; 