import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api';

// Define types
export interface InspectionItem {
  id: string;
  name: string;
  result: 'pass' | 'fail' | 'n/a';
  notes?: string;
}

export interface Inspection {
  id: string;
  title: string;
  supplierId: string;
  supplierName?: string;
  scheduledDate: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo: string;
  items: InspectionItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface InspectionFilters {
  search?: string;
  status?: string;
  supplierId?: string;
  assignedTo?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  limit: number;
  sort?: string;
}

export interface InspectionState {
  inspections: Inspection[];
  selectedInspection: Inspection | null;
  loading: boolean;
  error: string | null;
  filters: InspectionFilters;
  totalCount: number;
}

// Initial state
const initialState: InspectionState = {
  inspections: [],
  selectedInspection: null,
  loading: false,
  error: null,
  filters: {
    page: 1,
    limit: 10,
  },
  totalCount: 0,
};

// Async actions
export const fetchInspections = createAsyncThunk(
  'inspections/fetchInspections',
  async (filters: InspectionFilters, { rejectWithValue }) => {
    try {
      const response = await api.get<{ inspections: Inspection[]; totalCount: number }>(
        '/inspections',
        {
          params: filters,
        }
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inspections');
    }
  }
);

export const fetchInspectionById = createAsyncThunk(
  'inspections/fetchInspectionById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<Inspection>(`/inspections/${id}`);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inspection');
    }
  }
);

export const createInspection = createAsyncThunk(
  'inspections/createInspection',
  async (inspectionData: Partial<Inspection>, { rejectWithValue }) => {
    try {
      const response = await api.post<Inspection>('/inspections', inspectionData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create inspection');
    }
  }
);

export const updateInspection = createAsyncThunk(
  'inspections/updateInspection',
  async ({ id, data }: { id: string; data: Partial<Inspection> }, { rejectWithValue }) => {
    try {
      const response = await api.put<Inspection>(`/inspections/${id}`, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update inspection');
    }
  }
);

export const deleteInspection = createAsyncThunk(
  'inspections/deleteInspection',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/inspections/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete inspection');
    }
  }
);

export const conductInspection = createAsyncThunk(
  'inspections/conductInspection',
  async (
    { id, items, notes, status }: { id: string; items: InspectionItem[]; notes?: string; status: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<Inspection>(`/inspections/${id}/conduct`, {
        items,
        notes,
        status,
      });
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to conduct inspection');
    }
  }
);

// Slice
const inspectionSlice = createSlice({
  name: 'inspection',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<InspectionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedInspection: (state) => {
      state.selectedInspection = null;
    },
    updateInspectionItem: (state, action: PayloadAction<{ index: number; item: Partial<InspectionItem> }>) => {
      if (state.selectedInspection && state.selectedInspection.items) {
        const { index, item } = action.payload;
        state.selectedInspection.items[index] = {
          ...state.selectedInspection.items[index],
          ...item,
        };
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch inspections
    builder
      .addCase(fetchInspections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInspections.fulfilled,
        (state, action: PayloadAction<{ inspections: Inspection[]; totalCount: number }>) => {
          state.loading = false;
          state.inspections = action.payload.inspections;
          state.totalCount = action.payload.totalCount;
        }
      )
      .addCase(fetchInspections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch inspection by ID
      .addCase(fetchInspectionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInspectionById.fulfilled, (state, action: PayloadAction<Inspection>) => {
        state.loading = false;
        state.selectedInspection = action.payload;
      })
      .addCase(fetchInspectionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create inspection
      .addCase(createInspection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createInspection.fulfilled, (state, action: PayloadAction<Inspection>) => {
        state.loading = false;
        state.inspections = [...state.inspections, action.payload];
        state.totalCount += 1;
      })
      .addCase(createInspection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update inspection
      .addCase(updateInspection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInspection.fulfilled, (state, action: PayloadAction<Inspection>) => {
        state.loading = false;
        state.inspections = state.inspections.map((inspection) =>
          inspection.id === action.payload.id ? action.payload : inspection
        );
        if (state.selectedInspection?.id === action.payload.id) {
          state.selectedInspection = action.payload;
        }
      })
      .addCase(updateInspection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete inspection
      .addCase(deleteInspection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInspection.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.inspections = state.inspections.filter(
          (inspection) => inspection.id !== action.payload
        );
        state.totalCount -= 1;
        if (state.selectedInspection?.id === action.payload) {
          state.selectedInspection = null;
        }
      })
      .addCase(deleteInspection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Conduct inspection
      .addCase(conductInspection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(conductInspection.fulfilled, (state, action: PayloadAction<Inspection>) => {
        state.loading = false;
        state.inspections = state.inspections.map((inspection) =>
          inspection.id === action.payload.id ? action.payload : inspection
        );
        state.selectedInspection = action.payload;
      })
      .addCase(conductInspection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setFilters, clearSelectedInspection, updateInspectionItem } =
  inspectionSlice.actions;
export default inspectionSlice.reducer; 