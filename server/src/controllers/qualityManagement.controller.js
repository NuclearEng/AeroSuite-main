/**
 * Quality Management Controller
 * Handles HTTP requests for supplier quality management
 */
const qualityManagementService = require('../services/qualityManagement.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Get quality management data for a supplier
 * @route GET /api/suppliers/:supplierId/quality
 * @access Private
 */
exports.getSupplierQMS = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.getSupplierQMS(req.params.supplierId);
    res.status(200).json({
      success: true,
      data: qms
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update quality management data for a supplier
 * @route PUT /api/suppliers/:supplierId/quality
 * @access Private
 */
exports.updateQMS = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.updateQMS(req.params.supplierId, req.body);
    res.status(200).json({
      success: true,
      data: qms
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get quality compliance summary for a supplier
 * @route GET /api/suppliers/:supplierId/quality/compliance
 * @access Private
 */
exports.getComplianceSummary = async (req, res, next) => {
  try {
    const summary = await qualityManagementService.getComplianceSummary(req.params.supplierId);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a non-conformance record
 * @route POST /api/suppliers/:supplierId/quality/non-conformances
 * @access Private
 */
exports.addNonConformance = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.addNonConformance(req.params.supplierId, req.body);
    res.status(201).json({
      success: true,
      data: qms.nonConformances[qms.nonConformances.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all non-conformance records for a supplier
 * @route GET /api/suppliers/:supplierId/quality/non-conformances
 * @access Private
 */
exports.getNonConformances = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.getSupplierQMS(req.params.supplierId);
    res.status(200).json({
      success: true,
      count: qms.nonConformances.length,
      data: qms.nonConformances
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific non-conformance record
 * @route GET /api/suppliers/:supplierId/quality/non-conformances/:ncNumber
 * @access Private
 */
exports.getNonConformance = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.getSupplierQMS(req.params.supplierId);
    
    const nonConformance = qms.nonConformances.find(nc => nc.ncNumber === req.params.ncNumber);
    if (!nonConformance) {
      throw new NotFoundError(`Non-conformance ${req.params.ncNumber} not found for supplier ${req.params.supplierId}`);
    }
    
    res.status(200).json({
      success: true,
      data: nonConformance
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a non-conformance record
 * @route PUT /api/suppliers/:supplierId/quality/non-conformances/:ncNumber
 * @access Private
 */
exports.updateNonConformance = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.updateNonConformance(
      req.params.supplierId,
      req.params.ncNumber,
      req.body
    );
    
    const updatedNC = qms.nonConformances.find(nc => nc.ncNumber === req.params.ncNumber);
    
    res.status(200).json({
      success: true,
      data: updatedNC
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a quality document
 * @route POST /api/suppliers/:supplierId/quality/documents
 * @access Private
 */
exports.addQualityDocument = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.addQualityDocument(req.params.supplierId, req.body);
    res.status(201).json({
      success: true,
      data: qms.qualityDocuments[qms.qualityDocuments.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all quality documents for a supplier
 * @route GET /api/suppliers/:supplierId/quality/documents
 * @access Private
 */
exports.getQualityDocuments = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.getSupplierQMS(req.params.supplierId);
    res.status(200).json({
      success: true,
      count: qms.qualityDocuments.length,
      data: qms.qualityDocuments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a quality document
 * @route PUT /api/suppliers/:supplierId/quality/documents/:documentId
 * @access Private
 */
exports.updateQualityDocument = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.updateQualityDocument(
      req.params.supplierId,
      req.params.documentId,
      req.body
    );
    
    const updatedDoc = qms.qualityDocuments.find(doc => doc._id.toString() === req.params.documentId);
    
    res.status(200).json({
      success: true,
      data: updatedDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a quality document
 * @route DELETE /api/suppliers/:supplierId/quality/documents/:documentId
 * @access Private
 */
exports.deleteQualityDocument = async (req, res, next) => {
  try {
    await qualityManagementService.deleteQualityDocument(
      req.params.supplierId,
      req.params.documentId
    );
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add an improvement plan
 * @route POST /api/suppliers/:supplierId/quality/improvement-plans
 * @access Private
 */
exports.addImprovementPlan = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.addImprovementPlan(req.params.supplierId, req.body);
    res.status(201).json({
      success: true,
      data: qms.improvementPlans[qms.improvementPlans.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all improvement plans for a supplier
 * @route GET /api/suppliers/:supplierId/quality/improvement-plans
 * @access Private
 */
exports.getImprovementPlans = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.getSupplierQMS(req.params.supplierId);
    res.status(200).json({
      success: true,
      count: qms.improvementPlans.length,
      data: qms.improvementPlans
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an improvement plan
 * @route PUT /api/suppliers/:supplierId/quality/improvement-plans/:planId
 * @access Private
 */
exports.updateImprovementPlan = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.updateImprovementPlan(
      req.params.supplierId,
      req.params.planId,
      req.body
    );
    
    const updatedPlan = qms.improvementPlans.find(plan => plan._id.toString() === req.params.planId);
    
    res.status(200).json({
      success: true,
      data: updatedPlan
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a milestone to an improvement plan
 * @route POST /api/suppliers/:supplierId/quality/improvement-plans/:planId/milestones
 * @access Private
 */
exports.addMilestone = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.addMilestone(
      req.params.supplierId,
      req.params.planId,
      req.body
    );
    
    const plan = qms.improvementPlans.find(p => p._id.toString() === req.params.planId);
    const milestone = plan.milestones[plan.milestones.length - 1];
    
    res.status(201).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a milestone
 * @route PUT /api/suppliers/:supplierId/quality/improvement-plans/:planId/milestones/:milestoneId
 * @access Private
 */
exports.updateMilestone = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.updateMilestone(
      req.params.supplierId,
      req.params.planId,
      req.params.milestoneId,
      req.body
    );
    
    const plan = qms.improvementPlans.find(p => p._id.toString() === req.params.planId);
    const milestone = plan.milestones.find(m => m._id.toString() === req.params.milestoneId);
    
    res.status(200).json({
      success: true,
      data: milestone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a quality metric
 * @route PUT /api/suppliers/:supplierId/quality/metrics/:metricName
 * @access Private
 */
exports.updateMetric = async (req, res, next) => {
  try {
    if (!req.body.value && req.body.value !== 0) {
      throw new BadRequestError('Metric value is required');
    }
    
    const qms = await qualityManagementService.updateMetric(
      req.params.supplierId,
      req.params.metricName,
      req.body.value
    );
    
    res.status(200).json({
      success: true,
      data: qms.qualityMetrics[req.params.metricName]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all quality metrics for a supplier
 * @route GET /api/suppliers/:supplierId/quality/metrics
 * @access Private
 */
exports.getQualityMetrics = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.getSupplierQMS(req.params.supplierId);
    res.status(200).json({
      success: true,
      data: qms.qualityMetrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync audits with quality management
 * @route POST /api/suppliers/:supplierId/quality/sync-audits
 * @access Private
 */
exports.syncAudits = async (req, res, next) => {
  try {
    const qms = await qualityManagementService.syncAudits(req.params.supplierId);
    res.status(200).json({
      success: true,
      data: qms.auditHistory
    });
  } catch (error) {
    next(error);
  }
}; 