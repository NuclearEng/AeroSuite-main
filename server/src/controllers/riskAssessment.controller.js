/**
 * Risk Assessment Controller
 * Handles HTTP requests for risk assessments
 */
const riskAssessmentService = require('../services/riskAssessment.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const RiskAssessment = require('../models/RiskAssessment');

/**
 * Create a new risk assessment
 * @route POST /api/risk-assessments
 * @access Private
 */
exports.createRiskAssessment = async (req, res, next) => {
  try {
    const assessment = await riskAssessmentService.createRiskAssessment(req.body);
    res.status(201).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a risk assessment by ID
 * @route GET /api/risk-assessments/:id
 * @access Private
 */
exports.getRiskAssessment = async (req, res, next) => {
  try {
    const assessment = await riskAssessmentService.getRiskAssessmentById(req.params.id);
    res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a risk assessment
 * @route PUT /api/risk-assessments/:id
 * @access Private
 */
exports.updateRiskAssessment = async (req, res, next) => {
  try {
    const assessment = await riskAssessmentService.updateRiskAssessment(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a risk assessment
 * @route DELETE /api/risk-assessments/:id
 * @access Private
 */
exports.deleteRiskAssessment = async (req, res, next) => {
  try {
    await riskAssessmentService.deleteRiskAssessment(req.params.id);
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all risk assessments for a supplier
 * @route GET /api/suppliers/:supplierId/risk-assessments
 * @access Private
 */
exports.getSupplierRiskAssessments = async (req, res, next) => {
  try {
    const assessments = await riskAssessmentService.getSupplierRiskAssessments(req.params.supplierId);
    res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get default risk factors
 * @route GET /api/risk-assessments/factors/default
 * @access Private
 */
exports.getDefaultRiskFactors = async (req, res, next) => {
  try {
    const factors = riskAssessmentService.getDefaultRiskFactors();
    res.status(200).json({
      success: true,
      data: factors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get risk assessment statistics
 * @route GET /api/risk-assessments/stats
 * @access Private
 */
exports.getRiskAssessmentStats = async (req, res, next) => {
  try {
    const stats = await riskAssessmentService.getRiskAssessmentStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all risk assessments
 * @route GET /api/risk-assessments
 * @access Private
 */
exports.getRiskAssessments = async (req, res, next) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sort = req.query.sort || '-createdAt';
    const skip = (page - 1) * limit;
    
    // Build the query
    const query = {};
    
    // Filter by risk level if provided
    if (req.query.riskLevel) {
      query.riskLevel = req.query.riskLevel;
    }
    
    // Filter by date range if provided
    if (req.query.startDate && req.query.endDate) {
      query.assessmentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Execute the query
    const assessments = await RiskAssessment.find(query)
      .populate('supplier', 'name code')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await RiskAssessment.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: assessments.length,
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      data: assessments
    });
  } catch (error) {
    next(error);
  }
}; 