/**
 * Supplier Audit Controller
 * Handles HTTP requests for supplier audits
 */
const supplierAuditService = require('../services/supplierAudit.service');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Create a new supplier audit
 * @route POST /api/supplier-audits
 * @access Private
 */
exports.createAudit = async (req, res, next) => {
  try {
    const audit = await supplierAuditService.createAudit(req.body);
    res.status(201).json({
      success: true,
      data: audit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a supplier audit by ID
 * @route GET /api/supplier-audits/:id
 * @access Private
 */
exports.getAudit = async (req, res, next) => {
  try {
    const audit = await supplierAuditService.getAuditById(req.params.id);
    res.status(200).json({
      success: true,
      data: audit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a supplier audit
 * @route PUT /api/supplier-audits/:id
 * @access Private
 */
exports.updateAudit = async (req, res, next) => {
  try {
    const audit = await supplierAuditService.updateAudit(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: audit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a supplier audit
 * @route DELETE /api/supplier-audits/:id
 * @access Private
 */
exports.deleteAudit = async (req, res, next) => {
  try {
    await supplierAuditService.deleteAudit(req.params.id);
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all supplier audits
 * @route GET /api/supplier-audits
 * @access Private
 */
exports.getAudits = async (req, res, next) => {
  try {
    const result = await supplierAuditService.getAudits(req.query);
    res.status(200).json({
      success: true,
      count: result.audits.length,
      total: result.total,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      },
      data: result.audits
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all audits for a specific supplier
 * @route GET /api/suppliers/:supplierId/audits
 * @access Private
 */
exports.getSupplierAudits = async (req, res, next) => {
  try {
    const audits = await supplierAuditService.getSupplierAudits(req.params.supplierId);
    res.status(200).json({
      success: true,
      count: audits.length,
      data: audits
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get default checklist templates
 * @route GET /api/supplier-audits/templates/default
 * @access Private
 */
exports.getDefaultTemplates = async (req, res, next) => {
  try {
    const templates = supplierAuditService.getDefaultChecklistTemplates();
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
}; 