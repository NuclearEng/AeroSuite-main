import { useState, useEffect, useCallback } from 'react';
import supplierService, { SupplierAnalyticsData, SupplierPerformanceData } from '../../../services/supplier.service';

interface UseSupplierAnalyticsOptions {
  supplierId?: string;
  period?: '3months' | '6months' | '1year' | '2years';
  metrics?: string[];
}

export const useSupplierAnalytics = (options: UseSupplierAnalyticsOptions = {}) => {
  const {
    supplierId,
    period = '6months',
    metrics = ['quality', 'delivery', 'responsiveness', 'cost'],
  } = options;
  
  // State
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load supplier analytics data
  const loadAnalyticsData = useCallback(async () => {
    if (!supplierId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/suppliers/${supplierId}/metrics?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to load supplier metrics');
      }
      
      const data = await response.json();
      setAnalyticsData(data.data);
      
    } catch (err: any) {
      console.error('Error loading supplier analytics:', err);
      setError(err.message || 'Failed to load supplier analytics');
    } finally {
      setLoading(false);
    }
  }, [supplierId, period]);
  
  // Load analytics data when dependencies change
  useEffect(() => {
    if (supplierId) {
      loadAnalyticsData();
    }
  }, [loadAnalyticsData, supplierId, period]);
  
  // Calculate performance score (0-100)
  const calculatePerformanceScore = useCallback(() => {
    if (!analyticsData?.metrics) return 0;
    return analyticsData.metrics.overallScore || 0;
  }, [analyticsData]);
  
  // Get risk level based on performance score
  const getRiskLevel = useCallback(() => {
    if (!analyticsData?.riskAssessment) return 'medium';
    return analyticsData.riskAssessment.overallRisk || 'medium';
  }, [analyticsData]);
  
  // Get recommended actions based on risk level
  const getRecommendedActions = useCallback(() => {
    if (!analyticsData?.riskAssessment) return [];
    
    const actions = [];
    const riskLevel = getRiskLevel();
    
    if (riskLevel === 'high') {
      actions.push('Schedule urgent review meeting');
      actions.push('Increase inspection frequency');
      actions.push('Develop improvement plan');
    } else if (riskLevel === 'medium') {
      actions.push('Review key performance areas');
      actions.push('Monitor performance trends');
      actions.push('Schedule quarterly review meeting');
    } else {
      actions.push('Maintain current performance');
      actions.push('Consider expanding partnership');
    }
    
    // Add specific actions based on risk factors
    if (analyticsData.riskAssessment.factors) {
      analyticsData.riskAssessment.factors.forEach((factor: any) => {
        if (factor.level === 'high') {
          actions.push(`Address ${factor.name.toLowerCase()}`);
        }
      });
    }
    
    return actions;
  }, [analyticsData, getRiskLevel]);
  
  return {
    analyticsData,
    loading,
    error,
    period,
    metrics,
    loadAnalyticsData,
    calculatePerformanceScore,
    getRiskLevel,
    getRecommendedActions,
  };
}; 