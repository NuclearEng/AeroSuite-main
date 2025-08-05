const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
      unique: true,
      maxlength: [200, 'Supplier name cannot exceed 200 characters']
    },
    code: {
      type: String,
      required: [true, 'Supplier code is required'],
      trim: true,
      unique: true,
      maxlength: [50, 'Supplier code cannot exceed 50 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters']
    },
    type: {
      type: String,
      enum: ['manufacturer', 'distributor', 'service provider', 'other'],
      default: 'manufacturer'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'probation'],
      default: 'active'
    },
    logo: {
      type: String,
      maxlength: [500, 'Logo URL cannot exceed 500 characters']
    },
    website: {
      type: String,
      trim: true,
      maxlength: [500, 'Website URL cannot exceed 500 characters'],
      validate: {
        validator: function(v) {
          return !v || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?$/.test(v);
        },
        message: props => `${props.value} is not a valid URL!`
      }
    },
    primaryContactName: {
      type: String,
      trim: true,
      maxlength: [100, 'Contact name cannot exceed 100 characters']
    },
    primaryContactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: [100, 'Contact email cannot exceed 100 characters'],
      validate: {
        validator: function(v) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: props => `${props.value} is not a valid email!`
      }
    },
    primaryContactPhone: {
      type: String,
      trim: true,
      maxlength: [20, 'Contact phone cannot exceed 20 characters']
    },
    address: {
      street: { type: String, trim: true, maxlength: 200 },
      city: { type: String, trim: true, maxlength: 100 },
      state: { type: String, trim: true, maxlength: 100 },
      zipCode: { type: String, trim: true, maxlength: 20 },
      country: { type: String, trim: true, maxlength: 100 }
    },
    customers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }],
    certifications: [{
      name: { type: String, trim: true, maxlength: 100 },
      issuedBy: { type: String, trim: true, maxlength: 100 },
      issueDate: { type: Date },
      expiryDate: { type: Date },
      documentUrl: { type: String, maxlength: 500 }
    }],
    qualityRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      get: v => Math.round(v * 10) / 10, // Round to 1 decimal place
      set: v => Math.round(v * 10) / 10  // Round to 1 decimal place
    },
    deliveryRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      get: v => Math.round(v * 10) / 10,
      set: v => Math.round(v * 10) / 10
    },
    communicationRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      get: v => Math.round(v * 10) / 10,
      set: v => Math.round(v * 10) / 10
    },
    costRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      get: v => Math.round(v * 10) / 10,
      set: v => Math.round(v * 10) / 10
    },
    overallRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      get: v => Math.round(v * 10) / 10,
      set: v => Math.round(v * 10) / 10
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [5000, 'Notes cannot exceed 5000 characters']
    },
    customFields: {
      type: Map,
      of: String
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters']
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
  }
);

// Add strategic indexes
supplierSchema.index({ status: 1 }); // Frequently filtered by status
supplierSchema.index({ type: 1 }); // Frequently filtered by type
supplierSchema.index({ 'address.country': 1 }); // Geographical queries
supplierSchema.index({ overallRating: -1 }); // Sorting by rating
supplierSchema.index({ createdAt: -1 }); // Chronological sorting

// Limit the number of certifications and tags to prevent unbounded growth
const MAX_CERTIFICATIONS = 20;
const MAX_TAGS = 30;

supplierSchema.path('certifications').validate(function(value) {
  return !value || value.length <= MAX_CERTIFICATIONS;
}, `Supplier cannot have more than ${MAX_CERTIFICATIONS} certifications`);

supplierSchema.path('tags').validate(function(value) {
  return !value || value.length <= MAX_TAGS;
}, `Supplier cannot have more than ${MAX_TAGS} tags`);

// Optimized text index with weights
supplierSchema.index(
  { name: 'text', description: 'text', tags: 'text' },
  { weights: { name: 10, description: 5, tags: 3 } }
);

// Virtual property for inspections
supplierSchema.virtual('inspections', {
  ref: 'Inspection',
  localField: '_id',
  foreignField: 'supplierId',
  justOne: false
});

// Virtual property for components
supplierSchema.virtual('components', {
  ref: 'Component',
  localField: '_id',
  foreignField: 'supplierId',
  justOne: false
});

// Calculate overall rating when saving
supplierSchema.pre('save', function(next) {
  const ratings = [
    this.qualityRating,
    this.deliveryRating,
    this.communicationRating,
    this.costRating
  ].filter(r => r > 0);
  
  if (ratings.length > 0) {
    const sum = ratings.reduce((a, b) => a + b, 0);
    this.overallRating = Number((sum / ratings.length).toFixed(1));
  }
  
  next();
});

// Method to get supplier metrics
supplierSchema.methods.getMetrics = async function() {
  const Inspection = mongoose.model('Inspection');
  
  const totalInspections = await Inspection.countDocuments({ supplierId: this._id });
  const passedInspections = await Inspection.countDocuments({ 
    supplierId: this._id,
    status: 'completed',
    result: 'pass'
  });
  const failedInspections = await Inspection.countDocuments({ 
    supplierId: this._id,
    status: 'completed',
    result: 'fail'
  });
  
  // Get inspection trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyInspections = await Inspection.aggregate([
    {
      $match: {
        supplierId: this._id,
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        total: { $sum: 1 },
        passed: {
          $sum: {
            $cond: [{ $eq: ["$result", "pass"] }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{ $eq: ["$result", "fail"] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);
  
  return {
    totalInspections,
    passedInspections,
    failedInspections,
    passRate: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
    monthlyInspections
  };
};

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier; 