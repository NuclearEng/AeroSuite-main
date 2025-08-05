import api from './api';

export interface Inspection {
  _id: string;
  title: string;
  type: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduledDate: string;
  completedDate?: string;
  customerId: string;
  customerName?: string;
  supplierId?: string | null;
  supplierName?: string;
  location: string;
  description?: string;
  notes?: string;
  findings?: Array<{
    category: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    status: 'open' | 'in-progress' | 'resolved';
  }>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  assignedTo?: string;
  assignedToName?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InspectionFilters {
  search?: string;
  status?: string | string[];
  type?: string | string[];
  priority?: string | string[];
  customerId?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InspectionListResponse {
  inspections: Inspection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class InspectionService {
  /**
   * Get list of inspections with pagination and filtering
   */
  async getInspections(filters: InspectionFilters = {}): Promise<InspectionListResponse> {
    const response = await api.get('/api/v1/inspections', { params: filters });
    return response;
  }

  /**
   * Get an inspection by ID
   */
  async getInspection(id: string): Promise<Inspection> {
    const response = await api.get(`/api/v1/inspections/${id}`);
    return response;
  }

  /**
   * Create a new inspection
   */
  async createInspection(inspectionData: Omit<Inspection, '_id' | 'createdAt' | 'updatedAt'>): Promise<Inspection> {
    const response = await api.post('/api/v1/inspections', inspectionData);
    return response;
  }

  /**
   * Update an existing inspection
   */
  async updateInspection(id: string, inspectionData: Partial<Inspection>): Promise<Inspection> {
    const response = await api.put(`/api/v1/inspections/${id}`, inspectionData);
    return response;
  }

  /**
   * Delete an inspection
   */
  async deleteInspection(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/v1/inspections/${id}`);
    return response;
  }

  /**
   * Add a finding to an inspection
   */
  async addFinding(inspectionId: string, finding: {
    category: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    status: 'open' | 'in-progress' | 'resolved';
  }): Promise<Inspection> {
    const response = await api.post(`/api/v1/inspections/${inspectionId}/findings`, finding);
    return response;
  }

  /**
   * Update a finding in an inspection
   */
  async updateFinding(
    inspectionId: string, 
    findingIndex: number, 
    finding: Partial<{
      category: string;
      description: string;
      severity: 'minor' | 'major' | 'critical';
      status: 'open' | 'in-progress' | 'resolved';
    }>
  ): Promise<Inspection> {
    const response = await api.put(`/api/v1/inspections/${inspectionId}/findings/${findingIndex}`, finding);
    return response;
  }

  /**
   * Upload attachment to an inspection
   */
  async uploadAttachment(inspectionId: string, file: File): Promise<Inspection> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/v1/inspections/${inspectionId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response;
  }

  /**
   * Delete attachment from an inspection
   */
  async deleteAttachment(inspectionId: string, attachmentId: string): Promise<Inspection> {
    const response = await api.delete(`/api/v1/inspections/${inspectionId}/attachments/${attachmentId}`);
    return response;
  }

  /**
   * Get inspection statistics
   */
  async getInspectionStats(): Promise<{
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    byType: { [type: string]: number };
    byPriority: { [priority: string]: number };
  }> {
    const response = await api.get('/api/v1/inspections/stats');
    return response;
  }

/**
 * Generate an inspection report
 * @param id Inspection ID
 * @param options Report generation options
 * @returns Report data including URL
 */
  async generateInspectionReport(
  id: string,
  options: { 
    download?: boolean;
    includePhotos?: boolean;
    includeSignatures?: boolean;
  } = {}
  ): Promise<any> {
  try {
    const queryParams = new URLSearchParams();
    
    if (options.download) {
      queryParams.append('download', 'true');
    }
    
    if (options.includePhotos) {
      queryParams.append('includePhotos', 'true');
    }
    
    if (options.includeSignatures) {
      queryParams.append('includeSignatures', 'true');
    }
    
    const queryString = queryParams.toString();
      const url = `/api/v1/inspections/${id}/report${queryString ? `?${queryString}` : ''}`;
    
    if (options.download) {
      // If download is true, open in a new window to trigger browser download
      window.open(url, '_blank');
      return { success: true, message: 'Report download initiated' };
    } else {
      // Otherwise make a normal API call and return the result
      const response = await api.get(url);
      return response;
    }
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

  /**
   * Schedule a follow-up inspection based on an existing inspection
   * This is a domain-specific operation that triggers domain events
   */
  async scheduleFollowUp(
    inspectionId: string, 
    followUpData: {
      scheduledDate: string;
      notes?: string;
      type?: string;
    }
  ): Promise<Inspection> {
    try {
      const response = await api.post(`/api/v1/inspections/${inspectionId}/follow-up`, followUpData);
      return response;
    } catch (error) {
      console.error(`Error scheduling follow-up for inspection ${inspectionId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update inspection status
   * This is a domain-specific operation that triggers domain events
   */
  async updateStatus(
    id: string, 
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled',
    notes?: string
  ): Promise<Inspection> {
    try {
      const response = await api.patch(`/api/v1/inspections/${id}/status`, { status, notes });
      return response;
    } catch (error) {
      console.error(`Error updating status for inspection ${id}:`, error);
      throw error;
    }
  }
}

export default new InspectionService(); 