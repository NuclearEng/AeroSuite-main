interface CacheConfig {
  maxSize: number;
  ttl: number;
}

interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

class IndexedDBCache<T> {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string, storeName: string) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(this.storeName);
      };
    });
  }

  public async get(key: string): Promise<T | null> {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onerror = () => {
        reject(new Error('Failed to read from cache'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  public async set(key: string, value: T): Promise<void> {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(value, key);

      request.onerror = () => {
        reject(new Error('Failed to write to cache'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }
}

export class ClientDataCache<T> {
  private memoryCache: Map<string, CacheEntry<T>>;
  private idbCache: IndexedDBCache<CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      ttl: config.ttl || 3600000, // 1 hour
    };
    this.memoryCache = new Map();
    this.idbCache = new IndexedDBCache('clientDataCache', 'data');
  }

  public async get(key: string): Promise<T | null> {
    try {
      // Try memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && !this.isExpired(memoryEntry)) {
        return memoryEntry.value;
      }

      // Try IndexedDB cache
      const idbEntry = await this.idbCache.get(key);
      if (idbEntry && !this.isExpired(idbEntry)) {
        // Update memory cache
        this.memoryCache.set(key, idbEntry);
        return idbEntry.value;
      }

      return null;
    } catch (error) {
      console.warn(`Cache read failed for key: ${key}`, error);
      return null;
    }
  }

  public async set(key: string, value: T): Promise<void> {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
    };

    try {
      // Update memory cache
      this.memoryCache.set(key, entry);
      this.enforceMemoryCacheLimit();

      // Update IndexedDB cache
      await this.idbCache.set(key, entry);
    } catch (error) {
      console.error(`Failed to write to cache: ${key}`, error);
    }
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  private enforceMemoryCacheLimit(): void {
    if (this.memoryCache.size > this.config.maxSize) {
      const entriesToDelete = this.memoryCache.size - this.config.maxSize;
      let deleted = 0;
      for (const [key, entry] of this.memoryCache.entries()) {
        if (deleted >= entriesToDelete) break;
        if (this.isExpired(entry)) {
          this.memoryCache.delete(key);
          deleted++;
        }
      }
    }
  }

  public async syncWithServer(key: string, fetchFn: () => Promise<T>): Promise<T> {
    try {
      const cachedData = await this.get(key);
      if (cachedData) {
        return cachedData;
      }

      const freshData = await fetchFn();
      await this.set(key, freshData);
      return freshData;
    } catch (error) {
      console.error(`Background sync failed for key: ${key}`, error);
      throw error;
    }
  }
}