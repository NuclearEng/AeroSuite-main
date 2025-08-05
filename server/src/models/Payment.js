/**
 * Payment Model
 * 
 * Defines the schema for payment records
 * Task: TS367 - Payment gateway integration
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'usd',
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'canceled'],
    default: 'pending'
  },
  sessionId: {
    type: String,
    trim: true,
    index: true
  },
  paymentIntentId: {
    type: String,
    trim: true,
    index: true
  },
  chargeId: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  refunded: {
    type: Boolean,
    default: false
  },
  refundId: {
    type: String,
    trim: true
  },
  failureReason: {
    type: String,
    trim: true
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema); 