import api from './api';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position?: string;
  department?: string;
  avatarUrl?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

class UserService {
  /**
   * Get the current user's profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/v1/users/me');
    return response.data;
  }

  /**
   * Get a user profile by ID
   */
  async getUserProfile(userId: string): Promise<User> {
    const response = await api.get(`/api/v1/users/${userId}`);
    return response.data;
  }

  /**
   * Update a user profile
   */
  async updateUserProfile(userId: string, userData: UpdateUserData): Promise<User> {
    const response = await api.put(`/api/v1/users/${userId}`, userData);
    return response.data;
  }

  /**
   * Upload a user avatar
   */
  async uploadAvatar(userId: string, formData: FormData): Promise<{ avatarUrl: string }> {
    const response = await api.post(`/api/v1/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePasswordData): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/v1/users/change-password', passwordData);
    return response.data;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/v1/auth/reset-password', { 
      token, 
      newPassword 
    });
    return response.data;
  }
}

export default new UserService(); 