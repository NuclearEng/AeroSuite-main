/**
 * API Versioning Service
 * 
 * This service provides utilities for managing API versioning,
 * including version compatibility checking, feature detection,
 * and version migration assistance.
 * 
 * @task TS376 - API versioning strategy implementation
 * @task RF018 - Implement versioned APIs
 */

const semver = require('semver');
const { 
  API_VERSIONS, 
  getDefaultVersion, 
  isVersionActive, 
  isVersionDeprecated,
  getMajorVersions,
  getMinorVersions,
  getLatestInFamily,
  getLatestActiveVersion
} = require('../config/apiVersions');

class ApiVersioningService {
  /**
   * Check if a feature is supported in the specified API version
   * @param {string} featureId - Unique identifier for the feature
   * @param {string} version - API version to check
   * @returns {boolean} Whether the feature is supported
   */
  isFeatureSupported(featureId, version) {
    if (!API_VERSIONS[version]) {
      return false;
    }
    
    return API_VERSIONS[version].features?.includes(featureId) || false;
  }
  
  /**
   * Get all features available in the specified API version
   * @param {string} version - API version to check
   * @returns {string[]} Array of feature IDs
   */
  getVersionFeatures(version) {
    if (!API_VERSIONS[version]) {
      return [];
    }
    
    return API_VERSIONS[version].features || [];
  }
  
  /**
   * Get the feature map defining which features are available in which versions
   * @returns {Object} Feature map
   */
  getFeatureMap() {
    // Build feature map from version configurations
    const featureMap = {};
    
    // Collect all unique features
    const allFeatures = new Set();
    Object.entries(API_VERSIONS).forEach(([_, config]) => {
      if (config.features) {
        config.features.forEach(feature => allFeatures.add(feature));
      }
    });
    
    // For each feature, determine which versions support it
    allFeatures.forEach(feature => {
      const supportedVersions = [];
      let addedIn = null;
      let description = '';
      
      // Find versions that support this feature
      Object.entries(API_VERSIONS).forEach(([version, config]) => {
        if (config.features?.includes(feature)) {
          supportedVersions.push(version);
          
          // Track the earliest version that supports this feature
          if (!addedIn || config.releaseDate < API_VERSIONS[addedIn].releaseDate) {
            addedIn = version;
          }
        }
      });
      
      // Set descriptions for known features
      switch (feature) {
        case 'basic-crud':
          description = 'Basic CRUD operations for all resources';
          break;
        case 'pagination':
          description = 'Pagination support for list endpoints';
          break;
        case 'sorting':
          description = 'Sorting support for list endpoints';
          break;
        case 'field-selection':
          description = 'Ability to select specific fields in API responses';
          break;
        case 'rate-limiting':
          description = 'Rate limiting for API requests';
          break;
        case 'advanced-filtering':
          description = 'Advanced filtering capabilities for API resources';
          break;
        case 'bulk-operations':
          description = 'Support for bulk create/update/delete operations';
          break;
        case 'webhooks':
          description = 'Webhook notifications for resource changes';
          break;
        case 'export-data':
          description = 'Export data in various formats (CSV, Excel, etc.)';
          break;
        case 'enhanced-security':
          description = 'Enhanced security features including MFA and fine-grained permissions';
          break;
        default:
          description = `Feature: ${feature}`;
      }
      
      featureMap[feature] = {
        supportedVersions,
        addedIn,
        description
      };
    });
    
    return featureMap;
  }
  
  /**
   * Get breaking changes between API versions
   * @param {string} fromVersion - Source API version
   * @param {string} toVersion - Target API version
   * @returns {Array} List of breaking changes
   */
  getBreakingChanges(fromVersion, toVersion) {
    // This could be loaded from a database or configuration file
    const breakingChanges = {
      'v0-to-v1': [
        {
          resource: 'all',
          change: 'Response format standardized with success/error wrappers',
          mitigation: 'Update client code to handle the new response format'
        },
        {
          resource: 'auth',
          change: 'Authentication now uses JWT tokens instead of session cookies',
          mitigation: 'Update client to use Authorization header with Bearer token'
        }
      ],
      'v1-to-v2': [
        {
          resource: 'inspections',
          change: 'The inspection status field now uses camelCase values instead of snake_case',
          mitigation: 'Update client code to use the new status values'
        },
        {
          resource: 'suppliers',
          change: 'The supplier risk assessment endpoint now requires additional parameters',
          mitigation: 'Add the required parameters to your API calls'
        },
        {
          resource: 'auth',
          change: 'Authentication tokens now expire after 1 hour instead of 24 hours',
          mitigation: 'Implement token refresh logic in your client'
        }
      ],
      'v1-to-v1.1': [
        {
          resource: 'reports',
          change: 'Report generation endpoints now support additional format options',
          mitigation: 'No breaking change, but you can update to use new formats'
        }
      ],
      'v2-to-v2.1': [
        {
          resource: 'auth',
          change: 'Added support for multi-factor authentication',
          mitigation: 'No breaking change, but you can update to use MFA if needed'
        },
        {
          resource: 'all',
          change: 'Added support for fine-grained permissions',
          mitigation: 'No breaking change, but you may need to update permission scopes'
        }
      ]
    };
    
    // For versions with dots (e.g., v1.1), we need to handle differently
    const fromMajor = fromVersion.split('.')[0];
    const toMajor = toVersion.split('.')[0];
    
    // If major versions are different, return major version changes
    if (fromMajor !== toMajor) {
      const key = `${fromMajor}-to-${toMajor}`;
      return breakingChanges[key] || [];
    }
    
    // If major versions are the same but minor versions are different
    if (fromVersion !== toVersion) {
      const key = `${fromMajor}-to-${toVersion}`;
      return breakingChanges[key] || [];
    }
    
    return [];
  }
  
  /**
   * Get version compatibility information
   * @param {string} clientVersion - Client API version
   * @param {string} serverVersion - Server API version
   * @returns {Object} Compatibility information
   */
  getVersionCompatibility(clientVersion, serverVersion) {
    // Extract version numbers for comparison
    const clientVersionNorm = clientVersion.replace('v', '');
    const serverVersionNorm = serverVersion.replace('v', '');
    
    // Use semver for proper comparison
    const clientSemver = semver.coerce(clientVersionNorm);
    const serverSemver = semver.coerce(serverVersionNorm);
    
    if (!clientSemver || !serverSemver) {
      return {
        compatibility: 'unknown',
        message: 'Invalid version format',
        clientVersion,
        serverVersion,
        breakingChanges: []
      };
    }
    
    let compatibility = 'full';
    let message = 'Fully compatible';
    
    // If major versions are different
    if (clientSemver.major !== serverSemver.major) {
      // Client using newer major version than server
      if (clientSemver.major > serverSemver.major) {
        compatibility = 'none';
        message = `Client version ${clientVersion} is not supported by server version ${serverVersion}`;
      } 
      // Server using newer major version than client
      else {
        compatibility = 'partial';
        message = `Client version ${clientVersion} may not support all features in server version ${serverVersion}`;
      }
    } 
    // If major versions are the same but minor versions are different
    else if (clientSemver.minor !== serverSemver.minor) {
      // Client using newer minor version than server
      if (clientSemver.minor > serverSemver.minor) {
        compatibility = 'partial';
        message = `Client version ${clientVersion} may use features not available in server version ${serverVersion}`;
      } 
      // Server using newer minor version than client
      else {
        compatibility = 'backward';
        message = `Client version ${clientVersion} is backward compatible with server version ${serverVersion}`;
      }
    }
    
    // Get feature differences
    const clientFeatures = this.getVersionFeatures(clientVersion);
    const serverFeatures = this.getVersionFeatures(serverVersion);
    
    const missingInServer = clientFeatures.filter(f => !serverFeatures.includes(f));
    const newInServer = serverFeatures.filter(f => !clientFeatures.includes(f));
    
    return {
      compatibility,
      message,
      clientVersion,
      serverVersion,
      breakingChanges: this.getBreakingChanges(clientVersion, serverVersion),
      featureDifferences: {
        missingInServer,
        newInServer
      }
    };
  }
  
  /**
   * Get version lifecycle information
   * @param {string} version - API version
   * @returns {Object} Lifecycle information
   */
  getVersionLifecycle(version) {
    if (!API_VERSIONS[version]) {
      return {
        exists: false,
        message: `Version ${version} does not exist`
      };
    }
    
    const versionConfig = API_VERSIONS[version];
    const now = new Date();
    
    let status = 'active';
    let message = `Version ${version} is active`;
    
    if (!isVersionActive(version)) {
      status = 'inactive';
      message = `Version ${version} is no longer active`;
    } else if (isVersionDeprecated(version)) {
      status = 'deprecated';
      message = `Version ${version} is deprecated as of ${versionConfig.deprecationDate.toDateString()}`;
      
      if (versionConfig.sunsetDate) {
        message += ` and will be removed on ${versionConfig.sunsetDate.toDateString()}`;
      }
    }
    
    // Get related versions
    let relatedVersions = {};
    
    // If this is a major version, get its minor versions
    if (!version.includes('.')) {
      relatedVersions.minorVersions = getMinorVersions(version);
    } 
    // If this is a minor version, get its major version
    else if (versionConfig.parentVersion) {
      relatedVersions.parentVersion = versionConfig.parentVersion;
      relatedVersions.siblingVersions = getMinorVersions(versionConfig.parentVersion)
        .filter(v => v !== version);
    }
    
    // Get latest version in the same family
    if (version.includes('.')) {
      const majorVersion = version.split('.')[0];
      relatedVersions.latestInFamily = getLatestInFamily(majorVersion);
    } else {
      relatedVersions.latestInFamily = getLatestInFamily(version);
    }
    
    // Get latest version across all families
    relatedVersions.latestOverall = getLatestActiveVersion();
    
    return {
      exists: true,
      status,
      message,
      releaseDate: versionConfig.releaseDate,
      deprecationDate: versionConfig.deprecationDate,
      sunsetDate: versionConfig.sunsetDate,
      daysUntilSunset: versionConfig.sunsetDate ? Math.ceil((versionConfig.sunsetDate - now) / (1000 * 60 * 60 * 24)) : null,
      description: versionConfig.description,
      features: versionConfig.features || [],
      relatedVersions
    };
  }
  
  /**
   * Get migration guide for moving between versions
   * @param {string} fromVersion - Source API version
   * @param {string} toVersion - Target API version
   * @returns {Object} Migration guide
   */
  getMigrationGuide(fromVersion, toVersion) {
    // This could be loaded from a database or documentation files
    const migrationGuides = {
      'v0-to-v1': {
        title: 'Migrating from v0 to v1',
        overview: 'This guide helps you migrate your application from API v0 to v1',
        breakingChanges: this.getBreakingChanges(fromVersion, toVersion),
        steps: [
          {
            title: 'Update response handling',
            description: 'Update your client to handle the standardized response format'
          },
          {
            title: 'Update authentication',
            description: 'Switch from session cookies to JWT tokens'
          }
        ],
        newFeatures: [
          {
            title: 'Pagination',
            description: 'v1 supports pagination for list endpoints'
          },
          {
            title: 'Sorting',
            description: 'v1 supports sorting for list endpoints'
          },
          {
            title: 'Field selection',
            description: 'v1 supports selecting specific fields in API responses'
          }
        ]
      },
      'v1-to-v2': {
        title: 'Migrating from v1 to v2',
        overview: 'This guide helps you migrate your application from API v1 to v2',
        breakingChanges: this.getBreakingChanges(fromVersion, toVersion),
        steps: [
          {
            title: 'Update authentication handling',
            description: 'Implement token refresh logic to handle the shorter token expiration time'
          },
          {
            title: 'Update status field handling',
            description: 'Convert snake_case status values to camelCase in your client code'
          },
          {
            title: 'Update supplier risk assessment calls',
            description: 'Add the required parameters to supplier risk assessment API calls'
          }
        ],
        newFeatures: [
          {
            title: 'Advanced filtering',
            description: 'v2 supports advanced filtering on most resources'
          },
          {
            title: 'Bulk operations',
            description: 'v2 supports bulk create/update/delete operations'
          },
          {
            title: 'Webhooks',
            description: 'v2 supports webhook notifications for resource changes'
          }
        ]
      },
      'v1-to-v1.1': {
        title: 'Migrating from v1 to v1.1',
        overview: 'This guide helps you migrate your application from API v1 to v1.1',
        breakingChanges: this.getBreakingChanges(fromVersion, toVersion),
        steps: [],
        newFeatures: [
          {
            title: 'Export data',
            description: 'v1.1 supports exporting data in various formats'
          }
        ]
      },
      'v2-to-v2.1': {
        title: 'Migrating from v2 to v2.1',
        overview: 'This guide helps you migrate your application from API v2 to v2.1',
        breakingChanges: this.getBreakingChanges(fromVersion, toVersion),
        steps: [],
        newFeatures: [
          {
            title: 'Multi-factor authentication',
            description: 'v2.1 supports multi-factor authentication'
          },
          {
            title: 'Fine-grained permissions',
            description: 'v2.1 supports fine-grained permissions'
          }
        ]
      }
    };
    
    // For versions with dots (e.g., v1.1), we need to handle differently
    const fromMajor = fromVersion.split('.')[0];
    const toMajor = toVersion.split('.')[0];
    
    // If major versions are different, return major version migration guide
    if (fromMajor !== toMajor) {
      const key = `${fromMajor}-to-${toMajor}`;
      return migrationGuides[key] || this._createDefaultMigrationGuide(fromVersion, toVersion);
    }
    
    // If major versions are the same but minor versions are different
    if (fromVersion !== toVersion) {
      const key = `${fromMajor}-to-${toVersion}`;
      return migrationGuides[key] || this._createDefaultMigrationGuide(fromVersion, toVersion);
    }
    
    // If versions are the same, return empty migration guide
    return this._createDefaultMigrationGuide(fromVersion, toVersion);
  }
  
  /**
   * Create a default migration guide
   * @param {string} fromVersion - Source API version
   * @param {string} toVersion - Target API version
   * @returns {Object} Default migration guide
   * @private
   */
  _createDefaultMigrationGuide(fromVersion, toVersion) {
    // Get feature differences
    const fromFeatures = this.getVersionFeatures(fromVersion);
    const toFeatures = this.getVersionFeatures(toVersion);
    
    const newFeatures = toFeatures.filter(f => !fromFeatures.includes(f)).map(feature => {
      const featureMap = this.getFeatureMap();
      return {
        title: feature,
        description: featureMap[feature]?.description || `New feature: ${feature}`
      };
    });
    
    return {
      title: `Migration from ${fromVersion} to ${toVersion}`,
      overview: 'No specific migration guide available for this version change',
      breakingChanges: this.getBreakingChanges(fromVersion, toVersion),
      steps: [],
      newFeatures
    };
  }
  
  /**
   * Get all version families (major versions and their minor versions)
   * @returns {Object} Version families
   */
  getVersionFamilies() {
    const families = {};
    
    // Get all major versions
    const majorVersions = getMajorVersions();
    
    // For each major version, get its minor versions
    majorVersions.forEach(majorVersion => {
      const minorVersions = getMinorVersions(majorVersion);
      
      families[majorVersion] = {
        version: majorVersion,
        config: API_VERSIONS[majorVersion],
        minorVersions: minorVersions.map(v => ({
          version: v,
          config: API_VERSIONS[v]
        }))
      };
    });
    
    return families;
  }
}

module.exports = new ApiVersioningService(); 