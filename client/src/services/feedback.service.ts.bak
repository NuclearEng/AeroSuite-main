/**
 * Feedback Service
 * 
 * Client service for interacting with the feedback API
 * 
 * @task TS379 - Customer feedback collection system
 */

import api from './api';

export interface FeedbackSubmission {
  feedbackType: string;
  title?: string;
  content: string;
  rating?: number;
  source: string;
  context?: {
    page?: string;
    feature?: string;
    metadata?: Record<string, any>;
  };
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    allowContact?: boolean;
  };
  customer?: string;
}

export interface Feedback {
  _id: string;
  feedbackType: string;
  title?: string;
  content: string;
  rating?: number;
  source: string;
  context?: {
    page?: string;
    feature?: string;
    metadata?: Record<string, any>;
  };
  contactInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    allowContact?: boolean;
  };
  customer?: {
    _id: string;
    name: string;
  };
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  priority: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sentiment?: {
    score: number;
    magnitude: number;
    label: 'positive' | 'negative' | 'neutral' | 'mixed';
    analyzed: boolean;
  };
  tags: string[];
  isAddressed: boolean;
  isFeatured: boolean;
  isAnonymous: boolean;
  attachments: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  }>;
  internalNotes: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    content: string;
    createdAt: string;
  }>;
  response?: {
    content: string;
    respondedBy: {
      _id: string;
      firstName: string;
      lastName: string;
    };
    respondedAt: string;
    isPublic: boolean;
  };
  userAgent?: {
    browser: string;
    device: string;
    os: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackUpdateData {
  status?: string;
  priority?: string;
  assignedTo?: string;
  tags?: string[];
  isAddressed?: boolean;
  isFeatured?: boolean;
  note?: string;
  response?: {
    content: string;
    isPublic: boolean;
  };
}

export interface FeedbackStatistics {
  byType: Array<{ _id: string; count: number }>;
  byRating: Array<{ _id: number; count: number }>;
  byStatus: Array<{ _id: string; count: number }>;
  averageRating: Array<{ _id: null; avg: number }>;
  totalCount: Array<{ count: number }>;
  recentTrend: Array<{ _id: string; count: number; avgRating: number }>;
}

export interface FeedbackListResponse {
  data: Feedback[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FeedbackFilterOptions {
  page?: number;
  limit?: number;
  sort?: string;
  status?: string;
  feedbackType?: string;
  customer?: string;
  source?: string;
  minRating?: number;
  maxRating?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  tags?: string | string[];
  isAddressed?: boolean;
  assignedTo?: string;
}

class FeedbackService {
  /**
   * Submit feedback
   */
  async submitFeedback(data: FormData): Promise<Feedback> {
    const response = await api.post('/feedback', data);
    return (response as any).data;
  }
  
  /**
   * Get feedback by ID
   */
  async getFeedback(id: string): Promise<Feedback> {
    const response = await api.get(`/feedback/${id}`);
    return (response as any).data;
  }
  
  /**
   * Get all feedback with filtering and pagination
   */
  async getAllFeedback(options: FeedbackFilterOptions = {}): Promise<FeedbackListResponse> {
    const response = await api.get('/feedback', { params: options });
    return response as any;
  }
  
  /**
   * Update feedback
   */
  async updateFeedback(id: string, data: FeedbackUpdateData): Promise<Feedback> {
    const response = await api.put(`/feedback/${id}`, data);
    return (response as any).data;
  }
  
  /**
   * Delete feedback
   */
  async deleteFeedback(id: string): Promise<void> {
    await api.delete(`/feedback/${id}`);
  }
  
  /**
   * Get feedback statistics
   */
  async getFeedbackStatistics(filters: Record<string, any> = {}): Promise<FeedbackStatistics> {
    const response = await api.get('/feedback/statistics', { params: filters });
    return (response as any).data;
  }
  
  /**
   * Get feedback for a specific customer
   */
  async getCustomerFeedback(customerId: string, options: FeedbackFilterOptions = {}): Promise<FeedbackListResponse> {
    const response = await api.get(`/feedback/customer/${customerId}`, { params: options });
    return response as any;
  }
}

export const feedbackService = new FeedbackService(); 