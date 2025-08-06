import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supplierService from '../services/supplier.service';
import { useSnackbar } from 'notistack';

/**
 * Best-in-class data hook for supplier operations
 * Implements caching, optimistic updates, error handling, and loading states
 */

// Query keys
const QUERY_KEYS = {
  suppliers: ['suppliers'] as const,
  supplier: (id: string) => ['supplier', id] as const,
  supplierMetrics: (id: string) => ['supplier', id, 'metrics'] as const,
  supplierPerformance: (id: string) => ['supplier', id, 'performance'] as const,
};

// Supplier list hook with pagination and filtering
export const useSuppliers = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.suppliers, params],
    queryFn: () => supplierService.getSuppliers(params || {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep previous data while fetching new page
  });
};

// Single supplier hook
export const useSupplier = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.supplier(id),
    queryFn: () => supplierService.getSupplier(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Supplier metrics hook
export const useSupplierMetrics = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.supplierMetrics(id),
    queryFn: () => supplierService.getSupplierMetrics(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // Metrics update less frequently
    cacheTime: 15 * 60 * 1000,
  });
};

// Create supplier mutation with optimistic updates
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: supplierService.createSupplier,
    onMutate: async (newSupplier) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.suppliers });

      // Snapshot previous value
      const previousSuppliers = queryClient.getQueryData(QUERY_KEYS.suppliers);

      // Optimistically update
      queryClient.setQueryData(QUERY_KEYS.suppliers, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          suppliers: [...old.suppliers, { ...newSupplier, _id: 'temp-' + Date.now() }],
          total: old.total + 1,
        };
      });

      return { previousSuppliers };
    },
    onError: (err, newSupplier, context) => {
      // Rollback on error
      if (context?.previousSuppliers) {
        queryClient.setQueryData(QUERY_KEYS.suppliers, context.previousSuppliers);
      }
      enqueueSnackbar('Failed to create supplier', { variant: 'error' });
    },
    onSuccess: () => {
      enqueueSnackbar('Supplier created successfully', { variant: 'success' });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
    },
  });
};

// Update supplier mutation
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      supplierService.updateSupplier(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.supplier(id) });

      // Snapshot previous value
      const previousSupplier = queryClient.getQueryData(QUERY_KEYS.supplier(id));

      // Optimistically update
      queryClient.setQueryData(QUERY_KEYS.supplier(id), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousSupplier, id };
    },
    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousSupplier) {
        queryClient.setQueryData(
          QUERY_KEYS.supplier(context.id),
          context.previousSupplier
        );
      }
      enqueueSnackbar('Failed to update supplier', { variant: 'error' });
    },
    onSuccess: (data, { id }) => {
      enqueueSnackbar('Supplier updated successfully', { variant: 'success' });
      // Update in list view as well
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.supplier(id) });
    },
  });
};

// Delete supplier mutation
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: supplierService.deleteSupplier,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.suppliers });

      const previousSuppliers = queryClient.getQueryData(QUERY_KEYS.suppliers);

      // Optimistically remove from list
      queryClient.setQueryData(QUERY_KEYS.suppliers, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          suppliers: old.suppliers.filter((s: any) => s._id !== id),
          total: old.total - 1,
        };
      });

      return { previousSuppliers };
    },
    onError: (err, id, context) => {
      if (context?.previousSuppliers) {
        queryClient.setQueryData(QUERY_KEYS.suppliers, context.previousSuppliers);
      }
      enqueueSnackbar('Failed to delete supplier', { variant: 'error' });
    },
    onSuccess: () => {
      enqueueSnackbar('Supplier deleted successfully', { variant: 'success' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
    },
  });
};

// Prefetch supplier data
export const usePrefetchSupplier = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.supplier(id),
      queryFn: () => supplierService.getSupplier(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

// Bulk operations
export const useBulkDeleteSuppliers = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: (ids: string[]) => 
      Promise.all(ids.map(id => supplierService.deleteSupplier(id))),
    onSuccess: (data, ids) => {
      enqueueSnackbar(`Successfully deleted ${ids.length} suppliers`, { 
        variant: 'success' 
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.suppliers });
    },
    onError: () => {
      enqueueSnackbar('Failed to delete some suppliers', { variant: 'error' });
    },
  });
};

export default {
  useSuppliers,
  useSupplier,
  useSupplierMetrics,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  usePrefetchSupplier,
  useBulkDeleteSuppliers,
};