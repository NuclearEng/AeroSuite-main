import { useState, useEffect, useCallback } from 'react';
import supplierService, { Supplier, SupplierListParams } from '../../../services/supplier.service';

interface UseSupplierOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSearch?: string;
  initialFilters?: any[];
}

export const useSuppliers = (options: UseSupplierOptions = {}) => {
  const {
    initialPage = 0,
    initialLimit = 10,
    initialSearch = '',
    initialFilters = [],
  } = options;
  
  // State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState(initialFilters);
  
  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build params from filters
      const params: SupplierListParams = {
        page: page + 1, // API uses 1-based indexing
        limit,
        search,
      };
      
      // Add active filters to params
      filters.forEach((filter: any) => {
        if (filter.id === 'status') {
          params.status = filter.value;
        } else if (filter.id === 'industry') {
          params.industry = Array.isArray(filter.value) 
            ? filter.value.join(',') 
            : filter.value;
        } else if (filter.id === 'minRating') {
          params.minRating = Number(filter.value);
        }
      });
      
      const response = await supplierService.getSuppliers(params);
      
      setSuppliers(response.suppliers);
      setTotalCount(response.total);
    } catch (err: any) {
      console.error('Error loading suppliers:', err);
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filters]);
  
  // Load suppliers when parameters change
  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);
  
  // Handler for deleting a supplier
  const deleteSupplier = async (id: string) => {
    try {
      setLoading(true);
      await supplierService.deleteSupplier(id);
      
      // Remove from state
      setSuppliers(prevSuppliers => 
        prevSuppliers.filter(s => s._id !== id)
      );
      
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting supplier:', err);
      return { 
        success: false, 
        error: err.message || 'Failed to delete supplier' 
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Reset pagination when search or filters change
  useEffect(() => {
    setPage(0);
  }, [search, filters]);
  
  return {
    suppliers,
    totalCount,
    loading,
    error,
    page,
    limit,
    search,
    filters,
    setPage,
    setLimit,
    setSearch,
    setFilters,
    loadSuppliers,
    deleteSupplier,
  };
}; 