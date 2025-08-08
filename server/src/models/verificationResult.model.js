const mongoose = require('mongoose');

const VerificationResultSchema = new mongoose.Schema(
  {
    resultId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    orderRef: { type: mongoose.Schema.Types.ObjectId, ref: 'VerificationOrder' },
    status: {
      type: String,
      enum: ['success', 'failure', 'partial', 'pending'],
      required: true,
      index: true,
    },
    details: { type: mongoose.Schema.Types.Mixed, required: true },
    sentToCustomerAt: { type: Date },
    retries: { type: Number, default: 0 },
    lastError: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'verification_results' }
);

VerificationResultSchema.index({ orderId: 1, createdAt: -1 });

module.exports = mongoose.model('VerificationResult', VerificationResultSchema);

