const mongoose = require('mongoose');

const supplierPaymentSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  amount: { type: Number, required: true, min: 0.01 },
  date: { type: Date, required: true },
  method: { type: String, required: true, trim: true },
  reference: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('SupplierPayment', supplierPaymentSchema);