const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema(
  {
    inspectionNumber: {
      type: String,
      required: [true, 'Inspection number is required'],
      unique: true,
      trim: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer is required'],
      index: true
    },
    // Denormalized field for faster retrieval
    customerName: {
      type: String,
      trim: true,
      maxlength: 200
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier is required'],
      index: true
    },
    // Denormalized field for faster retrieval
    supplierName: {
      type: String,
      trim: true,
      maxlength: 200
    },
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Component',
      index: true
    },
    // Denormalized field for faster retrieval
    componentName: {
      type: String,
      trim: true,
      maxlength: 200
    },
    inspectionType: {
      type: String,
      enum: ['incoming', 'in-process', 'final', 'source', 'audit'],
      required: [true, 'Inspection type is required'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Inspection title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    purchaseOrderNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Purchase order number cannot exceed 50 characters'],
      index: true
    },
    partNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Part number cannot exceed 50 characters'],
      index: true
    },
    revision: {
      type: String,
      trim: true,
      maxlength: [20, 'Revision cannot exceed 20 characters']
    },
    quantity: {
      type: Number,
      min: 0,
      validate: {
        validator: function(v) {
          return v >= 0;
        },
        message: 'Quantity must be a non-negative number'
      }
    },
    inspectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    // Denormalized field for faster retrieval
    inspectorName: {
      type: String,
      trim: true,
      maxlength: 100
    },
    scheduledDate: {
      type: Date,
      // index: true
    },
    startDate: {
      type: Date,
      // index: true
    },
    completionDate: {
      type: Date,
      // index: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed'],
      default: 'scheduled',
      index: true
    },
    result: {
      type: String,
      enum: ['pass', 'fail', 'conditional', 'pending'],
      default: 'pending',
      index: true
    },
    checklistItems: [{
      name: { 
        type: String,
        required: true,
        maxlength: 200
      },
      description: { 
        type: String,
        maxlength: 1000
      },
      status: { 
        type: String,
        enum: ['pending', 'pass', 'fail', 'n/a'],
        default: 'pending'
      },
      comments: { 
        type: String,
        maxlength: 1000
      },
      photos: [{ 
        type: String,
        maxlength: 500
      }],
      measurements: [{
        parameterName: { type: String, maxlength: 100 },
        actualValue: { type: String, maxlength: 50 },
        expectedValue: { type: String, maxlength: 50 },
        tolerance: { type: String, maxlength: 50 },
        unit: { type: String, maxlength: 20 },
        result: { 
          type: String,
          enum: ['pass', 'fail', 'n/a'],
          default: 'n/a'
        }
      }],
      order: { 
        type: Number 
      }
    }],
    defects: [{
      defectType: { 
        type: String,
        required: true,
        maxlength: 100
      },
      description: { 
        type: String,
        maxlength: 1000
      },
      severity: { 
        type: String,
        enum: ['minor', 'major', 'critical'],
        default: 'minor'
      },
      quantity: { 
        type: Number, 
        default: 1,
        min: 0
      },
      photos: [{ 
        type: String,
        maxlength: 500
      }],
      comments: { 
        type: String,
        maxlength: 1000
      }
    }],
    nonConformanceReport: {
      ncNumber: { type: String, maxlength: 50 },
      description: { type: String, maxlength: 2000 },
      disposition: { 
        type: String,
        enum: ['use-as-is', 'rework', 'repair', 'scrap', 'return-to-supplier']
      },
      rootCause: { type: String, maxlength: 2000 },
      correctiveAction: { type: String, maxlength: 2000 },
      approvedBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      approvalDate: { type: Date }
    },
    attachments: [{
      fileName: { type: String, maxlength: 200 },
      fileType: { type: String, maxlength: 50 },
      fileUrl: { type: String, maxlength: 500 },
      uploadedBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      uploadDate: { 
        type: Date,
        default: Date.now
      },
      description: { type: String, maxlength: 500 }
    }],
    notes: {
      type: String,
      maxlength: [5000, 'Notes cannot exceed 5000 characters']
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters']
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: [50, 'Tag cannot exceed 50 characters']
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Limit array sizes to prevent unbounded growth
const MAX_CHECKLIST_ITEMS = 100;
const MAX_DEFECTS = 50;
const MAX_ATTACHMENTS = 20;
const MAX_TAGS = 30;

// Add array size validations
inspectionSchema.path('checklistItems').validate(function(value) {
  return !value || value.length <= MAX_CHECKLIST_ITEMS;
}, `Checklist cannot have more than ${MAX_CHECKLIST_ITEMS} items`);

inspectionSchema.path('defects').validate(function(value) {
  return !value || value.length <= MAX_DEFECTS;
}, `Cannot have more than ${MAX_DEFECTS} defects`);

inspectionSchema.path('attachments').validate(function(value) {
  return !value || value.length <= MAX_ATTACHMENTS;
}, `Cannot have more than ${MAX_ATTACHMENTS} attachments`);

inspectionSchema.path('tags').validate(function(value) {
  return !value || value.length <= MAX_TAGS;
}, `Cannot have more than ${MAX_TAGS} tags`);

// Indexes for faster queries - optimized based on common query patterns
inspectionSchema.index({ customerId: 1, status: 1 });
inspectionSchema.index({ supplierId: 1, status: 1 });
inspectionSchema.index({ scheduledDate: 1 });
inspectionSchema.index({ startDate: 1 });
inspectionSchema.index({ completionDate: 1 });
inspectionSchema.index({ result: 1, status: 1 });
inspectionSchema.index({ createdAt: -1 }); // For sorting by creation date
inspectionSchema.index({ inspectionType: 1, status: 1 }); // For filtering by type and status
inspectionSchema.index({ customerId: 1, supplierId: 1, status: 1 }); // For complex filtering

// Text search index with weights
inspectionSchema.index(
  { inspectionNumber: 'text', title: 'text', description: 'text', tags: 'text' },
  { weights: { inspectionNumber: 10, title: 8, description: 5, tags: 3 } }
);

// Virtual property for computing the inspection duration in hours
inspectionSchema.virtual('durationHours').get(function() {
  if (this.startDate && this.completionDate) {
    const diffMs = this.completionDate - this.startDate;
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal place
  }
  return 0;
});

// Generate inspection number if not provided
inspectionSchema.pre('save', async function(next) {
  if (!this.inspectionNumber) {
    const currentYear = new Date().getFullYear().toString().substr(-2);
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Get count of inspections this month
    const Inspection = mongoose.model('Inspection');
    const count = await Inspection.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    });
    
    // Format: INS-YY-MM-XXXX (where XXXX is sequential number)
    this.inspectionNumber = `INS-${currentYear}-${currentMonth}-${(count + 1).toString().padStart(4, '0')}`;
  }
  
  next();
});

// Update inspection result based on checklist items
inspectionSchema.pre('save', function(next) {
  // Only update result if status is completed and we have checklist items
  if (this.status === 'completed' && this.checklistItems && this.checklistItems.length > 0) {
    const totalItems = this.checklistItems.filter(item => item.status !== 'n/a').length;
    if (totalItems === 0) {
      this.result = 'pending';
    } else {
      const failedItems = this.checklistItems.filter(item => item.status === 'fail').length;
      
      if (failedItems === 0) {
        this.result = 'pass';
      } else if (failedItems / totalItems < 0.1) { // Less than 10% failures
        this.result = 'conditional';
      } else {
        this.result = 'fail';
      }
    }
  }
  
  next();
});

// Populate denormalized fields
inspectionSchema.pre('save', async function(next) {
  try {
    // Populate customer name if not set
    if (!this.customerName && this.customerId) {
      const Customer = mongoose.model('Customer');
      const customer = await Customer.findById(this.customerId);
      if (customer) {
        this.customerName = customer.name;
      }
    }
    
    // Populate supplier name if not set
    if (!this.supplierName && this.supplierId) {
      const Supplier = mongoose.model('Supplier');
      const supplier = await Supplier.findById(this.supplierId);
      if (supplier) {
        this.supplierName = supplier.name;
      }
    }
    
    // Populate component name if not set
    if (!this.componentName && this.componentId) {
      const Component = mongoose.model('Component');
      const component = await Component.findById(this.componentId);
      if (component) {
        this.componentName = component.name;
      }
    }
    
    // Populate inspector name if not set
    if (!this.inspectorName && this.inspectedBy) {
      const User = mongoose.model('User');
      const user = await User.findById(this.inspectedBy);
      if (user) {
        this.inspectorName = `${user.firstName} ${user.lastName}`;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

const Inspection = mongoose.model('Inspection', inspectionSchema);

module.exports = Inspection; 