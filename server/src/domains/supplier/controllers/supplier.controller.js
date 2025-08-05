/**
 * Supplier controller
 */

const mongoose = require('mongoose');
const { SuccessResponse, ErrorResponse } = require('../../../utils/apiResponse');
const { NotFoundError, ValidationError } = require('../../../utils/errorHandler');
const supplierService = require('../services/supplier.service');
const logger = require('../../../utils/logger');

/**
 * Get all suppliers with optional filtering
 */
exports.getAllSuppliers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.country': { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 }
    };

    const result = await supplierService.getAllSuppliers(filters, options);
    
    return res.json(new SuccessResponse('Suppliers retrieved successfully', {
      suppliers: result.suppliers,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        limit: result.limit
      }
    }));
  } catch (error) {
    logger.error('Error in getAllSuppliers controller', { error });
    next(error);
  }
};

/**
 * Get a single supplier by ID
 */
exports.getSupplierById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const supplier = await supplierService.getSupplierById(id);
    
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }
    
    return res.json(new SuccessResponse('Supplier retrieved successfully', { supplier }));
  } catch (error) {
    logger.error('Error in getSupplierById controller', { error, supplierId: req.params.id });
    next(error);
  }
};

/**
 * Create a new supplier
 */
exports.createSupplier = async (req, res, next) => {
  try {
    const supplierData = req.body;
    
    // Add audit information
    supplierData.createdBy = req.user.id;
    
    const supplier = await supplierService.createSupplier(supplierData);
    
    return res.status(201).json(new SuccessResponse('Supplier created successfully', { supplier }));
  } catch (error) {
    logger.error('Error in createSupplier controller', { error, supplierData: req.body });
    next(error);
  }
};

/**
 * Update a supplier
 */
exports.updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Add audit information
    updateData.updatedBy = req.user.id;
    
    const supplier = await supplierService.updateSupplier(id, updateData);
    
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }
    
    return res.json(new SuccessResponse('Supplier updated successfully', { supplier }));
  } catch (error) {
    logger.error('Error in updateSupplier controller', { 
      error, 
      supplierId: req.params.id, 
      updateData: req.body 
    });
    next(error);
  }
};

/**
 * Delete a supplier
 */
exports.deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await supplierService.deleteSupplier(id);
    
    if (!result) {
      throw new NotFoundError('Supplier not found');
    }
    
    return res.json(new SuccessResponse('Supplier deleted successfully'));
  } catch (error) {
    logger.error('Error in deleteSupplier controller', { error, supplierId: req.params.id });
    next(error);
  }
};

/**
 * Get all contacts for a supplier
 */
exports.getSupplierContacts = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const contacts = await supplierService.getSupplierContacts(id);
    
    return res.json(new SuccessResponse('Supplier contacts retrieved successfully', { contacts }));
  } catch (error) {
    logger.error('Error in getSupplierContacts controller', { error, supplierId: req.params.id });
    next(error);
  }
};

/**
 * Add a contact to a supplier
 */
exports.addSupplierContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contactData = req.body;
    
    const contact = await supplierService.addSupplierContact(id, contactData);
    
    return res.status(201).json(new SuccessResponse('Contact added successfully', { contact }));
  } catch (error) {
    logger.error('Error in addSupplierContact controller', { 
      error, 
      supplierId: req.params.id, 
      contactData: req.body 
    });
    next(error);
  }
};

/**
 * Update a supplier contact
 */
exports.updateSupplierContact = async (req, res, next) => {
  try {
    const { supplierId, contactId } = req.params;
    const updateData = req.body;
    
    const contact = await supplierService.updateSupplierContact(supplierId, contactId, updateData);
    
    if (!contact) {
      throw new NotFoundError('Contact not found');
    }
    
    return res.json(new SuccessResponse('Contact updated successfully', { contact }));
  } catch (error) {
    logger.error('Error in updateSupplierContact controller', { 
      error, 
      supplierId: req.params.supplierId, 
      contactId: req.params.contactId, 
      updateData: req.body 
    });
    next(error);
  }
};

/**
 * Delete a supplier contact
 */
exports.deleteSupplierContact = async (req, res, next) => {
  try {
    const { supplierId, contactId } = req.params;
    
    const result = await supplierService.deleteSupplierContact(supplierId, contactId);
    
    if (!result) {
      throw new NotFoundError('Contact not found');
    }
    
    return res.json(new SuccessResponse('Contact deleted successfully'));
  } catch (error) {
    logger.error('Error in deleteSupplierContact controller', { 
      error, 
      supplierId: req.params.supplierId, 
      contactId: req.params.contactId 
    });
    next(error);
  }
};

/**
 * Get all qualifications for a supplier
 */
exports.getSupplierQualifications = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const qualifications = await supplierService.getSupplierQualifications(id);
    
    return res.json(new SuccessResponse('Supplier qualifications retrieved successfully', { qualifications }));
  } catch (error) {
    logger.error('Error in getSupplierQualifications controller', { error, supplierId: req.params.id });
    next(error);
  }
};

/**
 * Add a qualification to a supplier
 */
exports.addSupplierQualification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const qualificationData = req.body;
    
    // Add audit information
    qualificationData.createdBy = req.user.id;
    
    const qualification = await supplierService.addSupplierQualification(id, qualificationData);
    
    return res.status(201).json(new SuccessResponse('Qualification added successfully', { qualification }));
  } catch (error) {
    logger.error('Error in addSupplierQualification controller', { 
      error, 
      supplierId: req.params.id, 
      qualificationData: req.body 
    });
    next(error);
  }
};

/**
 * Update a supplier qualification
 */
exports.updateSupplierQualification = async (req, res, next) => {
  try {
    const { supplierId, qualificationId } = req.params;
    const updateData = req.body;
    
    // Add audit information
    updateData.updatedBy = req.user.id;
    
    const qualification = await supplierService.updateSupplierQualification(supplierId, qualificationId, updateData);
    
    if (!qualification) {
      throw new NotFoundError('Qualification not found');
    }
    
    return res.json(new SuccessResponse('Qualification updated successfully', { qualification }));
  } catch (error) {
    logger.error('Error in updateSupplierQualification controller', { 
      error, 
      supplierId: req.params.supplierId, 
      qualificationId: req.params.qualificationId, 
      updateData: req.body 
    });
    next(error);
  }
};

/**
 * Delete a supplier qualification
 */
exports.deleteSupplierQualification = async (req, res, next) => {
  try {
    const { supplierId, qualificationId } = req.params;
    
    const result = await supplierService.deleteSupplierQualification(supplierId, qualificationId);
    
    if (!result) {
      throw new NotFoundError('Qualification not found');
    }
    
    return res.json(new SuccessResponse('Qualification deleted successfully'));
  } catch (error) {
    logger.error('Error in deleteSupplierQualification controller', { 
      error, 
      supplierId: req.params.supplierId, 
      qualificationId: req.params.qualificationId 
    });
    next(error);
  }
}; 