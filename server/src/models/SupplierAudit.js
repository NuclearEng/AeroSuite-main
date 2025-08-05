const mongoose = require('mongoose');

/**
 * Supplier Audit Schema
 * Stores supplier audit data including checklist items and results
 */
const checklistItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['quality', 'process', 'facilities', 'environmental', 'social', 'financial', 'documentation'],
    default: 'quality'
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  responseType: {
    type: String,
    enum: ['yes-no', 'scale', 'text', 'multiple-choice'],
    default: 'yes-no'
  },
  options: [String], // For multiple-choice questions
  score: {
    type: Number,
    min: 0,
    max: 5
  },
  weight: {
    type: Number,
    min: 0,
    max: 1,
    default: 1
  },
  evidence: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: { type: String },
    url: { type: String },
    uploadDate: { type: Date, default: Date.now }
  }],
  findings: [{
    type: {
      type: String,
      enum: ['observation', 'minor-nc', 'major-nc', 'critical-nc'],
      default: 'observation'
    },
    description: { type: String },
    correctiveAction: { type: String },
    dueDate: { type: Date }
  }]
});

const supplierAuditSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    auditNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    auditType: {
      type: String,
      enum: ['initial', 'surveillance', 'recertification', 'follow-up', 'special'],
      default: 'initial'
    },
    auditDate: {
      type: Date,
      required: true
    },
    scheduledDate: {
      type: Date
    },
    completionDate: {
      type: Date
    },
    auditTeam: [{
      name: { type: String, required: true },
      role: { type: String },
      email: { type: String }
    }],
    auditorName: {
      type: String,
      required: true,
      trim: true
    },
    auditScope: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['planned', 'in-progress', 'completed', 'cancelled', 'delayed'],
      default: 'planned'
    },
    result: {
      type: String,
      enum: ['pass', 'conditional', 'fail', 'pending'],
      default: 'pending'
    },
    checklist: [checklistItemSchema],
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    findings: {
      observations: { type: Number, default: 0 },
      minorNonConformities: { type: Number, default: 0 },
      majorNonConformities: { type: Number, default: 0 },
      criticalNonConformities: { type: Number, default: 0 }
    },
    summary: {
      type: String,
      trim: true
    },
    recommendations: {
      type: String,
      trim: true
    },
    nextAuditDate: {
      type: Date
    },
    attachments: [{
      name: { type: String },
      url: { type: String },
      type: { 
        type: String,
        enum: ['report', 'evidence', 'procedure', 'certificate', 'other'],
        default: 'other'
      },
      uploadDate: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property for supplier
supplierAuditSchema.virtual('supplier', {
  ref: 'Supplier',
  localField: 'supplierId',
  foreignField: '_id',
  justOne: true
});

// Calculate findings count and overall score before saving
supplierAuditSchema.pre('save', function(next) {
  // Only calculate if audit is complete and has checklist items
  if (this.status === 'completed' && this.checklist && this.checklist.length > 0) {
    // Count findings
    let observations = 0;
    let minorNCs = 0;
    let majorNCs = 0;
    let criticalNCs = 0;
    
    // Calculate score
    let totalWeight = 0;
    let weightedScore = 0;
    
    this.checklist.forEach(item => {
      // Count findings
      if (item.findings && item.findings.length > 0) {
        item.findings.forEach(finding => {
          switch (finding.type) {
            case 'observation':
              observations++;
              break;
            case 'minor-nc':
              minorNCs++;
              break;
            case 'major-nc':
              majorNCs++;
              break;
            case 'critical-nc':
              criticalNCs++;
              break;
          }
        });
      }
      
      // Calculate weighted score
      if (item.score !== undefined && item.weight !== undefined) {
        totalWeight += item.weight;
        weightedScore += item.weight * item.score;
      }
    });
    
    // Update findings count
    this.findings = {
      observations,
      minorNonConformities: minorNCs,
      majorNonConformities: majorNCs,
      criticalNonConformities: criticalNCs
    };
    
    // Calculate overall score (as percentage)
    if (totalWeight > 0) {
      const maxPossibleScore = totalWeight * 5; // 5 is max score per item
      this.overallScore = Math.round((weightedScore / maxPossibleScore) * 100);
    }
    
    // Determine result based on findings
    if (criticalNCs > 0 || majorNCs >= 3) {
      this.result = 'fail';
    } else if (majorNCs > 0 || minorNCs >= 5) {
      this.result = 'conditional';
    } else {
      this.result = 'pass';
    }
  }
  
  next();
});

const SupplierAudit = mongoose.model('SupplierAudit', supplierAuditSchema);

module.exports = SupplierAudit; 