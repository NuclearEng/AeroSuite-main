/**
 * Privacy Service
 * 
 * This service provides client-side functionality for user data privacy management.
 * 
 * Part of SEC10: User data privacy compliance
 */

import api from './api';

export interface ConsentSettings {
  marketing?: {
    value: boolean;
    timestamp?: Date;
  };
  analytics?: {
    value: boolean;
    timestamp?: Date;
  };
  thirdPartySharing?: {
    value: boolean;
    timestamp?: Date;
  };
  cookiePreferences?: {
    necessary?: boolean;
    preferences?: boolean;
    analytics?: boolean;
    marketing?: boolean;
    timestamp?: Date;
  };
  privacyPolicyAccepted?: {
    value: boolean;
    version?: string;
    timestamp?: Date;
  };
}

export interface PolicyDocuments {
  privacyPolicy: string;
  dataRetentionPolicy: string;
  version: string;
  lastUpdated: string;
}

/**
 * Get privacy policy and terms
 * @returns Privacy policy and terms documents
 */
const getPrivacyPolicies = async (): Promise<PolicyDocuments> => {
  return api.get<PolicyDocuments>('/privacy/policy');
};

/**
 * Export user data
 * @param directDownload Whether to download directly (true) or get a download link (false)
 * @returns Download link if directDownload is false
 */
const exportUserData = async (directDownload: boolean = false): Promise<{ downloadLink?: string }> => {
  return api.post<{ downloadLink?: string }>('/privacy/export-data', {}, {
    params: { directDownload: directDownload.toString() }
  });
};

/**
 * Delete user account
 * @returns Success message
 */
const deleteAccount = async (): Promise<{ message: string }> => {
  return api.delete<{ message: string }>('/privacy/account');
};

/**
 * Get current consent settings
 * @returns User's consent settings
 */
const getConsent = async (): Promise<ConsentSettings> => {
  const response = await api.get<ConsentSettings>('/privacy/consent');
  return response;
};

/**
 * Update consent settings
 * @param consentSettings Updated consent settings
 * @returns Updated consent settings
 */
const updateConsent = async (consentSettings: ConsentSettings): Promise<ConsentSettings> => {
  const response = await api.put<ConsentSettings>('/privacy/consent', {
    consentSettings
  });
  return response;
};

/**
 * Accept privacy policy
 * @param version Policy version
 * @returns Updated consent settings
 */
const acceptPrivacyPolicy = async (version: string): Promise<ConsentSettings> => {
  const consent: ConsentSettings = {
    privacyPolicyAccepted: {
      value: true,
      version
    }
  };
  
  return updateConsent(consent);
};

const privacyService = {
  getPrivacyPolicies,
  exportUserData,
  deleteAccount,
  getConsent,
  updateConsent,
  acceptPrivacyPolicy
};

export default privacyService; 