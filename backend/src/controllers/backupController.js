const Cart = require('../models/Cart');
const Category = require('../models/Category');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const StockMovement = require('../models/StockMovement');
const Supplier = require('../models/Supplier');
const SupplierPayment = require('../models/SupplierPayment');
const User = require('../models/User');

const modelsMap = {
  carts: Cart,
  categories: Category,
  customers: Customer,
  expenses: Expense,
  incomes: Income,
  payments: Payment,
  products: Product,
  purchases: Purchase,
  sales: Sale,
  stockMovements: StockMovement,
  suppliers: Supplier,
  supplierPayments: SupplierPayment,
  users: User
};

exports.exportData = async (req, res) => {
  try {
    const data = {};
    for (const [key, Model] of Object.entries(modelsMap)) {
      data[key] = await Model.find({});
    }
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      data
    });
  } catch (error) {
    console.error('Export Error:', error);
    res.status(500).json({ success: false, message: 'Failed to export data' });
  }
};

exports.importData = async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, message: 'No data provided for import' });
    }

    let stats = {};

    for (const [key, Model] of Object.entries(modelsMap)) {
      const records = data[key];
      if (Array.isArray(records) && records.length > 0) {
        const bulkOps = records.map(record => {
          const { _id, ...updateData } = record;
          return {
            updateOne: {
              filter: { _id },
              update: { $set: updateData },
              upsert: true
            }
          };
        });

        const result = await Model.bulkWrite(bulkOps, { ordered: false });
        stats[key] = {
          upserted: result.upsertedCount,
          modified: result.modifiedCount
        };
      } else {
        stats[key] = { upserted: 0, modified: 0 };
      }
    }

    res.status(200).json({
      success: true,
      message: 'Data imported successfully (existing data preserved, backup data added/updated).',
      stats
    });
  } catch (error) {
    console.error('Import Error:', error);
    res.status(500).json({ success: false, message: 'Failed to import data', error: error.message });
  }
};
