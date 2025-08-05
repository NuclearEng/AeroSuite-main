export interface SupplierAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface SupplierFormValues {
  name: string;
  code: string;
  description: string;
  industry: string;
  status: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: SupplierAddress;
  qualifications: string[];
  certifications: string[];
  notes: string;
  supplierTags: string[];
}

export interface SupplierData extends SupplierFormValues {
  id: string;
}

export interface SupplierListResponse {
  data: SupplierData[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SupplierService {
  getSupplier(id: string): Promise<SupplierData>;
  createSupplier(data: SupplierFormValues): Promise<SupplierData>;
  updateSupplier(id: string, data: Partial<SupplierFormValues>): Promise<SupplierData>;
  deleteSupplier(id: string): Promise<void>;
  getSuppliers(params?: { page?: number; pageSize?: number }): Promise<SupplierListResponse>;
}