const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');

const createSupplierPayment = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { amount, date, method, reference } = req.body;
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0 || !date || !method) {
      return res.status(400).json({ success: false, message: 'Amount, date, and method are required' });
    }

    let payment;
    await session.withTransaction(async () => {
      const supplier = await Supplier.findById(req.params.id).session(session);
      if (!supplier) {
        const error = new Error('Supplier not found');
        error.statusCode = 404;
        throw error;
      }
      if (Number(amount) > supplier.currentBalance) {
        const error = new Error('Payment cannot exceed supplier balance');
        error.statusCode = 400;
        throw error;
      }

      [payment] = await SupplierPayment.create([{
        supplierId: supplier._id,
        amount: Number(amount),
        date,
        method,
        reference,
        createdBy: req.user._id
      }], { session });
      supplier.currentBalance -= Number(amount);
      await supplier.save({ session });
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('Create Supplier Payment Error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Server error' });
  } finally {
    await session.endSession();
  }
};

const getSupplierPayments = async (req, res) => {
  try {
    const payments = await SupplierPayment.find({ supplierId: req.params.id })
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createSupplierPayment, getSupplierPayments };