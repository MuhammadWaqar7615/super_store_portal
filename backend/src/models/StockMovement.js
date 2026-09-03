const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'TRANSFER'], required: true },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  location: { type: String, enum: ['INVENTORY', 'STORE'] },
  fromLocation: { type: String, enum: ['INVENTORY', 'STORE'] },
  toLocation: { type: String, enum: ['INVENTORY', 'STORE'] },
  referenceType: String,
  referenceId: mongoose.Schema.Types.ObjectId,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
