/**
 * Quality Management Service
 * Provides business logic for supplier quality management
 */
const QualityManagement = require('../models/QualityManagement');
const SupplierAudit = require('../models/SupplierAudit');
const Supplier = require('../models/supplier.model');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Get quality management record for a supplier
 * Creates a new record if one doesn't exist
 * @param {string} supplierId Supplier ID
 * @returns {Promise<Object>} Quality management record
 */
exports.getSupplierQMS = async (supplierId) => {
  // Validate supplier exists
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new NotFoundError(`Supplier not found with id ${supplierId}`);
  }

  // Find existing QMS record or create a new one
  let qms = await QualityManagement.findOne({ supplierId });
  
  if (!qms) {
    qms = await this.createQMS(supplierId);
  }
  
  return qms;
};

/**
 * Create a new quality management record for a supplier
 * @param {string} supplierId Supplier ID
 * @returns {Promise<Object>} Created quality management record
 */
exports.createQMS = async (supplierId) => {
  // Validate supplier exists
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new NotFoundError(`Supplier not found with id ${supplierId}`);
  }

  // Check if QMS already exists
  const existingQMS = await QualityManagement.findOne({ supplierId });
  if (existingQMS) {
    throw new BadRequestError(`Quality management record already exists for supplier ${supplierId}`);
  }

  // Create new QMS record with default values
  const qms = new QualityManagement({
    supplierId,
    // Use any existing certifications from supplier model if available
    qmsCertification: {
      status: 'not-applicable'
    },
    qualityMetrics: {
      defectRate: {
        current: 0,
        target: 0,
        history: []
      },
      firstTimeYield: {
        current: 100,
        target: 98,
        history: []
      },
      onTimeDelivery: {
        current: 100,
        target: 95,
        history: []
      },
      ncmrCount: {
        current: 0,
        target: 0,
        history: []
      },
      correctionResponseTime: {
        current: 0,
        target: 5,
        history: []
      }
    }
  });

  // If supplier has certifications, add them to QMS
  if (supplier.certifications && supplier.certifications.length > 0) {
    // Find quality-related certifications
    const qualityCert = supplier.certifications.find(cert => 
      cert.name.includes('ISO 9001') || 
      cert.name.includes('AS9100') || 
      cert.name.includes('IATF 16949') ||
      cert.name.includes('ISO 13485') ||
      cert.name.includes('Quality Management')
    );
    
    if (qualityCert) {
      qms.qmsType = qualityCert.name.includes('ISO 9001') ? 'ISO9001' : 
                    qualityCert.name.includes('AS9100') ? 'AS9100' :
                    qualityCert.name.includes('IATF 16949') ? 'IATF16949' :
                    qualityCert.name.includes('ISO 13485') ? 'ISO13485' : 'Custom';
      
      qms.qmsCertification = {
        certificationNumber: qualityCert.id || '',
        issuer: qualityCert.issuedBy || '',
        issueDate: qualityCert.issueDate,
        expiryDate: qualityCert.expiryDate,
        documentUrl: qualityCert.documentUrl || '',
        status: new Date() < new Date(qualityCert.expiryDate) ? 'active' : 'expired'
      };
      
      // Add as a quality document
      qms.qualityDocuments.push({
        name: qualityCert.name,
        description: 'Quality Management System Certification',
        type: 'certificate',
        url: qualityCert.documentUrl,
        uploadDate: qualityCert.issueDate,
        expiryDate: qualityCert.expiryDate
      });
    }
  }
  
  // Add any existing audits to history
  const audits = await SupplierAudit.find({ supplierId, status: 'completed' })
    .sort({ auditDate: -1 })
    .limit(10);
  
  if (audits && audits.length > 0) {
    qms.auditHistory = audits.map(audit => ({
      auditId: audit._id,
      auditDate: audit.auditDate,
      auditType: audit.auditType,
      result: audit.result,
      score: audit.overallScore
    }));
    
    // Set last review date from most recent audit
    qms.lastReviewDate = audits[0].auditDate;
    
    // Set next review date to 1 year after last audit if not already set
    if (!qms.nextReviewDate) {
      const nextReviewDate = new Date(audits[0].auditDate);
      nextReviewDate.setFullYear(nextReviewDate.getFullYear() + 1);
      qms.nextReviewDate = nextReviewDate;
    }
  }
  
  await qms.save();
  
  return qms;
};

/**
 * Update quality management record
 * @param {string} supplierId Supplier ID
 * @param {Object} updateData Updated QMS data
 * @returns {Promise<Object>} Updated quality management record
 */
exports.updateQMS = async (supplierId, updateData) => {
  // Get existing QMS
  const qms = await this.getSupplierQMS(supplierId);
  
  // Update fields
  const allowedFields = [
    'qmsType', 'qmsCertification', 'qualityContacts', 
    'lastReviewDate', 'nextReviewDate', 'qualityDocuments',
    'qualityProcesses', 'riskAssessment', 'improvementPlans'
  ];
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      qms[field] = updateData[field];
    }
  });
  
  // Special handling for nested objects
  if (updateData.qualityMetrics) {
    Object.keys(updateData.qualityMetrics).forEach(metricName => {
      if (qms.qualityMetrics[metricName]) {
        // Update current and target values, but preserve history
        if (updateData.qualityMetrics[metricName].current !== undefined) {
          qms.qualityMetrics[metricName].current = updateData.qualityMetrics[metricName].current;
        }
        
        if (updateData.qualityMetrics[metricName].target !== undefined) {
          qms.qualityMetrics[metricName].target = updateData.qualityMetrics[metricName].target;
        }
      }
    });
  }
  
  await qms.save();
  
  return qms;
};

/**
 * Update a specific quality metric
 * @param {string} supplierId Supplier ID
 * @param {string} metricName Metric name
 * @param {number} value New metric value
 * @returns {Promise<Object>} Updated quality management record
 */
exports.updateMetric = async (supplierId, metricName, value) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Validate metric name
  if (!qms.qualityMetrics[metricName]) {
    throw new BadRequestError(`Invalid metric name: ${metricName}`);
  }
  
  // Update metric
  await qms.updateMetric(metricName, value);
  
  return qms;
};

/**
 * Add a non-conformance record
 * @param {string} supplierId Supplier ID
 * @param {Object} ncData Non-conformance data
 * @returns {Promise<Object>} Updated quality management record
 */
exports.addNonConformance = async (supplierId, ncData) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Add non-conformance
  await qms.addNonConformance(ncData);
  
  // Also update the ncmrCount metric
  const currentCount = qms.qualityMetrics.ncmrCount.current || 0;
  await qms.updateMetric('ncmrCount', currentCount + 1);
  
  return qms;
};

/**
 * Update a non-conformance record
 * @param {string} supplierId Supplier ID
 * @param {string} ncNumber Non-conformance number
 * @param {Object} updateData Updated non-conformance data
 * @returns {Promise<Object>} Updated quality management record
 */
exports.updateNonConformance = async (supplierId, ncNumber, updateData) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Find non-conformance
  const ncIndex = qms.nonConformances.findIndex(nc => nc.ncNumber === ncNumber);
  if (ncIndex === -1) {
    throw new NotFoundError(`Non-conformance ${ncNumber} not found for supplier ${supplierId}`);
  }
  
  // Update non-conformance
  Object.keys(updateData).forEach(key => {
    qms.nonConformances[ncIndex][key] = updateData[key];
  });
  
  // If status changed to closed, set closed date
  if (updateData.status === 'closed' && !qms.nonConformances[ncIndex].closedDate) {
    qms.nonConformances[ncIndex].closedDate = new Date();
  }
  
  await qms.save();
  
  return qms;
};

/**
 * Add quality document
 * @param {string} supplierId Supplier ID
 * @param {Object} documentData Document data
 * @returns {Promise<Object>} Updated quality management record
 */
exports.addQualityDocument = async (supplierId, documentData) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Add document
  qms.qualityDocuments.push({
    ...documentData,
    uploadDate: new Date()
  });
  
  await qms.save();
  
  return qms;
};

/**
 * Update quality document
 * @param {string} supplierId Supplier ID
 * @param {string} documentId Document ID
 * @param {Object} updateData Updated document data
 * @returns {Promise<Object>} Updated quality management record
 */
exports.updateQualityDocument = async (supplierId, documentId, updateData) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Find document
  const docIndex = qms.qualityDocuments.findIndex(doc => doc._id.toString() === documentId);
  if (docIndex === -1) {
    throw new NotFoundError(`Document ${documentId} not found for supplier ${supplierId}`);
  }
  
  // Update document
  Object.keys(updateData).forEach(key => {
    qms.qualityDocuments[docIndex][key] = updateData[key];
  });
  
  await qms.save();
  
  return qms;
};

/**
 * Delete quality document
 * @param {string} supplierId Supplier ID
 * @param {string} documentId Document ID
 * @returns {Promise<Object>} Updated quality management record
 */
exports.deleteQualityDocument = async (supplierId, documentId) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Find document
  const docIndex = qms.qualityDocuments.findIndex(doc => doc._id.toString() === documentId);
  if (docIndex === -1) {
    throw new NotFoundError(`Document ${documentId} not found for supplier ${supplierId}`);
  }
  
  // Remove document
  qms.qualityDocuments.splice(docIndex, 1);
  
  await qms.save();
  
  return qms;
};

/**
 * Add improvement plan
 * @param {string} supplierId Supplier ID
 * @param {Object} planData Improvement plan data
 * @returns {Promise<Object>} Updated quality management record
 */
exports.addImprovementPlan = async (supplierId, planData) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Add improvement plan
  qms.improvementPlans.push(planData);
  
  await qms.save();
  
  return qms;
};

/**
 * Update improvement plan
 * @param {string} supplierId Supplier ID
 * @param {string} planId Plan ID
 * @param {Object} updateData Updated plan data
 * @returns {Promise<Object>} Updated quality management record
 */
exports.updateImprovementPlan = async (supplierId, planId, updateData) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Find plan
  const planIndex = qms.improvementPlans.findIndex(plan => plan._id.toString() === planId);
  if (planIndex === -1) {
    throw new NotFoundError(`Improvement plan ${planId} not found for supplier ${supplierId}`);
  }
  
  // Update plan
  Object.keys(updateData).forEach(key => {
    qms.improvementPlans[planIndex][key] = updateData[key];
  });
  
  await qms.save();
  
  return qms;
};

/**
 * Add milestone to improvement plan
 * @param {string} supplierId Supplier ID
 * @param {string} planId Plan ID
 * @param {Object} milestoneData Milestone data
 * @returns {Promise<Object>} Updated quality management record
 */
exports.addMilestone = async (supplierId, planId, milestoneData) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Find plan
  const planIndex = qms.improvementPlans.findIndex(plan => plan._id.toString() === planId);
  if (planIndex === -1) {
    throw new NotFoundError(`Improvement plan ${planId} not found for supplier ${supplierId}`);
  }
  
  // Add milestone
  qms.improvementPlans[planIndex].milestones.push(milestoneData);
  
  // Update progress percentage based on completed milestones
  const milestones = qms.improvementPlans[planIndex].milestones;
  if (milestones.length > 0) {
    const completedCount = milestones.filter(m => m.completed).length;
    qms.improvementPlans[planIndex].progressPercentage = Math.round((completedCount / milestones.length) * 100);
  }
  
  await qms.save();
  
  return qms;
};

/**
 * Update milestone
 * @param {string} supplierId Supplier ID
 * @param {string} planId Plan ID
 * @param {string} milestoneId Milestone ID
 * @param {Object} updateData Updated milestone data
 * @returns {Promise<Object>} Updated quality management record
 */
exports.updateMilestone = async (supplierId, planId, milestoneId, updateData) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Find plan
  const planIndex = qms.improvementPlans.findIndex(plan => plan._id.toString() === planId);
  if (planIndex === -1) {
    throw new NotFoundError(`Improvement plan ${planId} not found for supplier ${supplierId}`);
  }
  
  // Find milestone
  const milestoneIndex = qms.improvementPlans[planIndex].milestones.findIndex(
    milestone => milestone._id.toString() === milestoneId
  );
  
  if (milestoneIndex === -1) {
    throw new NotFoundError(`Milestone ${milestoneId} not found for plan ${planId}`);
  }
  
  // Update milestone
  Object.keys(updateData).forEach(key => {
    qms.improvementPlans[planIndex].milestones[milestoneIndex][key] = updateData[key];
  });
  
  // If completed status changed, update completedDate
  if (updateData.completed === true && 
      !qms.improvementPlans[planIndex].milestones[milestoneIndex].completedDate) {
    qms.improvementPlans[planIndex].milestones[milestoneIndex].completedDate = new Date();
  }
  
  // Update progress percentage based on completed milestones
  const milestones = qms.improvementPlans[planIndex].milestones;
  if (milestones.length > 0) {
    const completedCount = milestones.filter(m => m.completed).length;
    qms.improvementPlans[planIndex].progressPercentage = Math.round((completedCount / milestones.length) * 100);
  }
  
  await qms.save();
  
  return qms;
};

/**
 * Sync audits with quality management
 * @param {string} supplierId Supplier ID
 * @returns {Promise<Object>} Updated quality management record
 */
exports.syncAudits = async (supplierId) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Get recent audits
  const audits = await SupplierAudit.find({ supplierId, status: 'completed' })
    .sort({ auditDate: -1 })
    .limit(10);
  
  if (audits && audits.length > 0) {
    // Create map of existing audit IDs
    const existingAuditIds = new Map();
    qms.auditHistory.forEach(audit => {
      existingAuditIds.set(audit.auditId.toString(), true);
    });
    
    // Add new audits to history
    audits.forEach(audit => {
      if (!existingAuditIds.has(audit._id.toString())) {
        qms.auditHistory.push({
          auditId: audit._id,
          auditDate: audit.auditDate,
          auditType: audit.auditType,
          result: audit.result,
          score: audit.overallScore
        });
      }
    });
    
    // Sort by audit date descending
    qms.auditHistory.sort((a, b) => new Date(b.auditDate) - new Date(a.auditDate));
    
    // Keep only the 10 most recent audits
    if (qms.auditHistory.length > 10) {
      qms.auditHistory = qms.auditHistory.slice(0, 10);
    }
    
    // Update last review date from most recent audit
    qms.lastReviewDate = audits[0].auditDate;
  }
  
  await qms.save();
  
  return qms;
};

/**
 * Get quality compliance summary for a supplier
 * @param {string} supplierId Supplier ID
 * @returns {Promise<Object>} Compliance summary
 */
exports.getComplianceSummary = async (supplierId) => {
  const qms = await this.getSupplierQMS(supplierId);
  
  // Calculate compliance score
  const complianceScore = qms.getComplianceScore();
  
  // Get open non-conformances
  const openNCs = qms.nonConformances.filter(nc => 
    nc.status !== 'closed' && nc.status !== 'verified'
  );
  
  // Get recent audits from history
  const recentAudits = qms.auditHistory.slice(0, 3);
  
  // Get upcoming review
  const nextReview = qms.nextReviewDate;
  
  // Get certification status
  const certification = {
    type: qms.qmsType,
    status: qms.qmsCertification?.status,
    expiryDate: qms.qmsCertification?.expiryDate
  };
  
  // Get improvement plans in progress
  const improvementPlans = qms.improvementPlans.filter(plan => 
    plan.status === 'in-progress' || plan.status === 'planned'
  );
  
  return {
    supplierId,
    complianceStatus: qms.complianceStatus,
    complianceScore,
    certification,
    lastReviewDate: qms.lastReviewDate,
    nextReviewDate: nextReview,
    openNonConformances: {
      count: openNCs.length,
      critical: openNCs.filter(nc => nc.severity === 'critical').length,
      major: openNCs.filter(nc => nc.severity === 'major').length,
      minor: openNCs.filter(nc => nc.severity === 'minor').length,
      observation: openNCs.filter(nc => nc.severity === 'observation').length
    },
    recentAudits,
    activeImprovementPlans: improvementPlans.length,
    metrics: {
      defectRate: qms.qualityMetrics.defectRate?.current,
      firstTimeYield: qms.qualityMetrics.firstTimeYield?.current,
      onTimeDelivery: qms.qualityMetrics.onTimeDelivery?.current
    }
  };
}; 