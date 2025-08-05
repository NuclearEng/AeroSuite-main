const mongoose = require('mongoose');

/**
 * Risk Assessment Schema
 * Stores supplier risk assessment data
 */
const riskFactorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.1
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 3
  },
  category: {
    type: String,
    required: true,
    enum: ['operational', 'financial', 'compliance', 'geographic', 'strategic'],
    default: 'operational'
  }
});

const riskAssessmentSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    assessmentDate: {
      type: Date,
      default: Date.now
    },
    assessedBy: {
      type: String,
      required: true,
      trim: true
    },
    factors: [riskFactorSchema],
    overallScore: {
      type: Number,
      min: 0,
      max: 5,
      required: true
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true
    },
    notes: {
      type: String,
      trim: true
    },
    mitigationPlan: {
      type: String,
      trim: true
    },
    nextReviewDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'reviewed', 'archived'],
      default: 'completed'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property for supplier
riskAssessmentSchema.virtual('supplier', {
  ref: 'Supplier',
  localField: 'supplierId',
  foreignField: '_id',
  justOne: true
});

// Calculate overall score based on factor weights and scores
riskAssessmentSchema.pre('save', function(next) {
  if (this.factors && this.factors.length > 0) {
    let totalWeight = 0;
    let weightedScore = 0;
    
    this.factors.forEach(factor => {
      totalWeight += factor.weight;
      weightedScore += factor.weight * factor.score;
    });
    
    // Normalize weights if they don't sum to 1
    if (totalWeight > 0 && totalWeight !== 1) {
      weightedScore = weightedScore / totalWeight;
    }
    
    this.overallScore = parseFloat(weightedScore.toFixed(2));
    
    // Determine risk level based on score
    if (this.overallScore >= 4) {
      this.riskLevel = 'low';
    } else if (this.overallScore >= 2.5) {
      this.riskLevel = 'medium';
    } else {
      this.riskLevel = 'high';
    }
  }
  
  next();
});

const RiskAssessment = mongoose.model('RiskAssessment', riskAssessmentSchema);

module.exports = RiskAssessment; 