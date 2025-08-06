import api from './api';

// Types
export interface Supplier {
  _id: string;
  name: string;
  code: string;
  industry: string;
  status: 'active' | 'inactive' | 'pending';
  primaryContactName: string;
  primaryContactEmail: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  website?: string;
  logo?: string;
  description?: string;
  tags?: string[];
  overallRating?: number;
  certifications?: {
    name: string;
    issuedDate: Date;
    expiryDate?: Date;
    status: 'active' | 'expired' | 'pending';
    documentUrl?: string;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
  // Additional properties used in SupplierNetwork visualization
  tier?: string;
  customers?: Array<{ _id: string; name: string; industry?: string }>;
}

export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  industry?: string;
  minRating?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SupplierListResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSupplierData {
  name: string;
  code: string;
  industry: string;
  status: 'active' | 'inactive' | 'pending';
  primaryContactName: string;
  primaryContactEmail: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  website?: string;
  logo?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {}

export interface SupplierAnalyticsData {
  supplierId: string;
  metrics: {
    quality: number;
    delivery: number;
    responsiveness: number;
    cost: number;
    [key: string]: number;
  };
  trends?: {
    quality?: { date: string; value: number }[];
    delivery?: { date: string; value: number }[];
    responsiveness?: { date: string; value: number }[];
    cost?: { date: string; value: number }[];
    [key: string]: { date: string; value: number }[] | undefined;
  };
  comparisonData?: {
    industryAverage: {
      quality: number;
      delivery: number;
      responsiveness: number;
      cost: number;
      [key: string]: number;
    };
    topPerformer: {
      quality: number;
      delivery: number;
      responsiveness: number;
      cost: number;
      [key: string]: number;
    };
  };
  lastUpdated: string;
}

export interface SupplierPerformanceData {
  supplierId: string;
  performanceHistory: {
    period: string;
    score: number;
    rating: 'excellent' | 'good' | 'average' | 'poor';
    details: {
      inspectionsPassed: number;
      inspectionsTotal: number;
      deliveriesOnTime: number;
      deliveriesTotal: number;
      qualityIssues: number;
    };
  }[];
  riskFactors: {
    name: string;
    level: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    description: string;
  }[];
  qualificationStatus: {
    certified: boolean;
    level: string;
    expiryDate?: string;
    requiredActions?: string[];
  };
}

class SupplierService {
  /**
   * Get a list of suppliers with optional filtering
   */
  async getSuppliers(params?: SupplierListParams): Promise<SupplierListResponse> {
    try {
      const response = await api.get('/api/v1/suppliers', { params });
      return response as any;
    } catch (_error) {
      console.error('Error fetching suppliers:', _error);
      throw _error;
    }
  }

  /**
   * Get a supplier by ID
   */
  async getSupplier(id: string): Promise<Supplier> {
    try {
      const response = await api.get(`/api/v1/suppliers/${id}`);
      return response as any;
    } catch (error) {
      console.error(`Error fetching supplier with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new supplier
   */
  async createSupplier(data: CreateSupplierData): Promise<Supplier> {
    try {
      const response = await api.post('/api/v1/suppliers', data);
      return response as any;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  /**
   * Update an existing supplier
   */
  async updateSupplier(id: string, data: UpdateSupplierData): Promise<Supplier> {
    try {
      const response = await api.put(`/api/v1/suppliers/${id}`, data);
      return response as any;
    } catch (error) {
      console.error(`Error updating supplier with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a supplier
   */
  async deleteSupplier(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/suppliers/${id}`);
    } catch (error) {
      console.error(`Error deleting supplier with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Upload a supplier logo
   */
  async uploadLogo(id: string, file: File): Promise<{ logoUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await api.post(`/api/v1/suppliers/${id}/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response as any;
    } catch (error) {
      console.error(`Error uploading logo for supplier with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get supplier analytics data
   */
  async getSupplierAnalytics(
    id: string, 
    options: { period?: 'month' | 'quarter' | 'year'; metrics?: string[] } = {}
  ): Promise<SupplierAnalyticsData> {
    try {
      const response = await api.get(`/api/v1/suppliers/${id}/analytics`, { params: options });
      return response as any;
    } catch (error) {
      console.error(`Error fetching analytics for supplier with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get supplier performance data
   */
  async getSupplierPerformance(
    id: string,
    options: { period?: 'month' | 'quarter' | 'year' } = {}
  ): Promise<SupplierPerformanceData> {
    try {
      const response = await api.get(`/api/v1/suppliers/${id}/performance`, { params: options });
      return response as any;
    } catch (error) {
      console.error(`Error fetching performance data for supplier with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get supplier qualification data
   */
  async getSupplierQualification(id: string): Promise<any> {
    try {
      const response = await api.get(`/api/v1/suppliers/${id}/qualification`);
      return response as any;
    } catch (error) {
      console.error(`Error fetching qualification data for supplier with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get inspections for a supplier
   */
  async getSupplierInspections(id: string, params?: { page?: number; limit?: number }): Promise<any> {
    try {
      const response = await api.get(`/api/v1/suppliers/${id}/inspections`, { params });
      return response as any;
    } catch (error) {
      console.error(`Error fetching inspections for supplier with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Associate a supplier with a customer
   * This is a domain-specific operation that triggers domain events
   */
  async associateWithCustomer(supplierId: string, customerId: string, data?: { 
    relationshipType?: 'primary' | 'secondary' | 'backup';
    notes?: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/api/v1/suppliers/${supplierId}/customers/${customerId}`, data);
      return response as any;
    } catch (error) {
      console.error(`Error associating supplier ${supplierId} with customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Disassociate a supplier from a customer
   * This is a domain-specific operation that triggers domain events
   */
  async disassociateFromCustomer(supplierId: string, customerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/api/v1/suppliers/${supplierId}/customers/${customerId}`);
      return response as any;
    } catch (error) {
      console.error(`Error disassociating supplier ${supplierId} from customer ${customerId}:`, error);
      throw error;
    }
  }

  /**
   * Update supplier status
   * This is a domain-specific operation that triggers domain events
   */
  async updateStatus(id: string, status: 'active' | 'inactive' | 'pending', reason?: string): Promise<Supplier> {
    try {
      const response = await api.patch(`/api/v1/suppliers/${id}/status`, { status, reason });
      return response as any;
    } catch (error) {
      console.error(`Error updating status for supplier with ID ${id}:`, error);
      throw error;
    }
  }
}

export default new SupplierService(); 