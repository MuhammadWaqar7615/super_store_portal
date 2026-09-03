const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  inventoryQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  storeQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  minimumStock: {
    type: Number,
    required: true,
    default: 10,
    min: 0,
  },
  unit: {
    type: String,
    required: true, // e.g., kg, pcs, lit
  },
  image: {
    type: String, // Cloudinary URL
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Keep the customer-facing product contract compatible with the previous stock field.
productSchema.virtual('stockQuantity').get(function getStockQuantity() {
  return this.storeQuantity;
});

module.exports = mongoose.model('Product', productSchema);
