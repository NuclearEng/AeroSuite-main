import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// Define types
export interface Supplier {
  id: string;
  name: string;
  email: string;
  contactPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  status: 'active' | 'inactive' | 'pending' | 'blocked';
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFilters {
  search?: string;
  status?: string;
  page: number;
  limit: number;
  sort?: string;
}

export interface SupplierState {
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  loading: boolean;
  error: string | null;
  filters: SupplierFilters;
  totalCount: number;
}

// Initial state
const initialState: SupplierState = {
  suppliers: [],
  selectedSupplier: null,
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
  },
  totalCount: 0,
};

// Async actions
export const fetchSuppliers = createAsyncThunk(
  'suppliers/fetchSuppliers',
  async (filters: SupplierFilters, { rejectWithValue }) => {
    try {
      const response = await api.get<{ suppliers: Supplier[]; totalCount: number }>('/suppliers', {
        params: filters,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch suppliers');
    }
  }
);

export const fetchSupplierById = createAsyncThunk(
  'suppliers/fetchSupplierById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Supplier>(`/suppliers/${id}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch supplier');
    }
  }
);

export const createSupplier = createAsyncThunk(
  'suppliers/createSupplier',
  async (supplierData: Partial<Supplier>, { rejectWithValue }) => {
    try {
      const response = await api.post<Supplier>('/suppliers', supplierData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create supplier');
    }
  }
);

export const updateSupplier = createAsyncThunk(
  'suppliers/updateSupplier',
  async ({ id, data }: { id: string; data: Partial<Supplier> }, { rejectWithValue }) => {
    try {
      const response = await api.put<Supplier>(`/suppliers/${id}`, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update supplier');
    }
  }
);

export const deleteSupplier = createAsyncThunk(
  'suppliers/deleteSupplier',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/suppliers/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete supplier');
    }
  }
);

// Slice
const supplierSlice = createSlice({
  name: 'supplier',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<SupplierFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedSupplier: (state) => {
      state.selectedSupplier = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch suppliers
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSuppliers.fulfilled,
        (state, action: PayloadAction<{ suppliers: Supplier[]; totalCount: number }>) => {
          state.loading = false;
          state.suppliers = action.payload.suppliers;
          state.totalCount = action.payload.totalCount;
        }
      )
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch supplier by ID
      .addCase(fetchSupplierById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupplierById.fulfilled, (state, action: PayloadAction<Supplier>) => {
        state.loading = false;
        state.selectedSupplier = action.payload;
      })
      .addCase(fetchSupplierById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create supplier
      .addCase(createSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSupplier.fulfilled, (state, action: PayloadAction<Supplier>) => {
        state.loading = false;
        state.suppliers = [...state.suppliers, action.payload];
        state.totalCount += 1;
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update supplier
      .addCase(updateSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSupplier.fulfilled, (state, action: PayloadAction<Supplier>) => {
        state.loading = false;
        state.suppliers = state.suppliers.map((supplier) =>
          supplier.id === action.payload.id ? action.payload : supplier
        );
        if (state.selectedSupplier?.id === action.payload.id) {
          state.selectedSupplier = action.payload;
        }
      })
      .addCase(updateSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete supplier
      .addCase(deleteSupplier.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSupplier.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.suppliers = state.suppliers.filter((supplier) => supplier.id !== action.payload);
        state.totalCount -= 1;
        if (state.selectedSupplier?.id === action.payload) {
          state.selectedSupplier = null;
        }
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, clearSelectedSupplier } = supplierSlice.actions;
export default supplierSlice.reducer; 