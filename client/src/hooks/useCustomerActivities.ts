import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export interface CustomerActivity {
  _id: string;
  customerId: string;
  activityType: string;
  title: string;
  description?: string;
  performedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  relatedEntities?: {
    inspection?: {
      _id: string;
      inspectionNumber: string;
      title: string;
    };
    supplier?: {
      _id: string;
      name: string;
      code: string;
    };
    document?: string;
  };
  metadata?: Record<string, any>;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UseCustomerActivitiesProps {
  customerId: string | null;
  page?: number;
  limit?: number;
  activityType?: string;
}

interface UseCustomerActivitiesResult {
  activities: CustomerActivity[];
  loading: boolean;
  error: string | null;
  pagination: Pagination;
  fetchActivities: (page?: number, limit?: number, activityType?: string) => Promise<void>;
}

export function useCustomerActivities({
  customerId,
  page = 1,
  limit = 10,
  activityType
}: UseCustomerActivitiesProps): UseCustomerActivitiesResult {
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page,
    limit,
    total: 0,
    pages: 0
  });

  const fetchActivities = useCallback(
    async (newPage = page, newLimit = limit, newActivityType = activityType) => {
      if (!customerId) return;

      setLoading(true);
      setError(null);

      try {
        let url = `${API_BASE_URL}/api/customers/${customerId}/activities?page=${newPage}&limit=${newLimit}`;
        
        if (newActivityType) {
          url += `&activityType=${newActivityType}`;
        }

        const response = await axios.get(url);

        if (response.data.success) {
          setActivities(response.data.data);
          setPagination(response.data.pagination);
        } else {
          setError(response.data.message || 'Failed to fetch activities');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    },
    [customerId]
  );

  useEffect(() => {
    if (customerId) {
      fetchActivities(page, limit, activityType);
    }
  }, [customerId, page, limit, activityType, fetchActivities]);

  return {
    activities,
    loading,
    error,
    pagination,
    fetchActivities
  };
}

export default useCustomerActivities; 