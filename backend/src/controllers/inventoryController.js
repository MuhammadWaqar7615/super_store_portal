const mongoose = require('mongoose');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');

const getInventory = async (req, res) => {
  try {
    const products = await Product.find({ inventoryQuantity: { $gt: 0 } })
      .populate('category', 'name');
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getLowStock = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: {
        $or: [
          { $lte: ["$inventoryQuantity", "$minimumStock"] },
          { $lte: ["$storeQuantity", "$minimumStock"] }
        ]
      }
    });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { productId, quantity, reason, location = 'INVENTORY' } = req.body;
    const numericQuantity = Number(quantity);
    if (!['INVENTORY', 'STORE'].includes(location) || !Number.isFinite(numericQuantity) || numericQuantity === 0) {
      return res.status(400).json({ success: false, message: 'A valid location and non-zero quantity are required' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const quantityField = location === 'STORE' ? 'storeQuantity' : 'inventoryQuantity';
    const previousStock = product[quantityField] || 0;
    const newStock = previousStock + numericQuantity;

    if (newStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock cannot be negative' });
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, [quantityField]: previousStock },
      { $inc: { [quantityField]: numericQuantity } },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(409).json({ success: false, message: 'Stock changed. Please retry the adjustment.' });
    }

    const movement = new StockMovement({
      productId,
      type: 'ADJUSTMENT',
      quantity: numericQuantity,
      previousStock,
      newStock,
      location,
      reason,
      createdBy: req.user._id
    });
    await movement.save();

    res.json({ success: true, data: movement });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const enlistInventory = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { productId } = req.body;
    const quantity = Number(req.body.quantity);
    if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Product and a positive integer quantity are required' });
    }

    let product;
    let movements;
    await session.withTransaction(async () => {
      const productBeforeUpdate = await Product.findOneAndUpdate(
        { _id: productId, inventoryQuantity: { $gte: quantity } },
        {
          $inc: { inventoryQuantity: -quantity, storeQuantity: quantity },
          $set: { isActive: true }
        },
        { session, returnDocument: 'before' }
      );
      if (!productBeforeUpdate) {
        const error = new Error('Insufficient inventory');
        error.statusCode = 409;
        throw error;
      }

      const oldInventory = productBeforeUpdate.inventoryQuantity || 0;
      const oldStore = productBeforeUpdate.storeQuantity || 0;
      const referenceId = new mongoose.Types.ObjectId();
      movements = await StockMovement.create([
        {
          productId,
          type: 'TRANSFER',
          quantity: -quantity,
          previousStock: oldInventory,
          newStock: oldInventory - quantity,
          location: 'INVENTORY',
          fromLocation: 'INVENTORY',
          toLocation: 'STORE',
          referenceType: 'TRANSFER',
          referenceId,
          createdBy: req.user._id,
          reason: 'Enlisted from inventory to store'
        },
        {
          productId,
          type: 'TRANSFER',
          quantity,
          previousStock: oldStore,
          newStock: oldStore + quantity,
          location: 'STORE',
          fromLocation: 'INVENTORY',
          toLocation: 'STORE',
          referenceType: 'TRANSFER',
          referenceId,
          createdBy: req.user._id,
          reason: 'Enlisted from inventory to store'
        }
      ], { session, ordered: true });
      product = await Product.findById(productId).session(session).populate('category', 'name');
    });

    res.json({ success: true, data: { product, movements } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Server error enlisting inventory' });
  } finally {
    await session.endSession();
  }
};

const getMovements = async (req, res) => {
  try {
    const movements = await StockMovement.find({})
      .populate('productId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: movements });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getInventory, getLowStock, adjustStock, enlistInventory, getMovements };
