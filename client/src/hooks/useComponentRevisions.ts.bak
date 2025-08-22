import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface ComponentRevision {
  _id: string;
  componentId: string;
  version: string;
  changes: string;
  changedBy: string;
  changeDate: string;
  status: 'active' | 'deprecated' | 'archived';
  metadata?: Record<string, any>;
}

export interface Component {
  _id: string;
  name: string;
  description: string;
  category: string;
  partNumber: string;
  currentVersion: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'discontinued' | 'in-development';
}

/**
 * Hook for managing component revisions
 */
const useComponentRevisions = (componentId?: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<ComponentRevision[]>([]);
  const [component, setComponent] = useState<Component | null>(null);
  const [currentRevision, setCurrentRevision] = useState<ComponentRevision | null>(null);

  /**
   * Fetch component details
   */
  const fetchComponent = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/api/components/${id}`);
      setComponent(response.data);
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch component';
      setError(errorMsg);
      console.error('Error fetching component:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch revisions for a component
   */
  const fetchRevisions = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/api/components/${id}/revisions`);
      const sortedRevisions = response.data.sort((a: ComponentRevision, b: ComponentRevision) => 
        new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()
      );
      
      setRevisions(sortedRevisions);
      
      // Set current revision (most recent active one)
      const activeRevisions = sortedRevisions.filter((rev: ComponentRevision) => rev.status === 'active');
      if (activeRevisions.length > 0) {
        setCurrentRevision(activeRevisions[0]);
      }
      
      return sortedRevisions;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch revisions';
      setError(errorMsg);
      console.error('Error fetching revisions:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new revision
   */
  const createRevision = useCallback(async (data: Omit<ComponentRevision, '_id'>) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE_URL}/api/components/${data.componentId}/revisions`, data);
      
      // Update revisions list
      setRevisions(prev => [response.data, ...prev]);
      
      // Update current revision if status is active
      if (response.data.status === 'active') {
        setCurrentRevision(response.data);
      }
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create revision';
      setError(errorMsg);
      console.error('Error creating revision:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update revision status
   */
  const updateRevisionStatus = useCallback(async (revisionId: string, status: 'active' | 'deprecated' | 'archived') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/component-revisions/${revisionId}`, 
        { status }
      );
      
      // Update revisions list
      setRevisions(prev => prev.map(rev => 
        rev._id === revisionId ? { ...rev, status } : rev
      ));
      
      // Update current revision if needed
      if (status === 'active') {
        setCurrentRevision(response.data);
      } else if (currentRevision?._id === revisionId) {
        // Find next active revision if current one is updated to non-active
        const nextActive = revisions.find(rev => rev.status === 'active' && rev._id !== revisionId);
        setCurrentRevision(nextActive || null);
      }
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update revision status';
      setError(errorMsg);
      console.error('Error updating revision status:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentRevision, revisions]);

  /**
   * Compare two revisions
   */
  const compareRevisions = useCallback((revisionIdA: string, revisionIdB: string) => {
    const revisionA = revisions.find(rev => rev._id === revisionIdA);
    const revisionB = revisions.find(rev => rev._id === revisionIdB);
    
    if (!revisionA || !revisionB) {
      setError('One or both revisions not found');
      return null;
    }
    
    // Return comparison data (this would depend on your specific implementation needs)
    return {
      revisionA,
      revisionB,
      // Other comparison data
    };
  }, [revisions]);

  // Load component and revisions if componentId is provided
  useEffect(() => {
    if (componentId) {
      fetchComponent(componentId);
      fetchRevisions(componentId);
    }
  }, [componentId, fetchComponent, fetchRevisions]);

  return {
    loading,
    error,
    component,
    revisions,
    currentRevision,
    fetchComponent,
    fetchRevisions,
    createRevision,
    updateRevisionStatus,
    compareRevisions
  };
};

export default useComponentRevisions; 