const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const { completeSale, completeSaleInTransaction } = require('../services/saleService');

const validateCart = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.productId} not found` });
      }
      if (product.storeQuantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient store stock for ${product.name}` });
      }

      const total = product.sellingPrice * item.quantity;
      subtotal += total;

      validatedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        purchaseCost: product.purchasePrice,
        total
      });
    }

    res.json({ success: true, data: { items: validatedItems, subtotal, total: subtotal } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createSale = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { items, customerId, walkInCustomerName, walkInCustomerPhone, paymentStatus, stripePaymentIntentId } = req.body;

    let subtotal = 0;
    const validatedItems = [];

    // First validate and prepare items, calculate subtotal
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found` });
      }

      const itemTotal = product.sellingPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        productId: product._id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        purchaseCost: product.purchasePrice,
        total: itemTotal,
        // keep reference to product for stock update
        productDoc: product
      });
    }

    const sale = new Sale({
      invoiceNumber: `INV-${Date.now()}`,
      customerId,
      walkInCustomerName,
      walkInCustomerPhone,
      cashierId: req.user._id,
      channel: 'pos',
      items: validatedItems.map(({ productDoc, ...rest }) => rest), // remove productDoc before saving
      subtotal,
      total: subtotal,
      status: 'pending',
      paymentStatus: 'pending'
    });

    let completedSale;
    await session.withTransaction(async () => {
      await sale.save({ session });
      await Payment.create([{
        amount: sale.total,
        method: stripePaymentIntentId ? 'stripe' : 'cash',
        referenceType: 'SALE',
        referenceId: sale._id,
        saleId: sale._id,
        stripePaymentIntentId,
        createdBy: req.user._id,
        status: 'pending'
      }], { session });
      completedSale = await completeSale(sale._id, session);
    });

    res.status(201).json({ success: true, data: completedSale });
  } catch (error) {
    console.error('Create Sale Error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Server error' });
  } finally {
    await session.endSession();
  }
};

const completeExistingSale = async (req, res) => {
  try {
    const saleOwnership = await Sale.findById(req.params.id).select('cashierId');
    if (!saleOwnership) return res.status(404).json({ success: false, message: 'Sale not found' });
    if (req.user.role === 'Cashier' && saleOwnership.cashierId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const sale = await completeSaleInTransaction(req.params.id);
    res.json({ success: true, data: sale });
  } catch (error) {
    console.error('Complete Sale Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Unable to complete sale'
    });
  }
};

const getSales = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Cashier') {
      query.cashierId = req.user._id;
    }

    const sales = await Sale.find(query)
      .populate('customerId', 'name')
      .populate('cashierId', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customerId', 'name')
      .populate('cashierId', 'name');
    if (!sale) return res.status(404).json({ success: false, message: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { validateCart, createSale, completeExistingSale, getSales, getSaleById };
