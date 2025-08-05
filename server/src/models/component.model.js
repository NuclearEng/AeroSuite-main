const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Component name is required'],
      trim: true
    },
    partNumber: {
      type: String,
      required: [true, 'Part number is required'],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    revision: {
      type: String,
      trim: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required']
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required']
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'obsolete', 'in-development'],
      default: 'active'
    },
    specs: [{
      name: { type: String, required: true },
      value: { type: String },
      unit: { type: String },
      tolerance: { type: String },
      criticality: { 
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      }
    }],
    documents: [{
      name: { type: String },
      type: { 
        type: String,
        enum: ['drawing', 'specification', 'procedure', 'certificate', 'other'],
      },
      url: { type: String },
      version: { type: String },
      uploadDate: { type: Date, default: Date.now }
    }],
    images: [{
      url: { type: String },
      description: { type: String },
      isPrimary: { type: Boolean, default: false }
    }],
    materialInfo: {
      material: { type: String },
      finish: { type: String },
      weight: { type: Number },
      weightUnit: { 
        type: String,
        enum: ['g', 'kg', 'lb', 'oz'],
        default: 'g'
      },
      dimensions: {
        length: { type: Number },
        width: { type: Number },
        height: { type: Number },
        unit: { 
          type: String, 
          enum: ['mm', 'cm', 'in', 'ft'],
          default: 'mm'
        }
      }
    },
    criticalCharacteristics: [{
      name: { type: String },
      description: { type: String },
      inspectionMethod: { type: String },
      acceptanceCriteria: { type: String }
    }],
    notes: {
      type: String,
      trim: true
    },
    tags: [{
      type: String,
      trim: true
    }],
    customFields: {
      type: Map,
      of: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for part number and revision
componentSchema.index({ partNumber: 1, revision: 1 });
// Text search index
componentSchema.index({ name: 'text', partNumber: 'text', description: 'text' });

// Virtual property for inspections
componentSchema.virtual('inspections', {
  ref: 'Inspection',
  localField: '_id',
  foreignField: 'componentId',
  justOne: false
});

// Virtual property for quality metrics
componentSchema.methods.getQualityMetrics = async function() {
  const Inspection = mongoose.model('Inspection');
  
  const totalInspections = await Inspection.countDocuments({ 
    componentId: this._id,
    status: 'completed'
  });
  
  const passedInspections = await Inspection.countDocuments({ 
    componentId: this._id,
    status: 'completed',
    result: 'pass'
  });
  
  const failedInspections = await Inspection.countDocuments({ 
    componentId: this._id,
    status: 'completed',
    result: 'fail'
  });
  
  const conditionalInspections = await Inspection.countDocuments({ 
    componentId: this._id,
    status: 'completed',
    result: 'conditional'
  });
  
  // Get most common defects
  const defects = await Inspection.aggregate([
    { $match: { 
      componentId: this._id,
      status: 'completed',
      'defects.0': { $exists: true }
    }},
    { $unwind: '$defects' },
    { $group: {
      _id: '$defects.defectType',
      count: { $sum: 1 },
      severity: { $first: '$defects.severity' }
    }},
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  
  return {
    totalInspections,
    passedInspections,
    failedInspections,
    conditionalInspections,
    passRate: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
    commonDefects: defects
  };
};

const Component = mongoose.model('Component', componentSchema);

module.exports = Component; 