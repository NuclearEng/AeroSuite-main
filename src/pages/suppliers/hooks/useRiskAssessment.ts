import { useState, useCallback } from 'react';
import { SupplierData } from '../../../types/supplier';
import { handleError } from '../../../utils/errorHandling';

interface RiskFactor {
  id: string;
  name: string;
  weight: number;
  description: string;
}

interface RiskAssessment {
  id: string;
  supplierId: string;
  date: string;
  score: number;
  factors: Array<{
    factorId: string;
    score: number;
    notes: string;
  }>;
  nextReviewDate: string;
  status: 'draft' | 'completed' | 'archived';
}

export function useRiskAssessment() {
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', handleError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRiskFactors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/risk-factors');
      const data = await response.json();
      setRiskFactors(data);
    } catch (error) {
      console.error('Error fetching default risk factors:', handleError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAssessments = useCallback(async (supplierId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/suppliers/${supplierId}/risk-assessments`);
      const data = await response.json();
      setAssessments(data);
    } catch (error) {
      console.error('Error fetching supplier assessments:', handleError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const getLatestAssessment = useCallback((supplierId: string): RiskAssessment | null => {
    const supplierAssessments = assessments.filter(a => a.supplierId === supplierId);
    if (supplierAssessments.length === 0) {
      return null;
    }

    const latestAssessment = supplierAssessments.sort((a: RiskAssessment, b: RiskAssessment) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];

    return latestAssessment;
  }, [assessments]);

  const saveAssessment = useCallback(async (assessment: RiskAssessment) => {
    try {
      setLoading(true);
      const response = await fetch('/api/risk-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assessment),
      });
      const data = await response.json();
      setAssessments(prev => [...prev, data]);
    } catch (error) {
      console.error('Error saving risk assessment:', handleError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAssessment = useCallback(async (assessmentId: string) => {
    try {
      setLoading(true);
      await fetch(`/api/risk-assessments/${assessmentId}`, {
        method: 'DELETE',
      });
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
    } catch (error) {
      console.error('Error deleting risk assessment:', handleError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suppliers,
    riskFactors,
    assessments,
    loading,
    fetchSuppliers,
    fetchRiskFactors,
    fetchAssessments,
    getLatestAssessment,
    saveAssessment,
    deleteAssessment,
  };
}