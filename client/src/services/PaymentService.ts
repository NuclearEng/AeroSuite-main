/**
 * Payment Service
 * 
 * Service for handling payment operations
 * Task: TS367 - Payment gateway integration
 */

import axios from 'axios';

export interface PaymentSession {
  id: string;
  url: string;
}

export interface Payment {
  _id: string;
  amount: number;
  currency: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'canceled';
  sessionId?: string;
  paymentIntentId?: string;
  chargeId?: string;
  paymentMethod?: string;
  refunded: boolean;
  refundId?: string;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPayments {
  payments: Payment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

class PaymentService {
  private baseUrl = '/api/v1/payments';

  /**
   * Create a payment session
   */
  public async createSession(
    amount: number, 
    description?: string, 
    metadata?: Record<string, any>,
    customerId?: string
  ): Promise<PaymentSession> {
    try {
      const response = await axios.post(`${this.baseUrl}/create-session`, {
        amount,
        description,
        metadata,
        customerId
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment session:', error);
      throw error;
    }
  }

  /**
   * Get payment history
   */
  public async getPaymentHistory(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<PaginatedPayments> {
    try {
      const response = await axios.get(`${this.baseUrl}/history`, {
        params: { page, limit, status }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  }

  /**
   * Get payment details by ID
   */
  public async getPaymentById(id: string): Promise<Payment> {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }

  /**
   * Create a refund for a payment
   */
  public async createRefund(id: string, reason?: string): Promise<Payment> {
    try {
      const response = await axios.post(`${this.baseUrl}/${id}/refund`, { reason });
      return response.data;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }
}

export default new PaymentService(); 