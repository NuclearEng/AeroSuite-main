/**
 * ERP Service
 * 
 * Client service for interacting with the ERP API endpoints.
 */

import api from './api';

export interface ERPVendor {
  id: string | number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    zipCode?: string;
    country?: string;
  };
  status?: string;
  contactPerson?: string;
  paymentTerms?: string;
  type?: string;
}

export interface ERPInventoryItem {
  id: string | number;
  itemCode: string;
  name: string;
  description?: string;
  category?: string;
  uom?: string;
  quantity: number;
  reorderPoint?: number;
  unitCost?: number;
  supplier?: string;
  location?: string;
  lastUpdated?: string;
}

export interface ERPPurchaseOrder {
  id: string | number;
  poNumber: string;
  vendor: string;
  vendorName?: string;
  date: string;
  dueDate?: string;
  status: string;
  total: number;
  currency?: string;
  items: Array<{
    id: string | number;
    itemCode: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  notes?: string;
}

export interface ERPQualityInspection {
  id: string | number;
  inspectionNumber: string;
  type: string;
  itemCode: string;
  itemDescription?: string;
  supplierCode: string;
  supplierName?: string;
  quantity?: number;
  sampleSize?: number;
  inspector?: string;
  date: string;
  result: string;
  status: string;
  notes?: string;
  defects?: number;
}

export interface SyncOptions {
  filter?: Record<string, any>;
  params?: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  message: string;
  data: {
    entity: string;
    totalCount: number;
    successCount?: number;
    errorCount?: number;
    errors?: Array<{
      item: string;
      error: string;
    }>;
    newCount?: number;
    updatedCount?: number;
  };
}

const erpService = {
  /**
   * Get vendors/suppliers from ERP
   * 
   * @param params - Query parameters
   * @returns Promise with vendors data
   */
  getVendors: async (params: Record<string, any> = {}) => {
    const response = await api.get('/erp/vendors', { params });
    return response.data;
  },
  
  /**
   * Get inventory items from ERP
   * 
   * @param params - Query parameters
   * @returns Promise with inventory data
   */
  getInventory: async (params: Record<string, any> = {}) => {
    const response = await api.get('/erp/inventory', { params });
    return response.data;
  },
  
  /**
   * Get purchase orders from ERP
   * 
   * @param params - Query parameters
   * @returns Promise with purchase orders data
   */
  getPurchaseOrders: async (params: Record<string, any> = {}) => {
    const response = await api.get('/erp/purchase-orders', { params });
    return response.data;
  },
  
  /**
   * Get quality inspections from ERP
   * 
   * @param params - Query parameters
   * @returns Promise with quality inspections data
   */
  getQualityInspections: async (params: Record<string, any> = {}) => {
    const response = await api.get('/erp/quality-inspections', { params });
    return response.data;
  },
  
  /**
   * Create a vendor/supplier in the ERP system
   * 
   * @param vendor - Vendor data
   * @returns Promise with created vendor data
   */
  createVendor: async (vendor: Partial<ERPVendor>) => {
    const response = await api.post('/erp/vendors', vendor);
    return response.data;
  },
  
  /**
   * Update a vendor/supplier in the ERP system
   * 
   * @param id - Vendor ID
   * @param vendor - Updated vendor data
   * @returns Promise with updated vendor data
   */
  updateVendor: async (id: string | number, vendor: Partial<ERPVendor>) => {
    const response = await api.put(`/erp/vendors/${id}`, vendor);
    return response.data;
  },
  
  /**
   * Create a purchase order in the ERP system
   * 
   * @param purchaseOrder - Purchase order data
   * @returns Promise with created purchase order data
   */
  createPurchaseOrder: async (purchaseOrder: Partial<ERPPurchaseOrder>) => {
    const response = await api.post('/erp/purchase-orders', purchaseOrder);
    return response.data;
  },
  
  /**
   * Update a purchase order in the ERP system
   * 
   * @param id - Purchase order ID
   * @param purchaseOrder - Updated purchase order data
   * @returns Promise with updated purchase order data
   */
  updatePurchaseOrder: async (id: string | number, purchaseOrder: Partial<ERPPurchaseOrder>) => {
    const response = await api.put(`/erp/purchase-orders/${id}`, purchaseOrder);
    return response.data;
  },
  
  /**
   * Create a quality inspection in the ERP system
   * 
   * @param inspection - Inspection data
   * @returns Promise with created inspection data
   */
  createQualityInspection: async (inspection: Partial<ERPQualityInspection>) => {
    const response = await api.post('/erp/quality-inspections', inspection);
    return response.data;
  },
  
  /**
   * Update a quality inspection in the ERP system
   * 
   * @param id - Inspection ID
   * @param inspection - Updated inspection data
   * @returns Promise with updated inspection data
   */
  updateQualityInspection: async (id: string | number, inspection: Partial<ERPQualityInspection>) => {
    const response = await api.put(`/erp/quality-inspections/${id}`, inspection);
    return response.data;
  },
  
  /**
   * Sync suppliers from AeroSuite to ERP
   * 
   * @param options - Sync options
   * @returns Promise with sync results
   */
  syncSuppliersToERP: async (options: SyncOptions = {}): Promise<SyncResult> => {
    const response = await api.post('/erp/sync/suppliers/to-erp', options);
    return response.data;
  },
  
  /**
   * Sync inspections from AeroSuite to ERP
   * 
   * @param options - Sync options
   * @returns Promise with sync results
   */
  syncInspectionsToERP: async (options: SyncOptions = {}): Promise<SyncResult> => {
    const response = await api.post('/erp/sync/inspections/to-erp', options);
    return response.data;
  },
  
  /**
   * Sync vendors from ERP to AeroSuite
   * 
   * @param options - Sync options
   * @returns Promise with sync results
   */
  syncVendorsFromERP: async (options: SyncOptions = {}): Promise<SyncResult> => {
    const response = await api.post('/erp/sync/vendors/from-erp', options);
    return response.data;
  },
  
  /**
   * Sync inventory from ERP to AeroSuite
   * 
   * @param options - Sync options
   * @returns Promise with sync results
   */
  syncInventoryFromERP: async (options: SyncOptions = {}): Promise<SyncResult> => {
    const response = await api.post('/erp/sync/inventory/from-erp', options);
    return response.data;
  },
  
  /**
   * Sync purchase orders from ERP to AeroSuite
   * 
   * @param options - Sync options
   * @returns Promise with sync results
   */
  syncPurchaseOrdersFromERP: async (options: SyncOptions = {}): Promise<SyncResult> => {
    const response = await api.post('/erp/sync/purchase-orders/from-erp', options);
    return response.data;
  }
};

export default erpService; 