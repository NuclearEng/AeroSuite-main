import { useState, useCallback, useRef, useEffect } from 'react';
import inspectionService, { Inspection } from '../services/inspection.service';
import useMemoryOptimizer from './useMemoryOptimizer';

interface ChecklistItem {
  id: string;
  [key: string]: any;
}

interface ChecklistItemUpdate {
  id: string;
  [key: string]: any;
}

interface UseInspectionChecklistProps {
  inspectionId: string;
  initialChecklist?: ChecklistItem[];
  batchMode?: boolean;
  batchInterval?: number; // in milliseconds
}

/**
 * Hook for managing inspection checklists with support for batch updates
 * to optimize performance when updating multiple checklist items
 */
const useInspectionChecklist = ({
  inspectionId,
  initialChecklist = [],
  batchMode = true,
  batchInterval = 2000
}: UseInspectionChecklistProps) => {
  // State to store the checklist items
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Use memory optimizer to prevent memory leaks on large checklists
  const [memoryStats, performCleanup] = useMemoryOptimizer({ 
    threshold: 80,
    debug: false,
    cleanupCallback: () => {
      // Custom cleanup for checklist data
      if (checklist && checklist.length > 100) {
        console.log('High memory usage detected with large checklist');
      }
    }
  });
  
  // Refs for batch processing
  const batchUpdatesRef = useRef<ChecklistItemUpdate[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);
  
  // Load checklist data if not provided initially
  useEffect(() => {
    if (initialChecklist.length === 0 && inspectionId) {
      loadChecklist();
    }
  }, [inspectionId]);
  
  // Load checklist from the server
  const loadChecklist = useCallback(async () => {
    if (!inspectionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const inspection = await inspectionService.getInspection(inspectionId);
      if (inspection && (inspection as any).checklistItems) {
        setChecklist((inspection as any).checklistItems);
      }
    } catch (_err) {
      setError(_err instanceof Error ? _err : new Error('Failed to load checklist'));
      console.error('Error loading checklist:', _err);
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);
  
  // Process the batch of updates
  const processBatchUpdates = useCallback(async () => {
    if (batchUpdatesRef.current.length === 0) return;
    
    setIsSaving(true);
    
    try {
      // Clone the current batch and clear the queue
      const updates = [...batchUpdatesRef.current];
      batchUpdatesRef.current = [];
      
      // Apply the batch update
      const updatedInspection = await (inspectionService as any).batchUpdateChecklist(
        inspectionId,
        updates
      );
      
      // Update local state with the result from the server
      if (updatedInspection && (updatedInspection as any).checklistItems) {
        setChecklist((updatedInspection as any).checklistItems);
      }
    } catch (_err) {
      setError(_err instanceof Error ? _err : new Error('Failed to update checklist'));
      console.error('Error updating checklist:', _err);
      
      // Reload checklist to ensure consistency
      await loadChecklist();
    } finally {
      setIsSaving(false);
    }
  }, [inspectionId, loadChecklist]);
  
  // Schedule batch update
  const scheduleBatchUpdate = useCallback(() => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
    
    batchTimeoutRef.current = setTimeout(() => {
      processBatchUpdates();
      batchTimeoutRef.current = null;
    }, batchInterval);
  }, [batchInterval, processBatchUpdates]);
  
  // Update a single checklist item
  const updateChecklistItem = useCallback(async (itemUpdate: ChecklistItemUpdate) => {
    // Optimistically update the UI
    setChecklist(prevChecklist => 
      prevChecklist.map(item => 
        item.id === itemUpdate.id 
          ? { ...item, ...itemUpdate }
          : item
      )
    );
    
    if (batchMode) {
      // Add to batch queue
      const existingUpdateIndex = batchUpdatesRef.current.findIndex(
        update => update.id === itemUpdate.id
      );
      
      if (existingUpdateIndex >= 0) {
        // Merge with existing update for the same item
        batchUpdatesRef.current[existingUpdateIndex] = {
          ...batchUpdatesRef.current[existingUpdateIndex],
          ...itemUpdate
        };
      } else {
        // Add new update to queue
        batchUpdatesRef.current.push(itemUpdate);
      }
      
      // Schedule processing the batch
      scheduleBatchUpdate();
    } else {
      // Immediately update individual item
      setIsSaving(true);
      try {
        // Create a single-item batch for the non-batch mode
        const updatedInspection = await (inspectionService as any).batchUpdateChecklist(
          inspectionId,
          [itemUpdate]
        );
        
        if (updatedInspection && (updatedInspection as any).checklistItems) {
          setChecklist((updatedInspection as any).checklistItems);
        }
      } catch (_err) {
        setError(_err instanceof Error ? _err : new Error('Failed to update checklist item'));
        console.error('Error updating checklist item:', _err);
        
        // Reload checklist to ensure consistency
        await loadChecklist();
      } finally {
        setIsSaving(false);
      }
    }
  }, [batchMode, inspectionId, loadChecklist, scheduleBatchUpdate]);
  
  // Force immediate processing of any pending updates
  const flushUpdates = useCallback(async () => {
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }
    
    if (batchUpdatesRef.current.length > 0) {
      await processBatchUpdates();
    }
  }, [processBatchUpdates]);
  
  return {
    checklist,
    loading,
    error,
    isSaving,
    updateChecklistItem,
    loadChecklist,
    flushUpdates,
    pendingUpdatesCount: batchUpdatesRef.current.length
  };
};

export default useInspectionChecklist; 