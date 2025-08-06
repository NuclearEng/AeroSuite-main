import api from '../services/api';

// Token cookie names
const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';
const USER_KEY = 'user';

/**
 * Get the authentication header with JWT token from cookie
 * @returns Authentication header object
 */
export const getAuthHeader = () => {
  // For httpOnly cookie-based auth, return empty object as cookies are sent automatically
  // If using Bearer token auth (less secure), it would look like:
  // const token = sessionStorage.getItem('auth_token');
  // return token ? { Authorization: `Bearer ${token}` } : {};
  
  // Current implementation relies on httpOnly cookies sent automatically by browser
  return {
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection header
    'X-Client-Version': process.env.REACT_APP_VERSION || '1.0.0'
  };
};

/**
 * Set the JWT token in httpOnly cookies (handled by backend)
 * @param accessToken Access JWT token
 * @param refreshToken Refresh token (optional)
 */
export const setAuthTokens = (_accessToken: string, _refreshToken?: string) => {
  // Tokens should be set by the backend using httpOnly cookies on login/refresh.
  // No-op on client.
};

/**
 * Get the refresh token from httpOnly cookie (not accessible from JS)
 * @returns null (not accessible from client)
 */
export const getRefreshToken = (): string | null => {
  // Not accessible from client-side JS if httpOnly.
  return null;
};

/**
 * Remove auth tokens from httpOnly cookies (handled by backend)
 */
export const removeAuthTokens = () => {
  // Tokens should be cleared by the backend by expiring the cookies.
  // No-op on client.
};

/**
 * Check if the user is authenticated
 * @returns Boolean indicating if user is authenticated (must rely on backend/session)
 */
export const isAuthenticated = (): boolean => {
  // In a secure implementation, check authentication by calling a backend endpoint or checking a secure cookie (not accessible from JS).
  // For SPA, consider a /me or /session endpoint.
  return false;
};

/**
 * Parse the JWT token to get user information (not possible with httpOnly cookies)
 * @returns null
 */
export const parseJwt = (_token?: string) => {
  // Not possible if tokens are httpOnly cookies.
  return null;
};

/**
 * Check if token is expired (not possible with httpOnly cookies)
 * @returns false
 */
export const isTokenExpired = (_token?: string): boolean => {
  // Not possible if tokens are httpOnly cookies.
  return false;
};

/**
 * Refresh the access token using the refresh token (handled by backend)
 * @returns Promise with the new access token or null if failed
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  // Call backend endpoint to refresh token; backend will set new httpOnly cookies.
  try {
    await api.post('/v2/auth/refresh-token');
    return null;
  } catch (_error) {
    console.error('Token refresh failed:', _error);
    removeAuthTokens();
    return null;
  }
};

/**
 * Store user data (non-sensitive)
 * @param user User data object
 */
export const setUserData = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Get stored user data
 * @returns User data object or null if not found
 */
export const getUserData = (): any => {
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;
  try {
    return JSON.parse(userData);
  } catch (_error) {
    console.error('Error parsing user data:', _error);
    return null;
  }
};

/**
 * Complete login process with proper token storage (handled by backend)
 * @param loginResponse Login API response
 */
export const completeLogin = (_loginResponse: any): void => {
  // Backend should set httpOnly cookies for tokens.
};

/**
 * Get user sessions from the API
 * @returns Promise with array of user sessions
 */
export const getUserSessions = async (): Promise<any[]> => {
  try {
    const response = await api.get<{ sessions?: any[] }>('/v2/auth/sessions');
    return response.sessions || [];
  } catch (_error) {
    console.error('Error fetching user sessions:', _error);
    return [];
  }
};

/**
 * Terminate a specific session
 * @param sessionId ID of the session to terminate
 * @returns Promise with boolean indicating success
 */
export const terminateSession = async (sessionId: string): Promise<boolean> => {
  try {
    await api.delete(`/v2/auth/sessions/${sessionId}`);
    return true;
  } catch (_error) {
    console.error('Error terminating session:', _error);
    return false;
  }
};

/**
 * Terminate all sessions
 * @returns Promise with boolean indicating success
 */
export const terminateAllSessions = async (): Promise<boolean> => {
  try {
    await api.delete('/v2/auth/sessions');
    return true;
  } catch (_error) {
    console.error('Error terminating all sessions:', _error);
    return false;
  }
}; 