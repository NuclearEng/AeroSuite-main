/**
 * API Version Middleware
 * 
 * This middleware determines the API version to use based on various inputs:
 * 1. URL path prefix (/api/v1/...)
 * 2. Accept header (Accept: application/vnd.aerosuite.v1+json)
 * 3. Custom header (X-API-Version: v1)
 * 4. Query parameter (?api-version=v1)
 * 
 * If no version is specified, it defaults to the latest non-deprecated version.
 * 
 * @task TS376 - API versioning strategy implementation
 * @task RF018 - Implement versioned APIs
 */

const {
  API_VERSIONS,
  getDefaultVersion,
  isVersionActive,
  isVersionDeprecated,
  getActiveVersions
} = require('../config/apiVersions');

const versionStrategy = require('../services/versionStrategy.service');
const { ApiResponse } = require('../utils/apiContract');

/**
 * Middleware to determine and validate API version
 */
const apiVersionMiddleware = (req, res, next) => {
  // Extract version from request using the version strategy service
  const requestedVersion = versionStrategy.negotiateVersion(req);
  
  // Check if the version exists and is active
  if (!API_VERSIONS[requestedVersion]) {
    return res.status(400).json(
      ApiResponse.error(
        `Invalid API version: ${requestedVersion}. Available versions: ${Object.keys(API_VERSIONS).join(', ')}`,
        'INVALID_API_VERSION'
      )
    );
  }
  
  if (!isVersionActive(requestedVersion)) {
    return res.status(410).json(
      ApiResponse.error(
        `API version ${requestedVersion} is no longer active. Please use one of the following versions: ${getActiveVersions().join(', ')}`,
        'INACTIVE_API_VERSION'
      )
    );
  }
  
  // Get and set version-specific headers
  const versionHeaders = versionStrategy.getVersionHeaders(requestedVersion);
  Object.entries(versionHeaders).forEach(([key, value]) => {
    res.set(key, value);
  });
  
  // Set the API version on the request object for later use
  req.apiVersion = requestedVersion;
  
  // Add API version information to the response
  const originalSend = res.send;
  res.send = function (body) {
    // Only modify JSON responses
    if (res.get('Content-Type')?.includes('application/json') && typeof body === 'string') {
      try {
        const data = JSON.parse(body);
        
        // Only add metadata if it's not already there
        if (!data.apiVersion) {
          data.apiVersion = requestedVersion;
          
          // Add metadata about available versions
          if (isVersionDeprecated(requestedVersion)) {
            data.apiVersionDeprecated = true;
            const latestVersion = getActiveVersions().filter(v => !isVersionDeprecated(v))[0] || getDefaultVersion();
            data.apiVersionInfo = {
              message: `You are using a deprecated API version. Please upgrade to ${latestVersion}.`,
              latestVersion,
              latestVersionUrl: API_VERSIONS[latestVersion].basePath,
              migrationGuide: `/api/versions/migration/${requestedVersion}/${latestVersion}`
            };
          }
          
          body = JSON.stringify(data);
        }
      } catch (e) {
        // If parsing fails, just send the original body
      }
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

/**
 * Route versioning helper for clean version-specific route mounting
 * @param {string[]} versions - Array of API versions to support
 * @returns {Function} Middleware function
 */
const versionRoute = (versions) => {
  return (req, res, next) => {
    // Skip if no API version was determined
    if (!req.apiVersion) {
      return next();
    }
    
    // Find the best matching version from the supported versions
    const bestMatch = versionStrategy.findBestMatchingVersion(req.apiVersion, versions);
    
    // Allow if a compatible version was found
    if (bestMatch) {
      // If the matched version is different from the requested version,
      // add a header to indicate the version that was actually used
      if (bestMatch !== req.apiVersion) {
        res.set('X-API-Version-Used', bestMatch);
      }
      return next();
    }
    
    // Otherwise, return unsupported version error
    return res.status(404).json(
      ApiResponse.error(
        `This route does not support API version ${req.apiVersion}. Supported versions: ${versions.join(', ')}`,
        'UNSUPPORTED_API_VERSION'
      )
    );
  };
};

/**
 * Middleware to enforce a specific API version for a route
 * @param {string} version - Required API version
 * @returns {Function} Middleware function
 */
const requireVersion = (version) => {
  return (req, res, next) => {
    if (!req.apiVersion || !versionStrategy.isVersionCompatible(req.apiVersion, version)) {
      return res.status(400).json(
        ApiResponse.error(
          `This endpoint requires API version ${version}. Current version: ${req.apiVersion || 'none'}`,
          'VERSION_MISMATCH'
        )
      );
    }
    next();
  };
};

module.exports = {
  apiVersionMiddleware,
  versionRoute,
  requireVersion
}; 