/**
 * Feature Flags Controller
 * 
 * This controller provides API endpoints for managing feature flags.
 */

const featureFlagsService = require('../services/featureFlags.service');
const FeatureFlag = require('../models/featureFlag.model');
const { BadRequestError, NotFoundError } = require('../utils/errorHandler');

/**
 * Get all feature flags
 * @route GET /api/feature-flags
 * @access Admin only
 */
exports.getAllFlags = async (req, res, next) => {
  try {
    const filters = {};
    
    // Apply filters if provided
    if (req.query.enabled !== undefined) {
      filters.enabled = req.query.enabled === 'true';
    }
    
    if (req.query.environment) {
      filters.environmentsEnabled = req.query.environment;
    }
    
    if (req.query.search) {
      filters.$or = [
        { key: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Get flags from database or service
    let flags;
    if (Object.keys(filters).length > 0) {
      // If filters are provided, get from database
      flags = await FeatureFlag.find(filters).lean();
      
      // Convert to map with key as the flag key
      const flagsMap = {};
      flags.forEach(flag => {
        flagsMap[flag.key] = {
          enabled: flag.enabled,
          description: flag.description,
          createdAt: flag.createdAt,
          modifiedAt: flag.updatedAt,
          owner: flag.owner,
          rolloutPercentage: flag.rolloutPercentage,
          segmentRules: flag.segmentRules || {},
          environmentsEnabled: flag.environmentsEnabled || ['development'],
          metadata: flag.metadata || {}
        };
      });
      flags = flagsMap;
    } else {
      // Get all flags from service
      flags = featureFlagsService.getAllFlags();
    }
    
    res.status(200).json({
      success: true,
      data: flags
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a specific feature flag
 * @route GET /api/feature-flags/:key
 * @access Admin only
 */
exports.getFlag = async (req, res, next) => {
  try {
    const flagKey = req.params.key;
    
    // Get flag from service
    const flag = featureFlagsService.getFlag(flagKey);
    
    if (!flag) {
      return next(new NotFoundError(`Feature flag with key ${flagKey} not found`));
    }
    
    res.status(200).json({
      success: true,
      data: flag
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create or update a feature flag
 * @route PUT /api/feature-flags/:key
 * @access Admin only
 */
exports.updateFlag = async (req, res, next) => {
  try {
    const flagKey = req.params.key;
    const flagData = req.body;
    
    // Validate the flag data
    if (flagData.enabled === undefined) {
      return next(new BadRequestError('enabled property is required'));
    }
    
    // Ensure rollout percentage is valid
    if (flagData.rolloutPercentage !== undefined) {
      if (isNaN(flagData.rolloutPercentage) || 
          flagData.rolloutPercentage < 0 || 
          flagData.rolloutPercentage > 100) {
        return next(new BadRequestError('rolloutPercentage must be a number between 0 and 100'));
      }
    }
    
    // Update flag in service
    const updatedFlag = await featureFlagsService.setFlag(flagKey, flagData);
    
    // If MongoDB storage is used, update in database as well
    if (process.env.FEATURE_FLAGS_STORAGE === 'mongodb') {
      const featureFlag = await FeatureFlag.findOne({ key: flagKey });
      
      if (featureFlag) {
        // Update existing flag
        Object.assign(featureFlag, FeatureFlag.fromServiceFormat(flagKey, updatedFlag));
        await featureFlag.save();
      } else {
        // Create new flag
        await FeatureFlag.create(FeatureFlag.fromServiceFormat(flagKey, updatedFlag));
      }
    }
    
    res.status(200).json({
      success: true,
      data: updatedFlag
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a feature flag
 * @route DELETE /api/feature-flags/:key
 * @access Admin only
 */
exports.deleteFlag = async (req, res, next) => {
  try {
    const flagKey = req.params.key;
    
    // Delete flag from service
    const result = await featureFlagsService.deleteFlag(flagKey);
    
    if (!result) {
      return next(new NotFoundError(`Feature flag with key ${flagKey} not found`));
    }
    
    // If MongoDB storage is used, delete from database as well
    if (process.env.FEATURE_FLAGS_STORAGE === 'mongodb') {
      await FeatureFlag.deleteOne({ key: flagKey });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Check if a feature flag is enabled
 * @route GET /api/feature-flags/:key/status
 * @access Authenticated
 */
exports.checkFlag = async (req, res, next) => {
  try {
    const flagKey = req.params.key;
    const user = req.user;
    
    // Check if flag is enabled for the user
    const enabled = featureFlagsService.isEnabled(flagKey, user, {
      environment: process.env.NODE_ENV || 'development'
    });
    
    res.status(200).json({
      success: true,
      data: {
        enabled
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Sync feature flags to storage
 * @route POST /api/feature-flags/sync
 * @access Admin only
 */
exports.syncFlags = async (req, res, next) => {
  try {
    await featureFlagsService.syncFlags();
    
    res.status(200).json({
      success: true,
      message: 'Feature flags synced successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Clear feature flag cache
 * @route POST /api/feature-flags/clear-cache
 * @access Admin only
 */
exports.clearCache = async (req, res, next) => {
  try {
    featureFlagsService.clearAllCache();
    
    res.status(200).json({
      success: true,
      message: 'Feature flag cache cleared successfully'
    });
  } catch (err) {
    next(err);
  }
}; 