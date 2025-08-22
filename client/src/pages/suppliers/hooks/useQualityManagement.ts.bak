import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config';

export interface QualityMetric {
  current: number;
  target: number;
  history: { date: string; value: number }[];
}

export interface QualityMetrics {
  defectRate: QualityMetric;
  firstTimeYield: QualityMetric;
  onTimeDelivery: QualityMetric;
  ncmrCount: QualityMetric;
  correctionResponseTime: QualityMetric;
  [key: string]: QualityMetric;
}

export interface NonConformance {
  _id: string;
  ncNumber: string;
  description: string;
  severity: 'critical' | 'major' | 'minor' | 'observation';
  category: string;
  status: 'open' | 'in-progress' | 'closed' | 'verified';
  reportedDate: string;
  reportedBy?: string;
  closedDate?: string;
  closedBy?: string;
  rootCause?: string;
  correctiveAction?: string;
  verificationNotes?: string;
}

export interface QualityDocument {
  _id: string;
  name: string;
  description: string;
  type: string;
  url?: string;
  version?: string;
  uploadDate: string;
  uploadedBy?: string;
  expiryDate?: string;
}

export interface AuditRecord {
  auditId: string;
  auditDate: string;
  auditType: string;
  result: string;
  score: number;
  findings?: string[];
}

export interface QMSCertification {
  certificationNumber?: string;
  issuer?: string;
  status: 'active' | 'expired' | 'suspended' | 'pending' | 'not-applicable';
  issueDate?: string;
  expiryDate?: string;
  documentUrl?: string;
}

export interface QualityManagementData {
  _id: string;
  supplierId: string;
  qmsType: string;
  qmsCertification: QMSCertification;
  qualityMetrics: QualityMetrics;
  nonConformances: NonConformance[];
  qualityDocuments: QualityDocument[];
  auditHistory: AuditRecord[];
  improvementPlans?: any[];
  updatedAt: string;
  createdAt: string;
}

export interface ComplianceSummary {
  supplierId: string;
  complianceScore: number;
  complianceStatus: 'compliant' | 'minor-issues' | 'major-issues' | 'non-compliant' | 'pending-review';
  openNonConformances: {
    count: number;
    critical: number;
    major: number;
    minor: number;
  };
  activeImprovementPlans: number;
  lastReviewDate?: string;
  nextReviewDate?: string;
}

/**
 * Hook for managing supplier quality management system data
 */
const useQualityManagement = () => {
  const [qmsData, setQmsData] = useState<QualityManagementData | null>(null);
  const [complianceSummary, setComplianceSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch quality management system data for a supplier
   */
  const fetchQMS = useCallback(async (supplierId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_BASE_URL}/api/suppliers/${supplierId}/quality-management`);
      setQmsData(response.data);
      
      return response.data;
    } catch (err: any) {
      console.error('Error fetching QMS data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch QMS data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch compliance summary for a supplier
   */
  const fetchComplianceSummary = useCallback(async (supplierId: string) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE_URL}/api/suppliers/${supplierId}/compliance-summary`);
      setComplianceSummary(response.data);
      
      return response.data;
    } catch (err: any) {
      console.error('Error fetching compliance summary:', err);
      // Don't set error state as this is secondary data
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update a quality metric
   */
  const updateMetric = useCallback(async (supplierId: string, metricName: string, value: number) => {
    try {
      setLoading(true);
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/suppliers/${supplierId}/quality-management/metrics/${metricName}`,
        { value }
      );
      
      // Update local state
      if (qmsData && response.data) {
        setQmsData({
          ...qmsData,
          qualityMetrics: {
            ...qmsData.qualityMetrics,
            [metricName]: response.data
          }
        });
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Error updating metric:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update metric');
      return null;
    } finally {
      setLoading(false);
    }
  }, [qmsData]);

  /**
   * Add a new non-conformance record
   */
  const addNonConformance = useCallback(async (supplierId: string, ncData: any) => {
    try {
      setLoading(true);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/suppliers/${supplierId}/quality-management/non-conformances`,
        ncData
      );
      
      // Update local state
      if (qmsData && response.data) {
        setQmsData({
          ...qmsData,
          nonConformances: [...qmsData.nonConformances, response.data]
        });
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Error adding non-conformance:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add non-conformance');
      return null;
    } finally {
      setLoading(false);
    }
  }, [qmsData]);

  /**
   * Update an existing non-conformance record
   */
  const updateNonConformance = useCallback(async (supplierId: string, ncId: string, ncData: any) => {
    try {
      setLoading(true);
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/suppliers/${supplierId}/quality-management/non-conformances/${ncId}`,
        ncData
      );
      
      // Update local state
      if (qmsData && response.data) {
        setQmsData({
          ...qmsData,
          nonConformances: qmsData.nonConformances.map(nc => 
            nc._id === ncId ? response.data : nc
          )
        });
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Error updating non-conformance:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update non-conformance');
      return null;
    } finally {
      setLoading(false);
    }
  }, [qmsData]);

  /**
   * Add a new quality document
   */
  const addQualityDocument = useCallback(async (supplierId: string, docData: any) => {
    try {
      setLoading(true);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/suppliers/${supplierId}/quality-management/documents`,
        docData
      );
      
      // Update local state
      if (qmsData && response.data) {
        setQmsData({
          ...qmsData,
          qualityDocuments: [...qmsData.qualityDocuments, response.data]
        });
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Error adding quality document:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add quality document');
      return null;
    } finally {
      setLoading(false);
    }
  }, [qmsData]);

  /**
   * Delete a quality document
   */
  const deleteQualityDocument = useCallback(async (supplierId: string, documentId: string) => {
    try {
      setLoading(true);
      
      await axios.delete(
        `${API_BASE_URL}/api/suppliers/${supplierId}/quality-management/documents/${documentId}`
      );
      
      // Update local state
      if (qmsData) {
        setQmsData({
          ...qmsData,
          qualityDocuments: qmsData.qualityDocuments.filter(doc => doc._id !== documentId)
        });
      }
      
      return true;
    } catch (err: any) {
      console.error('Error deleting quality document:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete quality document');
      return false;
    } finally {
      setLoading(false);
    }
  }, [qmsData]);

  /**
   * Synchronize with audit system
   */
  const syncAudits = useCallback(async (supplierId: string) => {
    try {
      setLoading(true);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/suppliers/${supplierId}/quality-management/sync-audits`
      );
      
      // Update local state with new audit history and compliance data
      if (response.data) {
        if (response.data.qmsData) {
          setQmsData(response.data.qmsData);
        }
        
        if (response.data.complianceSummary) {
          setComplianceSummary(response.data.complianceSummary);
        }
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Error syncing audits:', err);
      setError(err.response?.data?.message || err.message || 'Failed to sync with audit system');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    qmsData,
    complianceSummary,
    loading,
    error,
    fetchQMS,
    fetchComplianceSummary,
    updateMetric,
    addNonConformance,
    updateNonConformance,
    addQualityDocument,
    deleteQualityDocument,
    syncAudits
  };
};

export default useQualityManagement; 