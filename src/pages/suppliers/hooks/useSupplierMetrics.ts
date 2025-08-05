import { useState, useCallback } from 'react';
import { handleError } from '../../../utils/errorHandling';

interface SupplierMetrics {
  id: string;
  supplierId: string;
  period: string;
  metrics: {
    qualityScore: number;
    deliveryScore: number;
    responseTime: number;
    defectRate: number;
    onTimeDelivery: number;
    costSavings: number;
    innovationScore: number;
    sustainabilityScore: number;
  };
}

export function useSupplierMetrics() {
  const [metrics, setMetrics] = useState<SupplierMetrics[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async (supplierId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/suppliers/${supplierId}/metrics`);
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching supplier metrics:', handleError(error));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    metrics,
    loading,
    fetchMetrics,
  };
}