const mongoose = require('mongoose');
const createEncryptionPlugin = require('../utils/mongoose-encryption-plugin');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      unique: true
    },
    code: {
      type: String,
      required: [true, 'Customer code is required'],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active'
    },
    logo: {
      type: String
    },
    primaryContactName: {
      type: String,
      trim: true
    },
    primaryContactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    primaryContactPhone: {
      type: String,
      trim: true
    },
    billingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true }
    },
    shippingAddress: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, trim: true }
    },
    contractStartDate: {
      type: Date
    },
    contractEndDate: {
      type: Date
    },
    serviceLevel: {
      type: String,
      enum: ['basic', 'standard', 'premium', 'enterprise'],
      default: 'standard'
    },
    notes: {
      type: String,
      trim: true
    },
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

// Apply encryption plugin for sensitive fields
customerSchema.plugin(createEncryptionPlugin([
  'primaryContactName',
  'primaryContactEmail',
  'primaryContactPhone',
  'billingAddress.street',
  'billingAddress.zipCode',
  'shippingAddress.street',
  'shippingAddress.zipCode',
  'notes'
]));

// Virtual property for suppliers
customerSchema.virtual('suppliers', {
  ref: 'Supplier',
  localField: '_id',
  foreignField: 'customers',
  justOne: false
});

// Virtual property for inspections
customerSchema.virtual('inspections', {
  ref: 'Inspection',
  localField: '_id',
  foreignField: 'customerId',
  justOne: false
});

// Virtual property for users associated with this customer
customerSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'customerId',
  justOne: false
});

// Method to get customer metrics
customerSchema.methods.getMetrics = async function() {
  const Inspection = mongoose.model('Inspection');
  
  const totalInspections = await Inspection.countDocuments({ customerId: this._id });
  const passedInspections = await Inspection.countDocuments({ 
    customerId: this._id,
    status: 'completed',
    result: 'pass'
  });
  const failedInspections = await Inspection.countDocuments({ 
    customerId: this._id,
    status: 'completed',
    result: 'fail'
  });
  
  const supplierCount = await mongoose.model('Supplier')
    .countDocuments({ customers: this._id });
  
  return {
    totalInspections,
    passedInspections,
    failedInspections,
    passRate: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
    supplierCount
  };
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 