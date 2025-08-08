const mongoose = require('mongoose');

const VerificationOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['received', 'processing', 'completed', 'failed'],
      default: 'received',
      index: true,
    },
    orderDetails: { type: mongoose.Schema.Types.Mixed, required: true },
    receivedAt: { type: Date, default: Date.now, index: true },
    processedAt: { type: Date },
    resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'VerificationResult' },
    error: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'verification_orders' }
);

VerificationOrderSchema.index({ customerId: 1, receivedAt: -1 });

module.exports = mongoose.model('VerificationOrder', VerificationOrderSchema);


