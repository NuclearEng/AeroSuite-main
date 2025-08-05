/**
 * API Versioning Routes
 * 
 * Endpoints for API version management, compatibility checking,
 * and migration guidance.
 * 
 * @task TS376 - API versioning strategy implementation
 * @task RF018 - Implement versioned APIs
 */

const express = require('express');
const router = express.Router();
const apiVersioningService = require('../services/apiVersioning.service');
const { authenticate } = require('../middleware/auth.middleware');
const { 
  API_VERSIONS, 
  getAllVersions, 
  getActiveVersions,
  getMajorVersions,
  getMinorVersions,
  getLatestInFamily,
  getLatestActiveVersion
} = require('../config/apiVersions');
const { ApiResponse } = require('../utils/apiContract');

/**
 * @route   GET /api/versions
 * @desc    Get all API versions and their status
 * @access  Public
 */
router.get('/', (req, res) => {
  const versions = Object.entries(API_VERSIONS).map(([version, config]) => {
    const lifecycle = apiVersioningService.getVersionLifecycle(version);
    
    return {
      version,
      url: config.basePath,
      isDefault: config.isDefault,
      releaseDate: config.releaseDate,
      deprecationDate: config.deprecationDate,
      sunsetDate: config.sunsetDate,
      status: lifecycle.status,
      message: lifecycle.message,
      description: config.description || '',
      features: config.features || []
    };
  });

  res.json(
    ApiResponse.success(
      {
        currentVersion: req.apiVersion,
        versions
      },
      'AeroSuite API versions'
    )
  );
});

/**
 * @route   GET /api/versions/families
 * @desc    Get API versions organized by families (major versions and their minor versions)
 * @access  Public
 */
router.get('/families', (req, res) => {
  const families = apiVersioningService.getVersionFamilies();
  
  res.json(
    ApiResponse.success(
      { families },
      'API version families'
    )
  );
});

/**
 * @route   GET /api/versions/:version
 * @desc    Get details for a specific API version
 * @access  Public
 */
router.get('/:version', (req, res) => {
  const version = req.params.version;
  
  if (!API_VERSIONS[version]) {
    return res.status(404).json(
      ApiResponse.error(
        `API version ${version} not found`,
        'VERSION_NOT_FOUND'
      )
    );
  }
  
  const lifecycle = apiVersioningService.getVersionLifecycle(version);
  const config = API_VERSIONS[version];
  
  res.json(
    ApiResponse.success(
      {
        version,
        url: config.basePath,
        isDefault: config.isDefault,
        releaseDate: config.releaseDate,
        deprecationDate: config.deprecationDate,
        sunsetDate: config.sunsetDate,
        status: lifecycle.status,
        message: lifecycle.message,
        daysUntilSunset: lifecycle.daysUntilSunset,
        description: config.description || '',
        features: config.features || [],
        relatedVersions: lifecycle.relatedVersions || {},
        documentation: config.documentation || '/api/docs'
      },
      `API version ${version} details`
    )
  );
});

/**
 * @route   GET /api/versions/:version/features
 * @desc    Get features available in a specific API version
 * @access  Public
 */
router.get('/:version/features', (req, res) => {
  const version = req.params.version;
  
  if (!API_VERSIONS[version]) {
    return res.status(404).json(
      ApiResponse.error(
        `API version ${version} not found`,
        'VERSION_NOT_FOUND'
      )
    );
  }
  
  const featureMap = apiVersioningService.getFeatureMap();
  const versionFeatures = apiVersioningService.getVersionFeatures(version);
  
  // Get detailed information for each feature
  const featuresDetails = versionFeatures.map(featureId => {
    const feature = featureMap[featureId] || { description: `Feature: ${featureId}` };
    return {
      id: featureId,
      description: feature.description,
      addedIn: feature.addedIn,
      supportedVersions: feature.supportedVersions
    };
  });
  
  res.json(
    ApiResponse.success(
      {
        version,
        features: featuresDetails
      },
      `Features available in API version ${version}`
    )
  );
});

/**
 * @route   GET /api/versions/compatibility/:clientVersion/:serverVersion
 * @desc    Check compatibility between client and server versions
 * @access  Public
 */
router.get('/compatibility/:clientVersion/:serverVersion', (req, res) => {
  const { clientVersion, serverVersion } = req.params;
  
  if (!API_VERSIONS[clientVersion]) {
    return res.status(404).json(
      ApiResponse.error(
        `Client API version ${clientVersion} not found`,
        'CLIENT_VERSION_NOT_FOUND'
      )
    );
  }
  
  if (!API_VERSIONS[serverVersion]) {
    return res.status(404).json(
      ApiResponse.error(
        `Server API version ${serverVersion} not found`,
        'SERVER_VERSION_NOT_FOUND'
      )
    );
  }
  
  const compatibility = apiVersioningService.getVersionCompatibility(clientVersion, serverVersion);
  
  res.json(
    ApiResponse.success(
      compatibility,
      `Compatibility between client version ${clientVersion} and server version ${serverVersion}`
    )
  );
});

/**
 * @route   GET /api/versions/migration/:fromVersion/:toVersion
 * @desc    Get migration guide between API versions
 * @access  Public
 */
router.get('/migration/:fromVersion/:toVersion', (req, res) => {
  const { fromVersion, toVersion } = req.params;
  
  if (!API_VERSIONS[fromVersion]) {
    return res.status(404).json(
      ApiResponse.error(
        `API version ${fromVersion} not found`,
        'FROM_VERSION_NOT_FOUND'
      )
    );
  }
  
  if (!API_VERSIONS[toVersion]) {
    return res.status(404).json(
      ApiResponse.error(
        `API version ${toVersion} not found`,
        'TO_VERSION_NOT_FOUND'
      )
    );
  }
  
  const migrationGuide = apiVersioningService.getMigrationGuide(fromVersion, toVersion);
  
  res.json(
    ApiResponse.success(
      {
        fromVersion,
        toVersion,
        ...migrationGuide
      },
      `Migration guide from ${fromVersion} to ${toVersion}`
    )
  );
});

/**
 * @route   GET /api/versions/feature/:featureId
 * @desc    Check which versions support a specific feature
 * @access  Public
 */
router.get('/feature/:featureId', (req, res) => {
  const featureId = req.params.featureId;
  const featureMap = apiVersioningService.getFeatureMap();
  
  if (!featureMap[featureId]) {
    return res.status(404).json(
      ApiResponse.error(
        `Feature ${featureId} not found`,
        'FEATURE_NOT_FOUND'
      )
    );
  }
  
  const feature = featureMap[featureId];
  
  res.json(
    ApiResponse.success(
      {
        id: featureId,
        ...feature
      },
      `Versions supporting feature: ${featureId}`
    )
  );
});

/**
 * @route   GET /api/versions/latest
 * @desc    Get the latest API version
 * @access  Public
 */
router.get('/latest', (req, res) => {
  const latestVersion = getLatestActiveVersion();
  const versionConfig = API_VERSIONS[latestVersion];
  const lifecycle = apiVersioningService.getVersionLifecycle(latestVersion);
  
  res.json(
    ApiResponse.success(
      {
        version: latestVersion,
        url: versionConfig.basePath,
        isDefault: versionConfig.isDefault,
        releaseDate: versionConfig.releaseDate,
        description: versionConfig.description || '',
        features: versionConfig.features || [],
        documentation: versionConfig.documentation || '/api/docs'
      },
      'Latest API version'
    )
  );
});

/**
 * @route   GET /api/versions/latest/:majorVersion
 * @desc    Get the latest version within a major version family
 * @access  Public
 */
router.get('/latest/:majorVersion', (req, res) => {
  const majorVersion = req.params.majorVersion;
  
  if (!API_VERSIONS[majorVersion]) {
    return res.status(404).json(
      ApiResponse.error(
        `Major API version ${majorVersion} not found`,
        'VERSION_NOT_FOUND'
      )
    );
  }
  
  const latestInFamily = getLatestInFamily(majorVersion);
  const versionConfig = API_VERSIONS[latestInFamily];
  const lifecycle = apiVersioningService.getVersionLifecycle(latestInFamily);
  
  res.json(
    ApiResponse.success(
      {
        version: latestInFamily,
        url: versionConfig.basePath,
        isDefault: versionConfig.isDefault,
        releaseDate: versionConfig.releaseDate,
        description: versionConfig.description || '',
        features: versionConfig.features || [],
        documentation: versionConfig.documentation || '/api/docs'
      },
      `Latest version in the ${majorVersion} family`
    )
  );
});

module.exports = router; 