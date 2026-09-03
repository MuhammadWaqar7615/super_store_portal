const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  source: { type: String, required: true },
  amount: { type: Number, required: true },
  referenceType: { type: String, enum: ['sale', 'manual'], required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  date: { type: Date, required: true, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Income', incomeSchema);
