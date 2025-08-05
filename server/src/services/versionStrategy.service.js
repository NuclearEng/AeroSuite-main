/**
 * Version Strategy Service
 * 
 * This service implements comprehensive API versioning strategies
 * including URL path versioning, header versioning, and content negotiation.
 * 
 * Implements RF018 - Implement versioned APIs
 */

const semver = require('semver');
const { 
  API_VERSIONS, 
  getDefaultVersion, 
  isVersionActive,
  isVersionDeprecated
} = require('../config/apiVersions');

class VersionStrategyService {
  constructor() {
    this.strategies = {
      'url-path': this.extractVersionFromPath,
      'header': this.extractVersionFromHeader,
      'content-negotiation': this.extractVersionFromAcceptHeader,
      'query-param': this.extractVersionFromQueryParam
    };
    
    // Default strategy order
    this.strategyOrder = [
      'url-path',
      'header',
      'content-negotiation',
      'query-param'
    ];
  }

  /**
   * Extract version from URL path
   * @param {Object} req - Express request object
   * @returns {string|null} - Extracted version or null
   */
  extractVersionFromPath(req) {
    const pathMatch = req.path.match(/^\/v(\d+)(?:\.(\d+))?(?:\.(\d+))?/i);
    if (pathMatch) {
      const major = pathMatch[1];
      const minor = pathMatch[2] || '0';
      const patch = pathMatch[3] || '0';
      
      // Support both v1 and v1.0 and v1.0.0 formats
      if (pathMatch[2] || pathMatch[3]) {
        return `v${major}.${minor}.${patch}`;
      }
      return `v${major}`;
    }
    return null;
  }

  /**
   * Extract version from custom header
   * @param {Object} req - Express request object
   * @returns {string|null} - Extracted version or null
   */
  extractVersionFromHeader(req) {
    const headerVersion = req.get('X-API-Version');
    if (headerVersion) {
      return headerVersion.toLowerCase();
    }
    return null;
  }

  /**
   * Extract version from Accept header
   * @param {Object} req - Express request object
   * @returns {string|null} - Extracted version or null
   */
  extractVersionFromAcceptHeader(req) {
    const acceptHeader = req.get('Accept');
    if (!acceptHeader) {
      return null;
    }
    
    // Check for vendor media type: application/vnd.aerosuite.v1+json
    const vendorMatch = acceptHeader.match(/application\/vnd\.aerosuite\.v(\d+)(?:\.(\d+))?(?:\.(\d+))?\+json/i);
    if (vendorMatch) {
      const major = vendorMatch[1];
      const minor = vendorMatch[2] || '0';
      const patch = vendorMatch[3] || '0';
      
      if (vendorMatch[2] || vendorMatch[3]) {
        return `v${major}.${minor}.${patch}`;
      }
      return `v${major}`;
    }
    
    // Check for version parameter in Accept header: application/json;version=1
    const acceptMatch = acceptHeader.match(/application\/json;\s*version=(\d+)(?:\.(\d+))?(?:\.(\d+))?/i);
    if (acceptMatch) {
      const major = acceptMatch[1];
      const minor = acceptMatch[2] || '0';
      const patch = acceptMatch[3] || '0';
      
      if (acceptMatch[2] || acceptMatch[3]) {
        return `v${major}.${minor}.${patch}`;
      }
      return `v${major}`;
    }
    
    return null;
  }

  /**
   * Extract version from query parameter
   * @param {Object} req - Express request object
   * @returns {string|null} - Extracted version or null
   */
  extractVersionFromQueryParam(req) {
    if (req.query && req.query['api-version']) {
      return req.query['api-version'].toLowerCase();
    }
    return null;
  }

  /**
   * Determine API version from request using configured strategies
   * @param {Object} req - Express request object
   * @returns {string} - Determined API version
   */
  determineVersion(req) {
    // Try each strategy in order
    for (const strategyName of this.strategyOrder) {
      const strategy = this.strategies[strategyName];
      const version = strategy.call(this, req);
      
      if (version) {
        // Normalize version format
        return this.normalizeVersion(version);
      }
    }
    
    // Default version if no strategy succeeds
    return getDefaultVersion();
  }

  /**
   * Normalize version format to match our version keys
   * @param {string} version - Version string to normalize
   * @returns {string} - Normalized version
   */
  normalizeVersion(version) {
    // Handle full semver format (v1.2.3)
    if (version.match(/^v\d+\.\d+\.\d+$/i)) {
      const parsed = semver.parse(version.replace('v', ''));
      if (parsed) {
        // Check if we have an exact match
        if (API_VERSIONS[version]) {
          return version;
        }
        
        // If not, fall back to major version only
        return `v${parsed.major}`;
      }
    }
    
    // Handle major.minor format (v1.2)
    if (version.match(/^v\d+\.\d+$/i)) {
      const parts = version.substring(1).split('.');
      const majorVersion = `v${parts[0]}`;
      
      // Check if we have an exact match
      if (API_VERSIONS[version]) {
        return version;
      }
      
      // If not, fall back to major version only
      return majorVersion;
    }
    
    // Handle major version only (v1)
    if (version.match(/^v\d+$/i)) {
      return version.toLowerCase();
    }
    
    // If version format is unrecognized, return default
    return getDefaultVersion();
  }

  /**
   * Get the best matching version based on client preferences
   * @param {Object} req - Express request object
   * @returns {string} - Best matching version
   */
  negotiateVersion(req) {
    const acceptHeader = req.get('Accept');
    if (!acceptHeader) {
      return this.determineVersion(req);
    }
    
    // Check for vendor-specific media types with versions and quality factors
    const vendorMatches = Array.from(
      acceptHeader.matchAll(/application\/vnd\.aerosuite\.v(\d+)(?:\.(\d+))?(?:\.(\d+))?\+json(?:;q=([0-9.]+))?/gi)
    );
    
    if (vendorMatches.length > 0) {
      // Sort by quality factor (q value), defaulting to 1.0 if not specified
      const sortedVersions = vendorMatches
        .map(match => {
          const major = match[1];
          const minor = match[2] || '0';
          const patch = match[3] || '0';
          const version = match[2] || match[3] ? `v${major}.${minor}.${patch}` : `v${major}`;
          
          return {
            version: this.normalizeVersion(version),
            quality: match[4] ? parseFloat(match[4]) : 1.0
          };
        })
        .sort((a, b) => b.quality - a.quality);
      
      // Find the first active version from the sorted list
      for (const { version } of sortedVersions) {
        if (API_VERSIONS[version] && isVersionActive(version)) {
          return version;
        }
      }
    }
    
    // Fall back to the simple determination method
    return this.determineVersion(req);
  }

  /**
   * Check if a version is compatible with another version
   * @param {string} requestedVersion - Requested version
   * @param {string} supportedVersion - Supported version
   * @returns {boolean} - Whether versions are compatible
   */
  isVersionCompatible(requestedVersion, supportedVersion) {
    // If versions are exactly the same, they're compatible
    if (requestedVersion === supportedVersion) {
      return true;
    }
    
    // Extract major versions for comparison
    const requestedMajor = parseInt(requestedVersion.replace(/^v(\d+).*$/, '$1'), 10);
    const supportedMajor = parseInt(supportedVersion.replace(/^v(\d+).*$/, '$1'), 10);
    
    // Major versions must match for compatibility
    return requestedMajor === supportedMajor;
  }

  /**
   * Find the best matching version from a list of supported versions
   * @param {string} requestedVersion - Requested version
   * @param {string[]} supportedVersions - List of supported versions
   * @returns {string|null} - Best matching version or null if none match
   */
  findBestMatchingVersion(requestedVersion, supportedVersions) {
    // First try exact match
    if (supportedVersions.includes(requestedVersion)) {
      return requestedVersion;
    }
    
    // Extract major version
    const requestedMajor = parseInt(requestedVersion.replace(/^v(\d+).*$/, '$1'), 10);
    
    // Find all versions with matching major version
    const matchingVersions = supportedVersions.filter(v => {
      const major = parseInt(v.replace(/^v(\d+).*$/, '$1'), 10);
      return major === requestedMajor;
    });
    
    if (matchingVersions.length === 0) {
      return null;
    }
    
    // Sort by semver and return the highest matching version
    return matchingVersions.sort((a, b) => {
      const aSemver = a.replace('v', '');
      const bSemver = b.replace('v', '');
      return semver.compare(bSemver, aSemver); // Descending order
    })[0];
  }

  /**
   * Get headers to add for version information
   * @param {string} version - API version
   * @returns {Object} - Headers to add
   */
  getVersionHeaders(version) {
    const headers = {
      'X-API-Version': version,
      'Vary': 'Accept, X-API-Version'
    };
    
    if (isVersionDeprecated(version)) {
      const config = API_VERSIONS[version];
      const deprecationDate = config.deprecationDate;
      const sunsetDate = config.sunsetDate;
      
      headers['Warning'] = `299 - "Deprecated API Version ${version}"`;
      headers['Deprecation'] = deprecationDate.toISOString();
      headers['X-API-Deprecated-Description'] = `API version ${version} is deprecated as of ${deprecationDate.toDateString()}. Please upgrade to the latest version.`;
      
      if (sunsetDate) {
        headers['Sunset'] = sunsetDate.toISOString();
        headers['X-API-Sunset'] = sunsetDate.toISOString();
        headers['X-API-Sunset-Description'] = `API version ${version} will be discontinued on ${sunsetDate.toDateString()}`;
      }
      
      // Add Link header for the latest version
      const latestVersion = Object.entries(API_VERSIONS)
        .filter(([_, config]) => config.isActive && !isVersionDeprecated(_))
        .sort(([_, a], [__, b]) => b.releaseDate - a.releaseDate)[0];
      
      if (latestVersion) {
        headers['Link'] = `<${API_VERSIONS[latestVersion[0]].basePath}>; rel="successor-version"`;
      }
    }
    
    return headers;
  }
}

module.exports = new VersionStrategyService(); 