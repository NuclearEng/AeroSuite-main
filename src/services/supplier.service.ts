import { SupplierService, SupplierData, SupplierFormValues, SupplierListResponse } from '../types/supplier';
import api from './api';

class SupplierServiceImpl implements SupplierService {
  async getSupplier(id: string): Promise<SupplierData> {
    try {
      const response = await api.get<SupplierData>(`/suppliers/${id}`);
      return response;
    } catch (error) {
      console.error('Failed to get supplier:', error);
      throw error;
    }
  }

  async createSupplier(data: SupplierFormValues): Promise<SupplierData> {
    try {
      const response = await api.post<SupplierData>('/suppliers', data);
      return response;
    } catch (error) {
      console.error('Failed to create supplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, data: Partial<SupplierFormValues>): Promise<SupplierData> {
    try {
      const response = await api.put<SupplierData>(`/suppliers/${id}`, data);
      return response;
    } catch (error) {
      console.error('Failed to update supplier:', error);
      throw error;
    }
  }

  async deleteSupplier(id: string): Promise<void> {
    try {
      await api.delete(`/suppliers/${id}`);
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      throw error;
    }
  }

  async getSuppliers(params?: { page?: number; pageSize?: number }): Promise<SupplierListResponse> {
    try {
      const response = await api.get<SupplierListResponse>('/suppliers', { params });
      return response;
    } catch (error) {
      console.error('Failed to get suppliers:', error);
      throw error;
    }
  }
}

export const supplierService = new SupplierServiceImpl();