const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, enum: ['Electricity', 'Rent', 'Salary', 'Internet', 'Maintenance', 'Marketing', 'Transport', 'Stationery', 'Utilities', 'Other'], required: true },
  amount: { type: Number, required: true, min: 0 },
  description: { type: String },
  paymentMethod: { type: String },
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
