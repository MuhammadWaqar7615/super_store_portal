const mongoose = require('mongoose');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const StockMovement = require('../models/StockMovement');
const Cart = require('../models/Cart');
const SupplierPayment = require('../models/SupplierPayment');

const models = {
  users: User,
  customers: Customer,
  categories: Category,
  products: Product,
  suppliers: Supplier,
  purchases: Purchase,
  sales: Sale,
  payments: Payment,
  income: Income,
  expenses: Expense,
  stockMovements: StockMovement,
  carts: Cart,
  supplierPayments: SupplierPayment
};

const getSettingsSummary = async (req, res) => {
  try {
    const entries = await Promise.all(
      Object.entries(models).map(async ([key, Model]) => [key, await Model.countDocuments()])
    );
    const inventoryStock = await Product.countDocuments({
      $or: [
        { inventoryQuantity: { $gt: 0 } },
        { storeQuantity: { $gt: 0 } }
      ]
    });
    res.json({ success: true, data: { ...Object.fromEntries(entries), inventoryStock } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load settings summary' });
  }
};

const clearModule = async (req, res) => {
  const { module } = req.params;
  if (req.body.confirmed !== true) {
    return res.status(400).json({
      success: false,
      message: 'This destructive action requires confirmation'
    });
  }

  const session = await mongoose.startSession();
  try {
    const deleted = {};
    const remove = async (key, Model, filter = {}) => {
      const result = await Model.deleteMany(filter, { session });
      deleted[key] = result.deletedCount || 0;
    };

    await session.withTransaction(async () => {
      switch (module) {
        case 'inventory':
          await Product.updateMany({}, { $set: { inventoryQuantity: 0, storeQuantity: 0 } }, { session });
          await remove('stockMovements', StockMovement);
          break;
        case 'products':
          await remove('products', Product);
          await remove('stockMovements', StockMovement);
          break;
        case 'categories':
          await remove('categories', Category);
          await Product.updateMany({}, { $unset: { category: 1 } }, { session });
          break;
        case 'suppliers':
          await remove('supplierPayments', SupplierPayment);
          await remove('purchases', Purchase);
          await remove('suppliers', Supplier);
          await Product.updateMany({}, { $unset: { supplier: 1 } }, { session });
          break;
        case 'purchases':
          await remove('purchases', Purchase);
          await remove('stockMovements', StockMovement, { type: 'PURCHASE' });
          await Supplier.updateMany({}, { $set: { currentBalance: 0 } }, { session });
          break;
        case 'sales': {
          await remove('sales', Sale);
          await remove('payments', Payment, { $or: [{ saleId: { $exists: true } }, { referenceType: 'SALE' }] });
          await remove('income', Income, { referenceType: 'sale' });
          await remove('stockMovements', StockMovement, { type: 'SALE' });
          break;
        }
        case 'finance':
          await remove('expenses', Expense);
          await remove('income', Income);
          await remove('supplierPayments', SupplierPayment);
          break;
        case 'payments':
          await remove('payments', Payment);
          break;
        case 'supplierPayments':
          await remove('supplierPayments', SupplierPayment);
          break;
        case 'customers':
          await remove('customers', Customer);
          await remove('carts', Cart);
          break;
        case 'carts':
          await remove('carts', Cart);
          break;
        case 'users':
          await remove('users', User, { _id: { $ne: req.user._id } });
          break;
        case 'income':
          await remove('income', Income, { referenceType: 'manual' });
          break;
        case 'expenses':
          await remove('expenses', Expense);
          break;
        case 'stockMovements':
          await remove('stockMovements', StockMovement);
          break;
        default: {
          const error = new Error('Unsupported settings module');
          error.statusCode = 400;
          throw error;
        }
      }
    });

    res.json({
      success: true,
      message: `${module} data cleared successfully`,
      deleted
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Unable to clear module data' });
  } finally {
    await session.endSession();
  }
};

module.exports = { getSettingsSummary, clearModule };
