import api from './api';
import type { ApiResponse, ApiResponseData } from '../types/api';

// Customer interfaces
export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CustomerContact {
  name: string;
  email: string;
  phone: string;
  title?: string;
  isPrimary?: boolean;
}

export interface Customer {
  _id: string;
  name: string;
  code: string;
  description?: string;
  industry: string;
  status: 'active' | 'inactive' | 'pending';
  website?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  phone?: string;
  serviceLevel?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  code: string;
  description?: string;
  industry: string;
  status: 'active' | 'inactive' | 'pending';
  website?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  phone?: string;
  serviceLevel?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags?: string[];
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export interface CustomerFilters {
  search?: string;
  industry?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Order interfaces
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'refunded';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateOrderData {
  customerId: string;
  items: OrderItem[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentStatus?: 'pending' | 'paid' | 'overdue' | 'refunded';
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'overdue' | 'refunded';
}

class CustomerService {
  /**
   * Get list of customers with pagination and filtering
   */
  async getCustomers(filters: CustomerFilters = {}): Promise<CustomerListResponse> {
    const response = await api.get<ApiResponseData<CustomerListResponse>>('/api/v1/customers', { params: filters });
    return response;
  }

  /**
   * Get a customer by ID
   */
  async getCustomer(id: string): Promise<Customer> {
    const response = await api.get<ApiResponseData<Customer>>(`/api/v1/customers/${id}`);
    return response;
  }

  /**
   * Create a new customer
   */
  async createCustomer(customerData: CreateCustomerData): Promise<Customer> {
    const response = await api.post<ApiResponseData<Customer>>('/api/v1/customers', customerData);
    return response;
  }

  /**
   * Update an existing customer
   */
  async updateCustomer(id: string, customerData: UpdateCustomerData): Promise<Customer> {
    const response = await api.put<ApiResponseData<Customer>>(`/api/v1/customers/${id}`, customerData);
    return response;
  }

  /**
   * Delete a customer
   */
  async deleteCustomer(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<ApiResponseData<{ success: boolean; message: string }>>(`/api/v1/customers/${id}`);
    return response;
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    pending: number;
    byIndustry: { [industry: string]: number };
  }> {
    const response = await api.get<ApiResponseData<{
      total: number;
      active: number;
      inactive: number;
      pending: number;
      byIndustry: { [industry: string]: number };
    }>>('/api/v1/customers/stats');
    return response;
  }

  /**
   * Get orders for a specific customer
   */
  async getCustomerOrders(customerId: string, params: { page?: number; limit?: number } = {}): Promise<OrderListResponse> {
    const response = await api.get<ApiResponseData<OrderListResponse>>(`/api/v1/customers/${customerId}/orders`, { params });
    return response;
  }

  /**
   * Get all orders
   */
  async getAllOrders(params: { page?: number; limit?: number; status?: string } = {}): Promise<OrderListResponse> {
    const response = await api.get<ApiResponseData<OrderListResponse>>('/api/v1/orders', { params });
    return response;
  }

  /**
   * Get order by ID
   */
  async getOrder(id: string): Promise<Order> {
    const response = await api.get<ApiResponseData<Order>>(`/api/v1/orders/${id}`);
    return response;
  }

  /**
   * Create a new order
   */
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const response = await api.post<ApiResponseData<Order>>('/api/v1/orders', orderData);
    return response;
  }

  /**
   * Update an existing order
   */
  async updateOrder(id: string, orderData: UpdateOrderData): Promise<Order> {
    const response = await api.put<ApiResponseData<Order>>(`/api/v1/orders/${id}`, orderData);
    return response;
  }

  /**
   * Delete an order
   */
  async deleteOrder(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<ApiResponseData<{ success: boolean; message: string }>>(`/api/v1/orders/${id}`);
    return response;
  }
}

export default new CustomerService();