/**
 * Supplier Audit Service
 * Provides business logic for supplier audits
 */
const SupplierAudit = require('../models/SupplierAudit');
const Supplier = require('../models/supplier.model');
const { NotFoundError, BadRequestError } = require('../utils/errors');

// Default checklist template categories with sample questions
const DEFAULT_CHECKLIST_TEMPLATES = {
  quality: [
    {
      category: 'quality',
      question: 'Does the supplier have a documented quality management system?',
      description: 'Check for ISO 9001 or equivalent certification',
      responseType: 'yes-no',
      weight: 1
    },
    {
      category: 'quality',
      question: 'Are quality objectives defined and measured?',
      description: 'Verify evidence of quality metrics tracking',
      responseType: 'yes-no',
      weight: 0.8
    },
    {
      category: 'quality',
      question: 'Is there a documented process for handling nonconforming products?',
      description: 'Check for nonconformance reporting system',
      responseType: 'yes-no',
      weight: 0.9
    }
  ],
  process: [
    {
      category: 'process',
      question: 'Are production processes documented and controlled?',
      description: 'Check for work instructions and process controls',
      responseType: 'yes-no',
      weight: 0.9
    },
    {
      category: 'process',
      question: 'Is there a process for handling engineering changes?',
      description: 'Verify change management procedures',
      responseType: 'yes-no',
      weight: 0.8
    }
  ],
  facilities: [
    {
      category: 'facilities',
      question: 'Are facilities adequately maintained?',
      description: 'Check cleanliness, organization, and maintenance records',
      responseType: 'yes-no',
      weight: 0.7
    },
    {
      category: 'facilities',
      question: 'Is there appropriate equipment for the required processes?',
      description: 'Verify equipment capabilities match requirements',
      responseType: 'yes-no',
      weight: 0.8
    }
  ],
  environmental: [
    {
      category: 'environmental',
      question: 'Does the supplier have an environmental management system?',
      description: 'Check for ISO 14001 or equivalent certification',
      responseType: 'yes-no',
      weight: 0.7
    },
    {
      category: 'environmental',
      question: 'Is there a waste management program?',
      description: 'Verify waste reduction and recycling efforts',
      responseType: 'yes-no',
      weight: 0.6
    }
  ],
  social: [
    {
      category: 'social',
      question: 'Does the supplier comply with labor regulations?',
      description: 'Check for policies on working hours, minimum wage, etc.',
      responseType: 'yes-no',
      weight: 0.8
    },
    {
      category: 'social',
      question: 'Is there a health and safety management system?',
      description: 'Check for ISO 45001 or equivalent certification',
      responseType: 'yes-no',
      weight: 0.8
    }
  ],
  financial: [
    {
      category: 'financial',
      question: 'Is the supplier financially stable?',
      description: 'Check financial statements and credit rating',
      responseType: 'yes-no',
      weight: 0.9
    },
    {
      category: 'financial',
      question: 'Are there contingency plans for financial risks?',
      description: 'Verify business continuity planning',
      responseType: 'yes-no',
      weight: 0.7
    }
  ],
  documentation: [
    {
      category: 'documentation',
      question: 'Are documents and records adequately controlled?',
      description: 'Check document control procedures',
      responseType: 'yes-no',
      weight: 0.8
    },
    {
      category: 'documentation',
      question: 'Are inspection and test records maintained?',
      description: 'Verify retention of quality records',
      responseType: 'yes-no',
      weight: 0.8
    }
  ]
};

/**
 * Create a new supplier audit
 * @param {Object} auditData Audit data
 * @returns {Promise<Object>} Created audit
 */
exports.createAudit = async (auditData) => {
  // Validate supplier exists
  const supplier = await Supplier.findById(auditData.supplierId);
  if (!supplier) {
    throw new NotFoundError(`Supplier not found with id ${auditData.supplierId}`);
  }

  // Generate audit number if not provided
  if (!auditData.auditNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await SupplierAudit.countDocuments({}) + 1;
    auditData.auditNumber = `AUD-${year}${month}-${count.toString().padStart(4, '0')}`;
  }

  // If no checklist provided, use default template
  if (!auditData.checklist || auditData.checklist.length === 0) {
    auditData.checklist = [];
    Object.values(DEFAULT_CHECKLIST_TEMPLATES).forEach(categoryItems => {
      auditData.checklist.push(...categoryItems);
    });
  }
  
  // Create audit
  const audit = new SupplierAudit(auditData);
  await audit.save();
  
  return audit;
};

/**
 * Get an audit by ID
 * @param {string} id Audit ID
 * @returns {Promise<Object>} Audit
 */
exports.getAuditById = async (id) => {
  const audit = await SupplierAudit.findById(id).populate('supplier');
  if (!audit) {
    throw new NotFoundError(`Audit not found with id ${id}`);
  }
  return audit;
};

/**
 * Update an audit
 * @param {string} id Audit ID
 * @param {Object} updateData Updated audit data
 * @returns {Promise<Object>} Updated audit
 */
exports.updateAudit = async (id, updateData) => {
  const audit = await SupplierAudit.findById(id);
  if (!audit) {
    throw new NotFoundError(`Audit not found with id ${id}`);
  }
  
  // Update audit
  Object.keys(updateData).forEach(key => {
    audit[key] = updateData[key];
  });
  
  await audit.save();
  return audit;
};

/**
 * Delete an audit
 * @param {string} id Audit ID
 * @returns {Promise<boolean>} True if deleted
 */
exports.deleteAudit = async (id) => {
  const result = await SupplierAudit.findByIdAndDelete(id);
  if (!result) {
    throw new NotFoundError(`Audit not found with id ${id}`);
  }
  return true;
};

/**
 * Get all audits for a supplier
 * @param {string} supplierId Supplier ID
 * @returns {Promise<Array>} List of audits
 */
exports.getSupplierAudits = async (supplierId) => {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new NotFoundError(`Supplier not found with id ${supplierId}`);
  }
  
  return SupplierAudit.find({ supplierId }).sort({ auditDate: -1 });
};

/**
 * Get all audits with filtering and pagination
 * @param {Object} queryParams Query parameters for filtering
 * @returns {Promise<Object>} Audits with pagination info
 */
exports.getAudits = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    status,
    result,
    auditType,
    startDate,
    endDate,
    supplierId
  } = queryParams;

  const query = {};
  
  if (status) query.status = status;
  if (result) query.result = result;
  if (auditType) query.auditType = auditType;
  if (supplierId) query.supplierId = supplierId;
  
  if (startDate && endDate) {
    query.auditDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { auditDate: -1 },
    populate: { path: 'supplier', select: 'name code' }
  };
  
  const audits = await SupplierAudit.find(query)
    .populate('supplier', 'name code')
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .sort(options.sort);
  
  const total = await SupplierAudit.countDocuments(query);
  
  return {
    audits,
    total,
    page: options.page,
    limit: options.limit,
    totalPages: Math.ceil(total / options.limit)
  };
};

/**
 * Get default checklist templates
 * @returns {Object} Default checklist templates
 */
exports.getDefaultChecklistTemplates = () => {
  return DEFAULT_CHECKLIST_TEMPLATES;
}; 