const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  method: { type: String, enum: ['stripe', 'cash'], required: true },
  referenceType: { type: String, enum: ['SALE', 'PURCHASE'] },
  referenceId: mongoose.Schema.Types.ObjectId,
  
  // Added fields to match store app's schema for cross-compatibility
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  stripeClientSecret: String,
  currency: { type: String, default: 'pkr' },
  transactionReference: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  webhookEventId: String,
  webhookProcessedAt: Date,
  paidAt: Date,
  
  stripePaymentIntentId: String,
  status: { type: String, enum: ['pending', 'processing', 'succeeded', 'failed', 'refunded', 'PENDING', 'COMPLETED', 'FAILED', 'cancelled'], default: 'pending' }
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Payment', paymentSchema);
