/**
 * @task TS008 - Client error reporting to server
 */
import api from './api';
import { AxiosResponse } from 'axios';

// Types
export interface ReportTemplate {
  _id: string;
  name: string;
  description?: string;
  keywords?: string;
  author?: string;
  createdBy: string;
  isPublic: boolean;
  category: 'inspection' | 'supplier' | 'customer' | 'performance' | 'general';
  sections: ReportSection[];
  filters?: ReportFilter[];
  sortOptions?: ReportSortOption[];
  pageOptions?: ReportPageOptions;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSection {
  _id?: string;
  title: string;
  description?: string;
  type: 'text' | 'table' | 'chart' | 'metrics' | 'image';
  content?: string;
  dataSource?: {
    model: 'Inspection' | 'Supplier' | 'Customer' | 'User' | 'Component';
    query: {
      filter?: Record<string, any>;
      populate?: string[];
      sort?: Record<string, 1 | -1>;
      limit?: number;
    };
  };
  columns?: {
    id: string;
    label: string;
    format?: 'text' | 'date' | 'number' | 'currency' | 'percentage' | 'boolean';
  }[];
  metrics?: {
    label: string;
    valueField: string;
    format?: 'text' | 'date' | 'number' | 'currency' | 'percentage' | 'boolean';
    trendField?: string;
  }[];
  chartOptions?: {
    type: 'bar' | 'line' | 'pie' | 'doughnut' | 'radar';
    xAxis?: string;
    yAxis?: string;
    title?: string;
  };
  data?: any[];
}

export interface ReportFilter {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'boolean';
  options?: {
    value: any;
    label: string;
  }[];
  default?: any;
  required?: boolean;
}

export interface ReportSortOption {
  field: string;
  label: string;
  default?: boolean;
  direction: 'asc' | 'desc';
}

export interface ReportPageOptions {
  size: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margin: number;
}

export interface DataSource {
  model: string;
  label: string;
  fields: {
    id: string;
    label: string;
    type: string;
  }[];
}

export interface GenerateReportOptions {
  templateId?: string;
  reportConfig?: ReportTemplate;
  filters?: Record<string, any>;
  download?: boolean;
}

export interface ReportResult {
  reportPath: string;
  reportUrl: string;
  reportName: string;
  generatedAt: string;
  format?: string;
}

// Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Cache for prefetched reports
const prefetchCache = new Map<string, Promise<any>>();

class ReportService {
  // Base URL for API calls
  private readonly baseUrl = '/reports';
  
  /**
   * Get available data sources for reports
   */
  async getDataSources(): Promise<DataSource[]> {
    try {
      // In a real implementation, this would call the API
      // For now, return mock data
      return [
        {
          model: 'Inspection',
          label: 'Inspections',
          fields: [
            { id: 'title', label: 'Title', type: 'string' },
            { id: 'status', label: 'Status', type: 'string' },
            { id: 'inspectionDate', label: 'Inspection Date', type: 'date' },
            { id: 'location', label: 'Location', type: 'string' },
            { id: 'inspector', label: 'Inspector', type: 'string' },
            { id: 'supplier', label: 'Supplier', type: 'string' },
            { id: 'findings', label: 'Findings Count', type: 'number' }
          ]
        },
        {
          model: 'Supplier',
          label: 'Suppliers',
          fields: [
            { id: 'name', label: 'Name', type: 'string' },
            { id: 'code', label: 'Code', type: 'string' },
            { id: 'status', label: 'Status', type: 'string' },
            { id: 'industry', label: 'Industry', type: 'string' },
            { id: 'primaryContactName', label: 'Primary Contact', type: 'string' },
            { id: 'primaryContactEmail', label: 'Email', type: 'string' },
            { id: 'phone', label: 'Phone', type: 'string' },
            { id: 'overallRating', label: 'Overall Rating', type: 'number' }
          ]
        },
        {
          model: 'Customer',
          label: 'Customers',
          fields: [
            { id: 'name', label: 'Name', type: 'string' },
            { id: 'industry', label: 'Industry', type: 'string' },
            { id: 'status', label: 'Status', type: 'string' },
            { id: 'contactName', label: 'Contact Name', type: 'string' },
            { id: 'contactEmail', label: 'Contact Email', type: 'string' },
            { id: 'totalOrders', label: 'Total Orders', type: 'number' },
            { id: 'totalRevenue', label: 'Total Revenue', type: 'number' }
          ]
        },
        {
          model: 'Component',
          label: 'Components',
          fields: [
            { id: 'name', label: 'Name', type: 'string' },
            { id: 'partNumber', label: 'Part Number', type: 'string' },
            { id: 'category', label: 'Category', type: 'string' },
            { id: 'supplier', label: 'Supplier', type: 'string' },
            { id: 'price', label: 'Price', type: 'number' },
            { id: 'stock', label: 'Stock', type: 'number' },
            { id: 'defectRate', label: 'Defect Rate', type: 'number' }
          ]
        },
        {
          model: 'User',
          label: 'Users',
          fields: [
            { id: 'name', label: 'Name', type: 'string' },
            { id: 'email', label: 'Email', type: 'string' },
            { id: 'role', label: 'Role', type: 'string' },
            { id: 'department', label: 'Department', type: 'string' },
            { id: 'lastLogin', label: 'Last Login', type: 'date' },
            { id: 'inspectionsCompleted', label: 'Inspections Completed', type: 'number' }
          ]
        }
      ];
    } catch (error: any) {
      console.error('Error fetching data sources:', error);
      throw this.handleError(error, 'Failed to fetch data sources');
    }
  }
  
  /**
   * Get a cache key for report options
   * @param templateId Template ID
   * @param filters Optional filters
   * @param format Optional format
   */
  private getCacheKey(templateId: string, filters?: Record<string, any>, format?: string): string {
    return `${templateId}-${JSON.stringify(filters || {})}-${format || 'pdf'}`;
  }
  
  /**
   * Prefetch report formats to improve perceived performance
   * @param templateId Report template ID
   * @param filters Optional filters
   */
  async prefetchReportFormats(templateId: string, filters?: Record<string, any>): Promise<void> {
    if (!templateId) return;
    
    // Don't prefetch if already in progress
    const pdfCacheKey = this.getCacheKey(templateId, filters, 'pdf');
    const excelCacheKey = this.getCacheKey(templateId, filters, 'excel');
    
    if (!prefetchCache.has(pdfCacheKey)) {
      // Start prefetching PDF in background (low priority)
      const pdfPromise = this.previewReport({
        templateId,
        filters,
        download: false
      }).catch(err => {
        // Silently fail prefetch
        console.debug('PDF prefetch failed:', err);
        return null;
      });
      
      prefetchCache.set(pdfCacheKey, pdfPromise);
      
      // Clean up cache after a while
      setTimeout(() => {
        prefetchCache.delete(pdfCacheKey);
      }, 5 * 60 * 1000); // 5 minutes
    }
    
    // No need to prefetch Excel for now as it's generated on-demand
  }
  
  /**
   * Get download URL for a report
   * @param templateId Report template ID
   * @param filters Optional filters
   */
  getDownloadUrl(templateId: string, filters?: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    queryParams.append('download', 'true');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(`filters[${key}]`, String(value));
        }
      });
    }
    
    return `${this.baseUrl}/generate?templateId=${templateId}&${queryParams.toString()}`;
  }
  
  /**
   * Get Excel download URL for a report
   * @param templateId Report template ID
   * @param filters Optional filters
   */
  getExcelDownloadUrl(templateId: string, filters?: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    queryParams.append('download', 'true');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(`filters[${key}]`, String(value));
        }
      });
    }
    
    return `${this.baseUrl}/export-excel?templateId=${templateId}&${queryParams.toString()}`;
  }
  
  /**
   * Generate a report
   */
  async generateReport(options: GenerateReportOptions): Promise<ReportResult> {
    try {
      const cacheKey = this.getCacheKey(
        options.templateId || '', 
        options.filters, 
        options.download ? 'download' : 'view'
      );
      
      // Check prefetch cache first
      const prefetchPromise = prefetchCache.get(cacheKey);
      if (prefetchPromise) {
        const prefetchResult = await prefetchPromise;
        if (prefetchResult) {
          return prefetchResult;
        }
        // If prefetch failed, continue with normal fetch
      }
      
      const response: AxiosResponse<ApiResponse<ReportResult>> = await api.post(
        `${this.baseUrl}/generate`, 
        options,
        {
          timeout: 30000, // Longer timeout for report generation
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error generating report:', error);
      throw this.handleError(error, 'Failed to generate report');
    }
  }
  
  /**
   * Preview a report
   */
  async previewReport(options: GenerateReportOptions): Promise<ReportResult> {
    try {
      const cacheKey = this.getCacheKey(options.templateId || '', options.filters);
      
      // Check prefetch cache first
      const prefetchPromise = prefetchCache.get(cacheKey);
      if (prefetchPromise) {
        const prefetchResult = await prefetchPromise;
        if (prefetchResult) {
          return prefetchResult;
        }
      }
      
      const previewOptions = { ...options, download: false };
      const response: AxiosResponse<ApiResponse<ReportResult>> = await api.post(
        `${this.baseUrl}/preview`, 
        previewOptions,
        {
          timeout: 30000, // Longer timeout for report generation
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error previewing report:', error);
      throw this.handleError(error, 'Failed to generate report preview');
    }
  }
  
  /**
   * Export a report to Excel
   */
  async exportToExcel(options: GenerateReportOptions): Promise<ReportResult> {
    try {
      const exportOptions = { ...options };
      const response: AxiosResponse<ApiResponse<ReportResult>> = await api.post(
        `${this.baseUrl}/export-excel`, 
        exportOptions,
        {
          timeout: 60000, // Even longer timeout for Excel export
        }
      );
      
      return response.data.data;
    } catch (error: any) {
      console.error('Error exporting to Excel:', error);
      throw this.handleError(error, 'Failed to export report to Excel');
    }
  }
  
  /**
   * Get all report templates
   */
  async getReportTemplates(): Promise<any[]> {
    try {
      const response: AxiosResponse<ApiResponse<any[]>> = await api.get(`${this.baseUrl}/templates`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching report templates:', error);
      throw this.handleError(error, 'Failed to fetch report templates');
    }
  }
  
  /**
   * Get report template by ID
   */
  async getReportTemplate(templateId: string): Promise<any> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await api.get(`${this.baseUrl}/templates/${templateId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching report template:', error);
      throw this.handleError(error, 'Failed to fetch report template');
    }
  }
  
  /**
   * Handle API errors with better messaging
   */
  private handleError(error: any, defaultMessage: string): Error {
    // Extract message from API response if available
    if (error.response && error.response.data) {
      const { message } = error.response.data;
      if (message) {
        return new Error(message);
      }
    }
    
    // Handle specific error codes
    if (error.code === 'ECONNABORTED') {
      return new Error('Report generation timed out. Please try again with simpler filters.');
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      return new Error('Network error. Please check your connection and try again.');
    }
    
    // Fallback to default message
    return new Error(defaultMessage);
  }

  async createReportTemplate(template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const response = await api.post<ReportTemplate>(`${this.baseUrl}/templates`, template);
    return response;
  }

  async updateReportTemplate(id: string, template: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const response = await api.put<ReportTemplate>(`${this.baseUrl}/templates/${id}`, template);
    return response;
  }

  async deleteReportTemplate(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/templates/${id}`);
  }
}

export default new ReportService(); 