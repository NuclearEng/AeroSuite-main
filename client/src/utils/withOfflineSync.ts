import { isOnline } from './serviceWorkerUtils';
import persistenceService, { STORE_NAMES } from '../services/persistenceService';

// Interface for service methods to allow indexing
interface ServiceWithMethods {
  [key: string]: any;
}

/**
 * Higher-order function that wraps an API service with offline sync capabilities
 * 
 * @param service The service to wrap
 * @param options Configuration options
 * @returns The wrapped service with offline sync
 */
export function withOfflineSync<T extends ServiceWithMethods>(
  service: T,
  options: {
    storeName: string;
    methods?: {
      create?: string;
      read?: string;
      update?: string;
      delete?: string;
      list?: string;
    };
    idField?: string;
  }
): T {
  const {
    storeName,
    methods = {
      create: 'create',
      read: 'get',
      update: 'update',
      delete: 'delete',
      list: 'getAll'
    },
    idField = 'id'
  } = options;

  // Return a new object with the same methods but enhanced with offline capabilities
  const enhancedService = { ...service } as T;

  // Enhance read method (get a single item)
  if (methods.read && typeof service[methods.read] === 'function') {
    const originalRead = service[methods.read];
    (enhancedService as any)[methods.read] = async (...args: any[]) => {
      try {
        // Try to get from the network if online
        if (isOnline()) {
          const result = await originalRead.apply(service, args);
          
          // Save the result to IndexedDB for offline use
          if (result && result[idField]) {
            await persistenceService.put(storeName, {
              ...result,
              syncStatus: 'synced'
            });
          }
          
          return result;
        }
        
        // If offline, get from local storage
        const id = args[0]; // Assuming the ID is the first argument
        const localItem = await persistenceService.getById(storeName, id);
        return localItem || null;
      } catch (_error) {
        console.error(`Offline sync error in read method of ${storeName}:`, _error);
        
        // If an error occurs, try to get from local storage
        const id = args[0];
        const localItem = await persistenceService.getById(storeName, id);
        return localItem || null;
      }
    };
  }

  // Enhance list method (get all items)
  if (methods.list && typeof service[methods.list] === 'function') {
    const originalList = service[methods.list];
    (enhancedService as any)[methods.list] = async (...args: any[]) => {
      try {
        // Try to get from the network if online
        if (isOnline()) {
          const results = await originalList.apply(service, args);
          
          // If results is an array, save each item to IndexedDB
          if (Array.isArray(results)) {
            await Promise.all(
              results.map(item => 
                persistenceService.put(storeName, {
                  ...item,
                  syncStatus: 'synced'
                })
              )
            );
          }
          
          return results;
        }
        
        // If offline, get from local storage
        const localItems = await persistenceService.getAll(storeName);
        return localItems;
      } catch (_error) {
        console.error(`Offline sync error in list method of ${storeName}:`, _error);
        
        // If an error occurs, try to get from local storage
        const localItems = await persistenceService.getAll(storeName);
        return localItems;
      }
    };
  }

  // Enhance create method
  if (methods.create && typeof service[methods.create] === 'function') {
    const originalCreate = service[methods.create];
    (enhancedService as any)[methods.create] = async (...args: any[]) => {
      const item = args[0]; // Assuming the item is the first argument
      
      try {
        // Try to create on the server if online
        if (isOnline()) {
          const result = await originalCreate.apply(service, args);
          
          // Save the result to IndexedDB for offline use
          if (result && result[idField]) {
            await persistenceService.put(storeName, {
              ...result,
              syncStatus: 'synced'
            });
          }
          
          return result;
        }
        
        // If offline, save locally and queue for later sync
        const localId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const localItem = {
          ...item,
          [idField]: item[idField] || localId,
          syncStatus: 'pending',
          pendingOperation: 'create'
        };
        
        await persistenceService.put(storeName, localItem);
        
        // Add to pending requests
        await persistenceService.addPendingRequest({
          url: `/${storeName}`,
          method: 'POST',
          data: item
        });
        
        return localItem;
      } catch (_error) {
        console.error(`Offline sync error in create method of ${storeName}:`, _error);
        
        // If an error occurs, save locally and queue for later sync
        const localId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const localItem = {
          ...item,
          [idField]: item[idField] || localId,
          syncStatus: 'pending',
          pendingOperation: 'create'
        };
        
        await persistenceService.put(storeName, localItem);
        
        // Add to pending requests
        await persistenceService.addPendingRequest({
          url: `/${storeName}`,
          method: 'POST',
          data: item
        });
        
        return localItem;
      }
    };
  }

  // Enhance update method
  if (methods.update && typeof service[methods.update] === 'function') {
    const originalUpdate = service[methods.update];
    (enhancedService as any)[methods.update] = async (...args: any[]) => {
      const id = args[0]; // Assuming the ID is the first argument
      const updates = args[1]; // Assuming the updates are the second argument
      
      try {
        // Try to update on the server if online
        if (isOnline()) {
          const result = await originalUpdate.apply(service, args);
          
          // Save the result to IndexedDB for offline use
          if (result && result[idField]) {
            await persistenceService.put(storeName, {
              ...result,
              syncStatus: 'synced'
            });
          }
          
          return result;
        }
        
        // If offline, update locally and queue for later sync
        const localItem = await persistenceService.getById<Record<string, any>>(storeName, id);
        
        if (!localItem) {
          throw new Error(`Item with ID ${id} not found locally`);
        }
        
        const updatedItem = {
          ...localItem,
          ...updates,
          syncStatus: 'pending',
          pendingOperation: 'update'
        };
        
        await persistenceService.put(storeName, updatedItem);
        
        // Add to pending requests
        await persistenceService.addPendingRequest({
          url: `/${storeName}/${id}`,
          method: 'PUT',
          data: updates
        });
        
        return updatedItem;
      } catch (_error) {
        console.error(`Offline sync error in update method of ${storeName}:`, _error);
        
        // If an error occurs, try to update locally and queue for later sync
        const localItem = await persistenceService.getById<Record<string, any>>(storeName, id);
        
        if (!localItem) {
          throw new Error(`Item with ID ${id} not found locally`);
        }
        
        const updatedItem = {
          ...localItem,
          ...updates,
          syncStatus: 'pending',
          pendingOperation: 'update'
        };
        
        await persistenceService.put(storeName, updatedItem);
        
        // Add to pending requests
        await persistenceService.addPendingRequest({
          url: `/${storeName}/${id}`,
          method: 'PUT',
          data: updates
        });
        
        return updatedItem;
      }
    };
  }

  // Enhance delete method
  if (methods.delete && typeof service[methods.delete] === 'function') {
    const originalDelete = service[methods.delete];
    (enhancedService as any)[methods.delete] = async (...args: any[]) => {
      const id = args[0]; // Assuming the ID is the first argument
      
      try {
        // Try to delete on the server if online
        if (isOnline()) {
          const result = await originalDelete.apply(service, args);
          
          // Delete from local storage
          await persistenceService.delete(storeName, id);
          
          return result;
        }
        
        // If offline, mark for deletion but don't actually delete
        const localItem = await persistenceService.getById<Record<string, any>>(storeName, id);
        
        if (localItem) {
          const markedItem = {
            ...localItem,
            id: id as string,
            [idField]: id,
            syncStatus: 'pending',
            pendingOperation: 'delete',
            deletedAt: new Date().toISOString()
          };
          
          await persistenceService.put(storeName, markedItem);
          
          // Add to pending requests
          await persistenceService.addPendingRequest({
            url: `/${storeName}/${id}`,
            method: 'DELETE',
            data: null
          });
        }
        
        return { success: true };
      } catch (_error) {
        console.error(`Offline sync error in delete method of ${storeName}:`, _error);
        
        // If offline, mark for deletion but don't actually delete
        const localItem = await persistenceService.getById<Record<string, any>>(storeName, id);
        
        if (localItem) {
          const markedItem = {
            ...localItem,
            id: id as string,
            [idField]: id,
            syncStatus: 'pending',
            pendingOperation: 'delete',
            deletedAt: new Date().toISOString()
          };
          
          await persistenceService.put(storeName, markedItem);
          
          // Add to pending requests
          await persistenceService.addPendingRequest({
            url: `/${storeName}/${id}`,
            method: 'DELETE',
            data: null
          });
        }
        
        return { success: true };
      }
    };
  }

  return enhancedService;
}

export default withOfflineSync; 