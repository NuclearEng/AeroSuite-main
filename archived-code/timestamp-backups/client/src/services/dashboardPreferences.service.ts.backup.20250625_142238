import axios from 'axios';
import { DashboardWidgetConfig, DashboardLayout } from '../redux/slices/dashboard.slice';

// Type definitions for dashboard preferences
export interface DashboardPreferences {
  widgets: { [key: string]: DashboardWidgetConfig };
  layout: DashboardLayout;
}

/**
 * Service for dashboard preferences management
 */
const dashboardPreferencesService = {
  /**
   * Get dashboard preferences from the server
   * 
   * @returns Dashboard preferences object
   */
  async getPreferences(): Promise<DashboardPreferences | null> {
    try {
      const response = await axios.get('/api/users/preferences/dashboard');
      console.log('Loaded dashboard preferences from server:', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Failed to load dashboard preferences from server', error);
      return null;
    }
  },
  
  /**
   * Save dashboard preferences to the server
   * 
   * @param preferences Dashboard preferences object
   * @returns Success indicator
   */
  async savePreferences(preferences: DashboardPreferences): Promise<boolean> {
    try {
      const response = await axios.post('/api/users/preferences/dashboard', preferences);
      console.log('Saved dashboard preferences to server:', response.data);
      return true;
    } catch (error) {
      console.error('Failed to save dashboard preferences to server', error);
      return false;
    }
  },
  
  /**
   * Reset dashboard preferences to defaults
   * 
   * @returns Success indicator
   */
  async resetPreferences(): Promise<boolean> {
    try {
      const response = await axios.delete('/api/users/preferences/dashboard');
      console.log('Reset dashboard preferences on server:', response.data);
      return true;
    } catch (error) {
      console.error('Failed to reset dashboard preferences on server', error);
      return false;
    }
  }
};

export default dashboardPreferencesService; 