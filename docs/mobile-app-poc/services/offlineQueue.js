import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const QUEUE_STORAGE_KEY = '@aerosuite_offline_queue';

/**
 * Service to manage offline request queue
 */
class OfflineQueueService {
  constructor() {
    this.queue = [];
    this.initialized = false;
    this.init();
  }

  /**
   * Initialize the queue from storage
   */
  async init() {
    try {
      const storedQueue = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (storedQueue) {
        this.queue = JSON.parse(storedQueue);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
      this.queue = [];
      this.initialized = true;
    }
  }

  /**
   * Ensure the queue is initialized before operations
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (this.initialized) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
  }

  /**
   * Add a request to the queue
   * @param {Object} request - Request to queue
   * @returns {string} - ID of the queued request
   */
  async addToQueue(request) {
    await this.ensureInitialized();
    
    const queueItem = {
      id: uuidv4(),
      timestamp: Date.now(),
      ...request,
    };
    
    this.queue.push(queueItem);
    await this.persistQueue();
    
    return queueItem.id;
  }

  /**
   * Remove a request from the queue
   * @param {string} id - ID of the request to remove
   */
  async removeFromQueue(id) {
    await this.ensureInitialized();
    
    this.queue = this.queue.filter(item => item.id !== id);
    await this.persistQueue();
  }

  /**
   * Get all queued requests
   * @returns {Array} - Array of queued requests
   */
  async getQueue() {
    await this.ensureInitialized();
    return [...this.queue];
  }

  /**
   * Clear the entire queue
   */
  async clearQueue() {
    await this.ensureInitialized();
    
    this.queue = [];
    await this.persistQueue();
  }

  /**
   * Save the queue to persistent storage
   */
  async persistQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  /**
   * Get the number of items in the queue
   * @returns {number} - Number of queued items
   */
  async getQueueSize() {
    await this.ensureInitialized();
    return this.queue.length;
  }

  /**
   * Check if there are pending requests in the queue
   * @returns {boolean} - True if there are pending requests
   */
  async hasPendingRequests() {
    await this.ensureInitialized();
    return this.queue.length > 0;
  }
}

// Create and export a singleton instance
export const offlineQueue = new OfflineQueueService(); 