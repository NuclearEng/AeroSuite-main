import api from './api';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  password: string;
  passwordConfirm: string;
  token: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  avatar?: string;
  customerId?: string;
  twoFactorAuth?: {
    enabled: boolean;
    method: 'app' | 'email' | 'sms';
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      inApp: boolean;
    };
    dashboardLayout: Record<string, any>;
  };
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  expiresIn: number;
}

export interface TwoFactorSetupResponse {
  qrCode?: string;
  secret?: string;
  method?: 'app' | 'email' | 'sms';
  message: string;
}

export interface TwoFactorVerifyResponse {
  backupCodes: string[];
  message: string;
}

export interface TwoFactorRequiredResponse {
  tempToken: string;
  twoFactorMethod: 'app' | 'email' | 'sms';
  message: string;
}

// Authentication service
const AuthService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse | TwoFactorRequiredResponse> => {
    const response = await api.post<AuthResponse | TwoFactorRequiredResponse>('/auth/login', credentials);
    
    // Check if 2FA is required
    if ('tempToken' in response) {
      // Return 2FA required response
      return response as TwoFactorRequiredResponse;
    }
    
    // Regular login - store token in localStorage
    localStorage.setItem('token', (response as AuthResponse).token);
    
    return response as AuthResponse;
  },
  
  // Verify email address
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    return api.get<{ message: string }>(`/auth/verify-email/${token}`);
  },
  
  // Resend verification email
  resendVerificationEmail: async (data: { email: string }): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/resend-verification', data);
  },
  
  // Verify two-factor authentication during login
  verifyTwoFactorLogin: async (verificationData: { token: string; tempToken: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/2fa/verify-login', verificationData);
    
    // Store token in localStorage
    localStorage.setItem('token', response.token);
    
    return response;
  },
  
  // Setup two-factor authentication
  setupTwoFactor: async (method: 'app' | 'email' | 'sms'): Promise<TwoFactorSetupResponse> => {
    return api.post<TwoFactorSetupResponse>('/auth/2fa/setup', { method });
  },
  
  // Verify and enable two-factor authentication
  verifyTwoFactor: async (token: string): Promise<TwoFactorVerifyResponse> => {
    return api.post<TwoFactorVerifyResponse>('/auth/2fa/verify', { token });
  },
  
  // Disable two-factor authentication
  disableTwoFactor: async (password: string): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/2fa/disable', { password });
  },
  
  // Generate new backup codes
  generateBackupCodes: async (password: string): Promise<TwoFactorVerifyResponse> => {
    return api.post<TwoFactorVerifyResponse>('/auth/2fa/backup-codes', { password });
  },
  
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    
    // Store token in localStorage
    localStorage.setItem('token', response.token);
    
    return response;
  },
  
  // Get current user profile
  getCurrentUser: async (): Promise<AuthUser> => {
    return api.get<AuthUser>('/auth/me');
  },
  
  // Forgot password
  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/forgot-password', data);
  },
  
  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/reset-password', data);
  },
  
  // Logout user
  logout: (): void => {
    localStorage.removeItem('token');
    // You could also invalidate the token on the server if needed
  },
  
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return localStorage.getItem('token') !== null;
  },
  
  // Update user profile
  updateProfile: async (data: Partial<AuthUser>): Promise<AuthUser> => {
    return api.patch<AuthUser>('/auth/profile', data);
  },
  
  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/change-password', data);
  },
  
  // Update user preferences
  updatePreferences: async (preferences: AuthUser['preferences']): Promise<AuthUser> => {
    return api.patch<AuthUser>('/auth/preferences', { preferences });
  }
};

export default AuthService; 