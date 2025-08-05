import axios from 'axios';
import { getAuthHeader } from '../utils/auth';

const API_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Get the current user's profile
 * @returns User profile data
 */
export const getUserProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (_error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user profile information
 * @param profileData User profile data to update
 * @returns Updated user profile data
 */
export const updateUserProfile = async (profileData: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  position?: string;
  department?: string;
}) => {
  try {
    const response = await axios.put(`${API_URL}/auth/profile`, profileData, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (_error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload a profile image
 * @param imageFile Image file to upload
 * @returns URL of the uploaded image
 */
export const uploadProfileImage = async (imageFile: File) => {
  try {
    const formData = new FormData();
    formData.append('profileImage', imageFile);

    const response = await axios.post(`${API_URL}/auth/upload-profile-image`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data.imageUrl;
  } catch (_error) {
    console.error('Error uploading profile image:', error);
    throw error;
  }
};

/**
 * Update user preferences
 * @param preferences User preferences to update
 * @returns Updated user preferences
 */
export const updateUserPreferences = async (preferences: {
  theme?: string;
  language?: string;
  notifications?: boolean;
  dashboardLayout?: string;
  defaultView?: string;
}) => {
  try {
    const response = await axios.put(`${API_URL}/auth/preferences`, preferences, {
      headers: getAuthHeader()
    });
    return response.data.data;
  } catch (_error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

/**
 * Complete user onboarding
 * @returns Success response
 */
export const completeOnboarding = async () => {
  try {
    const response = await axios.post(`${API_URL}/auth/onboarding/complete`, {}, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (_error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
}; 