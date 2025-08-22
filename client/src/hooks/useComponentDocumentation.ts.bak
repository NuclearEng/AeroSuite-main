import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface ComponentDocument {
  _id: string;
  componentId: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  version: string;
  uploadedBy: string;
  uploadDate: string;
  tags: string[];
  category: 'manual' | 'specification' | 'drawing' | 'test_report' | 'certificate' | 'other';
}

export interface DocumentUploadResponse {
  success: boolean;
  document?: ComponentDocument;
  message?: string;
}

/**
 * Hook for managing component documentation
 */
const useComponentDocumentation = (componentId?: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ComponentDocument[]>([]);
  const [categories, setCategories] = useState<Record<string, number>>({});

  /**
   * Fetch documents for a component
   */
  const fetchDocuments = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/api/components/${id}/documents`);
      setDocuments(response.data);
      
      // Calculate document counts by category
      const categoryCounts: Record<string, number> = {};
      response.data.forEach((doc: ComponentDocument) => {
        categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
      });
      setCategories(categoryCounts);
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch documents';
      setError(errorMsg);
      console.error('Error fetching documents:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Upload a new document
   */
  const uploadDocument = useCallback(async (
    id: string, 
    formData: FormData
  ): Promise<DocumentUploadResponse> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/components/${id}/documents`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update documents list
      setDocuments(prev => [response.data, ...prev]);
      
      // Update category counts
      setCategories(prev => ({
        ...prev,
        [response.data.category]: (prev[response.data.category] || 0) + 1
      }));
      
      return { success: true, document: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to upload document';
      setError(errorMsg);
      console.error('Error uploading document:', err);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a document
   */
  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`${API_BASE_URL}/api/component-documents/${documentId}`);
      
      // Find the document to be deleted to update category counts
      const docToDelete = documents.find(doc => doc._id === documentId);
      
      // Update documents list
      setDocuments(prev => prev.filter(doc => doc._id !== documentId));
      
      // Update category counts if document was found
      if (docToDelete) {
        setCategories(prev => ({
          ...prev,
          [docToDelete.category]: Math.max(0, (prev[docToDelete.category] || 0) - 1)
        }));
      }
      
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to delete document';
      setError(errorMsg);
      console.error('Error deleting document:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [documents]);

  /**
   * Update document metadata
   */
  const updateDocument = useCallback(async (
    documentId: string, 
    updates: Partial<Omit<ComponentDocument, '_id' | 'componentId' | 'uploadDate'>>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/component-documents/${documentId}`, 
        updates
      );
      
      // Find the document to check if category changed
      const oldDoc = documents.find(doc => doc._id === documentId);
      const newCategory = updates.category;
      
      // Update documents list
      setDocuments(prev => prev.map(doc => 
        doc._id === documentId ? { ...doc, ...response.data } : doc
      ));
      
      // Update category counts if category changed
      if (oldDoc && newCategory && oldDoc.category !== newCategory) {
        setCategories(prev => ({
          ...prev,
          [oldDoc.category]: Math.max(0, (prev[oldDoc.category] || 0) - 1),
          [newCategory]: (prev[newCategory] || 0) + 1
        }));
      }
      
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update document';
      setError(errorMsg);
      console.error('Error updating document:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [documents]);

  // Load documents if componentId is provided
  useEffect(() => {
    if (componentId) {
      fetchDocuments(componentId);
    }
  }, [componentId, fetchDocuments]);

  return {
    loading,
    error,
    documents,
    categories,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    updateDocument
  };
};

export default useComponentDocumentation; 