const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const StockMovement = require('../models/StockMovement');

const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { supplierId, items } = req.body;
    if (!supplierId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Supplier and purchase items are required' });
    }

    let purchase;
    await session.withTransaction(async () => {
      const supplier = await Supplier.findById(supplierId).session(session);
      if (!supplier) {
        const error = new Error('Supplier not found');
        error.statusCode = 404;
        throw error;
      }

      const purchaseItems = [];
      let totalAmount = 0;
      for (const item of items) {
        const quantity = Number(item.quantity);
        const unitCost = Number(item.purchasePrice);
        if (!item.productId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitCost) || unitCost < 0) {
          const error = new Error('Each item requires a valid productId, quantity, and purchasePrice');
          error.statusCode = 400;
          throw error;
        }

        const product = await Product.findById(item.productId).session(session);
        if (!product) {
          const error = new Error('Product not found');
          error.statusCode = 404;
          throw error;
        }

        const lineTotal = quantity * unitCost;
        totalAmount += lineTotal;
        purchaseItems.push({ productId: product._id, quantity, unitCost, total: lineTotal });
      }

      [purchase] = await Purchase.create([{
        supplierId,
        items: purchaseItems,
        totalAmount,
        status: 'RECEIVED',
        paymentStatus: 'UNPAID',
        createdBy: req.user._id
      }], { session });

      for (const item of purchaseItems) {
        const product = await Product.findById(item.productId).session(session);
        const previousInventory = product.inventoryQuantity || 0;
        product.inventoryQuantity = previousInventory + item.quantity;
        product.purchasePrice = item.unitCost;
        await product.save({ session });
        await StockMovement.create([{
          productId: product._id,
          type: 'PURCHASE',
          quantity: item.quantity,
          previousStock: previousInventory,
          newStock: product.inventoryQuantity,
          location: 'INVENTORY',
          referenceType: 'PURCHASE',
          referenceId: purchase._id,
          createdBy: req.user._id,
          reason: `Purchase ${purchase._id}`
        }], { session });
      }

      supplier.currentBalance += totalAmount;
      await supplier.save({ session });
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    console.error('Create Purchase Error:', error);
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Server error' });
  } finally {
    await session.endSession();
  }
};

const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate('supplierId', 'name').sort({ createdAt: -1 });
    res.json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplierId', 'name')
      .populate('items.productId', 'name');
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    res.json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createPurchase, getPurchases, getPurchaseById };
