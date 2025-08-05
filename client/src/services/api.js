import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:9999/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Handle token expiration
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Redirect to login page if token is expired
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Handle server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// API service methods
const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
  },
  
  // Supplier endpoints
  suppliers: {
    getAll: (params) => api.get('/suppliers', { params }),
    getById: (id) => api.get(`/suppliers/${id}`),
    create: (data) => api.post('/suppliers', data),
    update: (id, data) => api.put(`/suppliers/${id}`, data),
    delete: (id) => api.delete(`/suppliers/${id}`),
    getContacts: (id) => api.get(`/suppliers/${id}/contacts`),
    addContact: (id, data) => api.post(`/suppliers/${id}/contacts`, data),
    updateContact: (supplierId, contactId, data) => 
      api.put(`/suppliers/${supplierId}/contacts/${contactId}`, data),
    deleteContact: (supplierId, contactId) => 
      api.delete(`/suppliers/${supplierId}/contacts/${contactId}`),
    getQualifications: (id) => api.get(`/suppliers/${id}/qualifications`),
    addQualification: (id, data) => api.post(`/suppliers/${id}/qualifications`, data),
    updateQualification: (supplierId, qualificationId, data) => 
      api.put(`/suppliers/${supplierId}/qualifications/${qualificationId}`, data),
    deleteQualification: (supplierId, qualificationId) => 
      api.delete(`/suppliers/${supplierId}/qualifications/${qualificationId}`),
  },
  
  // Customer endpoints
  customers: {
    getAll: (params) => api.get('/customers', { params }),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
  },
  
  // Inspection endpoints
  inspections: {
    getAll: (params) => api.get('/inspections', { params }),
    getById: (id) => api.get(`/inspections/${id}`),
    create: (data) => api.post('/inspections', data),
    update: (id, data) => api.put(`/inspections/${id}`, data),
    delete: (id) => api.delete(`/inspections/${id}`),
  },
  
  // Dashboard endpoints
  dashboard: {
    getSummary: () => api.get('/dashboard/summary'),
    getSupplierStats: () => api.get('/dashboard/supplier-stats'),
    getCustomerStats: () => api.get('/dashboard/customer-stats'),
    getInspectionStats: () => api.get('/dashboard/inspection-stats'),
  },
  
  // Utility methods
  utils: {
    healthCheck: () => api.get('/health'),
    getMetrics: () => api.get('/monitoring/metrics'),
  }
};

export default apiService; 