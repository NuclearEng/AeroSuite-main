const mongoose = require('mongoose');

/**
 * Quality Management System (QMS) Schema
 * Tracks supplier quality management metrics, compliance, and related quality data
 */
const qualityManagementSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    qmsType: {
      type: String,
      enum: ['ISO9001', 'AS9100', 'IATF16949', 'ISO13485', 'Custom', 'None'],
      default: 'None'
    },
    qmsCertification: {
      certificationNumber: { type: String, trim: true },
      issuer: { type: String, trim: true },
      issueDate: { type: Date },
      expiryDate: { type: Date },
      documentUrl: { type: String },
      status: {
        type: String,
        enum: ['active', 'expired', 'suspended', 'pending', 'not-applicable'],
        default: 'not-applicable'
      }
    },
    qualityContacts: [{
      name: { type: String, required: true },
      position: { type: String },
      email: { type: String },
      phone: { type: String },
      isPrimary: { type: Boolean, default: false }
    }],
    complianceStatus: {
      type: String,
      enum: ['compliant', 'minor-issues', 'major-issues', 'non-compliant', 'pending-review'],
      default: 'pending-review'
    },
    lastReviewDate: {
      type: Date
    },
    nextReviewDate: {
      type: Date
    },
    qualityMetrics: {
      defectRate: {
        current: { type: Number, min: 0 },
        target: { type: Number, min: 0, default: 0 },
        history: [{
          value: { type: Number },
          date: { type: Date, default: Date.now }
        }]
      },
      firstTimeYield: {
        current: { type: Number, min: 0, max: 100 },
        target: { type: Number, min: 0, max: 100, default: 98 },
        history: [{
          value: { type: Number },
          date: { type: Date, default: Date.now }
        }]
      },
      onTimeDelivery: {
        current: { type: Number, min: 0, max: 100 },
        target: { type: Number, min: 0, max: 100, default: 95 },
        history: [{
          value: { type: Number },
          date: { type: Date, default: Date.now }
        }]
      },
      ncmrCount: { // Non-Conformance Material Reports
        current: { type: Number, min: 0 },
        target: { type: Number, min: 0, default: 0 },
        history: [{
          value: { type: Number },
          date: { type: Date, default: Date.now }
        }]
      },
      correctionResponseTime: {
        current: { type: Number, min: 0 }, // Average time in days
        target: { type: Number, min: 0, default: 5 },
        history: [{
          value: { type: Number },
          date: { type: Date, default: Date.now }
        }]
      }
    },
    qualityDocuments: [{
      name: { type: String, required: true },
      description: { type: String },
      type: {
        type: String,
        enum: ['manual', 'procedure', 'work-instruction', 'form', 'record', 'certificate', 'report', 'other'],
        default: 'other'
      },
      url: { type: String },
      uploadDate: { type: Date, default: Date.now },
      expiryDate: { type: Date },
      version: { type: String }
    }],
    nonConformances: [{
      ncNumber: { type: String, required: true },
      description: { type: String, required: true },
      severity: {
        type: String,
        enum: ['critical', 'major', 'minor', 'observation'],
        default: 'minor'
      },
      category: {
        type: String,
        enum: ['product', 'process', 'system', 'documentation', 'other'],
        default: 'product'
      },
      status: {
        type: String,
        enum: ['open', 'in-progress', 'closed', 'verified'],
        default: 'open'
      },
      reportedDate: { type: Date, default: Date.now },
      reportedBy: { type: String },
      closedDate: { type: Date },
      correctiveAction: { type: String },
      preventiveAction: { type: String },
      verification: {
        required: { type: Boolean, default: false },
        verified: { type: Boolean, default: false },
        verifiedDate: { type: Date },
        verifiedBy: { type: String }
      },
      attachments: [{
        name: { type: String },
        url: { type: String },
        uploadDate: { type: Date, default: Date.now }
      }]
    }],
    qualityProcesses: [{
      name: { type: String, required: true },
      description: { type: String },
      status: {
        type: String,
        enum: ['active', 'under-review', 'obsolete'],
        default: 'active'
      },
      lastUpdated: { type: Date, default: Date.now },
      documentUrl: { type: String },
      responsiblePerson: { type: String }
    }],
    riskAssessment: {
      lastAssessmentDate: { type: Date },
      overallRiskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical', 'not-assessed'],
        default: 'not-assessed'
      },
      riskFactors: [{
        factor: { type: String, required: true },
        impact: { type: Number, min: 1, max: 5 }, // 1=Low, 5=High
        probability: { type: Number, min: 1, max: 5 }, // 1=Low, 5=High
        mitigationPlan: { type: String }
      }]
    },
    improvementPlans: [{
      title: { type: String, required: true },
      description: { type: String },
      targetDate: { type: Date },
      status: {
        type: String,
        enum: ['planned', 'in-progress', 'completed', 'overdue', 'cancelled'],
        default: 'planned'
      },
      progressPercentage: { type: Number, min: 0, max: 100, default: 0 },
      milestones: [{
        description: { type: String },
        dueDate: { type: Date },
        completed: { type: Boolean, default: false },
        completedDate: { type: Date }
      }],
      owner: { type: String }
    }],
    auditHistory: [{
      auditId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SupplierAudit'
      },
      auditDate: { type: Date },
      auditType: { type: String },
      result: { type: String },
      score: { type: Number }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property for supplier
qualityManagementSchema.virtual('supplier', {
  ref: 'Supplier',
  localField: 'supplierId',
  foreignField: '_id',
  justOne: true
});

// Pre-save hook to calculate compliance status based on metrics and audits
qualityManagementSchema.pre('save', function(next) {
  // Calculate compliance status based on metrics, certifications, and nonconformances
  
  // Check certification status
  const certStatus = this.qmsCertification?.status;
  const hasCertification = certStatus === 'active';
  
  // Check open nonconformances
  let criticalNCs = 0;
  let majorNCs = 0;
  
  if (this.nonConformances && this.nonConformances.length > 0) {
    this.nonConformances.forEach(nc => {
      if (nc.status !== 'closed' && nc.status !== 'verified') {
        if (nc.severity === 'critical') criticalNCs++;
        if (nc.severity === 'major') majorNCs++;
      }
    });
  }
  
  // Determine compliance status
  if (criticalNCs > 0) {
    this.complianceStatus = 'non-compliant';
  } else if (majorNCs > 0) {
    this.complianceStatus = 'major-issues';
  } else if (!hasCertification && this.qmsType !== 'None') {
    this.complianceStatus = 'minor-issues';
  } else if (hasCertification) {
    this.complianceStatus = 'compliant';
  }
  
  next();
});

// Method to update metrics
qualityManagementSchema.methods.updateMetric = async function(metricName, value) {
  if (!this.qualityMetrics[metricName]) {
    throw new Error(`Unknown metric: ${metricName}`);
  }
  
  // Update current value
  this.qualityMetrics[metricName].current = value;
  
  // Add to history
  if (!this.qualityMetrics[metricName].history) {
    this.qualityMetrics[metricName].history = [];
  }
  
  this.qualityMetrics[metricName].history.push({
    value,
    date: new Date()
  });
  
  // Keep only last 24 history entries
  if (this.qualityMetrics[metricName].history.length > 24) {
    this.qualityMetrics[metricName].history = this.qualityMetrics[metricName].history.slice(-24);
  }
  
  return this.save();
};

// Method to add non-conformance
qualityManagementSchema.methods.addNonConformance = async function(ncData) {
  // Generate NC number if not provided
  if (!ncData.ncNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = (this.nonConformances ? this.nonConformances.length : 0) + 1;
    ncData.ncNumber = `NC-${year}${month}-${count.toString().padStart(3, '0')}`;
  }
  
  this.nonConformances.push(ncData);
  return this.save();
};

// Method to get compliance score
qualityManagementSchema.methods.getComplianceScore = function() {
  let score = 0;
  
  // Base score from certification status
  if (this.qmsCertification?.status === 'active') {
    score += 50;
  }
  
  // Adjust based on metrics
  const metrics = this.qualityMetrics;
  
  if (metrics.defectRate?.current <= metrics.defectRate?.target) score += 10;
  if (metrics.firstTimeYield?.current >= metrics.firstTimeYield?.target) score += 10;
  if (metrics.onTimeDelivery?.current >= metrics.onTimeDelivery?.target) score += 10;
  if (metrics.ncmrCount?.current <= metrics.ncmrCount?.target) score += 10;
  if (metrics.correctionResponseTime?.current <= metrics.correctionResponseTime?.target) score += 10;
  
  return score;
};

const QualityManagement = mongoose.model('QualityManagement', qualityManagementSchema);

module.exports = QualityManagement; 