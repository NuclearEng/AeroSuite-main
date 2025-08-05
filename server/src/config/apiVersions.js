/**
 * API Versioning Configuration
 * 
 * This file defines the API versions supported by the application,
 * their release dates, deprecation dates, and sunset dates.
 * 
 * - Release Date: When the API version was released
 * - Deprecation Date: When the API version is marked as deprecated (will still work)
 * - Sunset Date: When the API version will be removed completely
 * 
 * @task RF018 - Implement versioned APIs
 */

/**
 * Supported API versions with their lifecycle dates
 */
const API_VERSIONS = {
  // Major versions
  'v1': {
    releaseDate: new Date('2023-01-01'),
    deprecationDate: null, // Not deprecated yet
    sunsetDate: null, // No planned removal date
    isDefault: true, // This is the default version
    basePath: '/api/v1',
    isActive: true,
    description: 'Initial stable API version',
    features: ['basic-crud', 'pagination', 'sorting', 'field-selection', 'rate-limiting'],
    documentation: '/api/docs/v1'
  },
  'v2': {
    releaseDate: new Date('2023-07-01'),
    deprecationDate: null,
    sunsetDate: null,
    isDefault: false,
    basePath: '/api/v2',
    isActive: true,
    description: 'Enhanced API with advanced filtering and bulk operations',
    features: ['basic-crud', 'pagination', 'sorting', 'field-selection', 'rate-limiting', 'advanced-filtering', 'bulk-operations', 'webhooks'],
    documentation: '/api/docs/v2'
  },
  
  // Minor versions (for more granular compatibility)
  'v1.1': {
    releaseDate: new Date('2023-03-15'),
    deprecationDate: null,
    sunsetDate: null,
    isDefault: false,
    basePath: '/api/v1.1',
    isActive: true,
    description: 'v1 with bug fixes and minor enhancements',
    features: ['basic-crud', 'pagination', 'sorting', 'field-selection', 'rate-limiting', 'export-data'],
    documentation: '/api/docs/v1.1',
    parentVersion: 'v1'
  },
  'v2.1': {
    releaseDate: new Date('2023-09-15'),
    deprecationDate: null,
    sunsetDate: null,
    isDefault: false,
    basePath: '/api/v2.1',
    isActive: true,
    description: 'v2 with enhanced security features',
    features: ['basic-crud', 'pagination', 'sorting', 'field-selection', 'rate-limiting', 'advanced-filtering', 'bulk-operations', 'webhooks', 'enhanced-security'],
    documentation: '/api/docs/v2.1',
    parentVersion: 'v2'
  },
  
  // Example of a deprecated version
  'v0': {
    releaseDate: new Date('2022-06-01'),
    deprecationDate: new Date('2023-01-01'),
    sunsetDate: new Date('2023-12-31'),
    isDefault: false,
    basePath: '/api/v0',
    isActive: true, // Still active until sunset date
    description: 'Legacy API version (deprecated)',
    features: ['basic-crud'],
    documentation: '/api/docs/v0'
  }
};

/**
 * Get the default API version
 * @returns {string} The default API version key
 */
const getDefaultVersion = () => {
  for (const [version, config] of Object.entries(API_VERSIONS)) {
    if (config.isDefault) {
      return version;
    }
  }
  return 'v1'; // Fallback to v1 if no default is specified
};

/**
 * Check if a version is active (not past sunset date)
 * @param {string} version The version to check
 * @returns {boolean} Whether the version is active
 */
const isVersionActive = (version) => {
  if (!API_VERSIONS[version]) {
    return false;
  }
  
  const config = API_VERSIONS[version];
  
  if (!config.isActive) {
    return false;
  }
  
  // If there's a sunset date and it's in the past, the version is inactive
  if (config.sunsetDate && new Date() > config.sunsetDate) {
    return false;
  }
  
  return true;
};

/**
 * Check if a version is deprecated
 * @param {string} version The version to check
 * @returns {boolean} Whether the version is deprecated
 */
const isVersionDeprecated = (version) => {
  if (!API_VERSIONS[version]) {
    return false;
  }
  
  const config = API_VERSIONS[version];
  
  // If there's a deprecation date and it's in the past, the version is deprecated
  if (config.deprecationDate && new Date() > config.deprecationDate) {
    return true;
  }
  
  return false;
};

/**
 * Get all supported version keys
 * @returns {string[]} Array of version keys
 */
const getAllVersions = () => {
  return Object.keys(API_VERSIONS);
};

/**
 * Get all active version keys
 * @returns {string[]} Array of active version keys
 */
const getActiveVersions = () => {
  return Object.keys(API_VERSIONS).filter(version => isVersionActive(version));
};

/**
 * Get all major versions (v1, v2, etc.)
 * @param {boolean} activeOnly - Whether to return only active versions
 * @returns {string[]} Array of major version keys
 */
const getMajorVersions = (activeOnly = false) => {
  return Object.keys(API_VERSIONS)
    .filter(version => {
      // Only include versions without a dot (major versions)
      const isMajor = !version.includes('.');
      return activeOnly ? isMajor && isVersionActive(version) : isMajor;
    });
};

/**
 * Get minor versions for a specific major version
 * @param {string} majorVersion - Major version (e.g., 'v1')
 * @param {boolean} activeOnly - Whether to return only active versions
 * @returns {string[]} Array of minor version keys
 */
const getMinorVersions = (majorVersion, activeOnly = false) => {
  const majorVersionNumber = majorVersion.replace('v', '');
  
  return Object.keys(API_VERSIONS)
    .filter(version => {
      // Include versions that start with the major version number and have a dot
      const isMinorOfMajor = version.startsWith(`v${majorVersionNumber}.`);
      return activeOnly ? isMinorOfMajor && isVersionActive(version) : isMinorOfMajor;
    });
};

/**
 * Get the latest version within a major version family
 * @param {string} majorVersion - Major version (e.g., 'v1')
 * @returns {string} Latest version in the family
 */
const getLatestInFamily = (majorVersion) => {
  const minorVersions = getMinorVersions(majorVersion, true);
  
  if (minorVersions.length === 0) {
    return majorVersion;
  }
  
  // Sort by release date (newest first)
  return minorVersions.sort((a, b) => {
    return API_VERSIONS[b].releaseDate - API_VERSIONS[a].releaseDate;
  })[0];
};

/**
 * Get the latest active version across all families
 * @returns {string} Latest active version
 */
const getLatestActiveVersion = () => {
  const activeVersions = getActiveVersions();
  
  if (activeVersions.length === 0) {
    return getDefaultVersion();
  }
  
  // Sort by release date (newest first)
  return activeVersions.sort((a, b) => {
    return API_VERSIONS[b].releaseDate - API_VERSIONS[a].releaseDate;
  })[0];
};

module.exports = {
  API_VERSIONS,
  getDefaultVersion,
  isVersionActive,
  isVersionDeprecated,
  getAllVersions,
  getActiveVersions,
  getMajorVersions,
  getMinorVersions,
  getLatestInFamily,
  getLatestActiveVersion
}; 