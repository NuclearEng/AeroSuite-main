import { useCallback } from 'react';
import { useAppSelector } from '../redux/store';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

/**
 * Hook for accessing authentication state and methods
 */
export const useAuth = () => {
  const { user, isAuthenticated, token } = useAppSelector((state) => state.auth);
  
  /**
   * Get authentication token
   * @returns Promise that resolves to the token
   */
  const getToken = useCallback(async (): Promise<string> => {
    // In a real app, this might refresh the token if it's expired
    return token || '';
  }, [token]);
  
  return {
    user,
    isAuthenticated,
    getToken,
  };
};

export default useAuth; 