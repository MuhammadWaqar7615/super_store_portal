const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const Income = require('../models/Income');

const completeSale = async (saleId, session) => {
  if (!session) {
    throw new Error('A MongoDB session is required to complete a sale');
  }

  const sale = await Sale.findById(saleId).session(session);
  if (!sale) {
    const error = new Error('Sale not found');
    error.statusCode = 404;
    throw error;
  }

  if (sale.status === 'completed') {
    return sale;
  }

  const payment = await Payment.findOne({
    $or: [{ saleId: sale._id }, { referenceType: 'SALE', referenceId: sale._id }]
  }).session(session);
  if (!payment) {
    const error = new Error('Payment not found for sale');
    error.statusCode = 400;
    throw error;
  }

  const completedAt = new Date();
  for (const item of sale.items) {
    const productBeforeUpdate = await Product.findOneAndUpdate(
      { _id: item.productId, storeQuantity: { $gte: item.quantity } },
      { $inc: { storeQuantity: -item.quantity } },
      { session, returnDocument: 'before' }
    );

    if (!productBeforeUpdate) {
      const error = new Error(`Insufficient stock for ${item.productName}`);
      error.statusCode = 409;
      throw error;
    }

    await StockMovement.create([{
      productId: item.productId,
      type: 'SALE',
      quantity: item.quantity,
      previousStock: productBeforeUpdate.storeQuantity,
      newStock: productBeforeUpdate.storeQuantity - item.quantity,
      location: 'STORE',
      referenceType: 'SALE',
      referenceId: sale._id,
      createdBy: sale.cashierId,
      reason: `Sale ${sale.invoiceNumber}`
    }], { session });
  }

  sale.status = 'completed';
  sale.paymentStatus = 'paid';
  await sale.save({ session });

  payment.status = 'succeeded';
  payment.paidAt = completedAt;
  await payment.save({ session });

  const existingIncome = await Income.findOne({
    referenceType: 'sale',
    referenceId: sale._id
  }).session(session);

  if (!existingIncome) {
    await Income.create([{
      title: `Sale ${sale.invoiceNumber}`,
      source: 'Sales',
      amount: sale.total,
      referenceType: 'sale',
      referenceId: sale._id,
      date: completedAt,
      createdBy: sale.cashierId
    }], { session });
  }

  return sale;
};

const completeSaleInTransaction = async (saleId) => {
  const session = await mongoose.startSession();
  try {
    let completedSale;
    await session.withTransaction(async () => {
      completedSale = await completeSale(saleId, session);
    });
    return completedSale;
  } finally {
    await session.endSession();
  }
};

module.exports = { completeSale, completeSaleInTransaction };
