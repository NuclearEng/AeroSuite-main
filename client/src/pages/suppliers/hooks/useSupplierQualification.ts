import { useState, useEffect } from 'react';
import supplierService from '../../../services/supplier.service';

export interface QualificationData {
  supplierId: string;
  qualificationLevel: string;
  certifiedSince: string;
  expiryDate: string;
  certifications: {
    name: string;
    issuedDate: string;
    expiryDate: string;
    status: 'active' | 'expired' | 'pending';
    verificationDate: string;
  }[];
  auditHistory: {
    date: string;
    type: string;
    result: string;
    auditor: string;
    findings: number;
    criticalFindings: number;
  }[];
  requirements: {
    name: string;
    status: 'Completed' | 'In Progress' | 'Pending' | 'Overdue';
    dueDate: string;
    nextDueDate: string;
  }[];
}

export interface UseSupplierQualificationReturn {
  qualificationData: QualificationData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useSupplierQualification = (supplierId: string | undefined): UseSupplierQualificationReturn => {
  const [qualificationData, setQualificationData] = useState<QualificationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQualificationData = async () => {
    if (!supplierId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await supplierService.getSupplierQualification(supplierId);
      setQualificationData(data);
    } catch (err: any) {
      console.error('Error fetching supplier qualification data:', err);
      setError(err.message || 'Failed to load qualification data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualificationData();
  }, [supplierId]);

  return {
    qualificationData,
    loading,
    error,
    refresh: fetchQualificationData
  };
};

export default useSupplierQualification;