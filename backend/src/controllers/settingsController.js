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

const DummyPreset = require('../models/DummyPreset');

const defaultPresetData = {
  categories: [
    { name: 'Electronics' },
    { name: 'Beverages' },
    { name: 'Groceries' }
  ],
  suppliers: [
    {
      name: 'Apex Electronics Ltd.',
      contactPerson: 'Michael Scott',
      email: 'apex@electronics.com',
      phone: '+923001112233',
      address: '12 Tech Avenue, Industrial Zone',
      openingBalance: 0,
      currentBalance: 0
    },
    {
      name: 'Global Beverage Distributors',
      contactPerson: 'Sarah Jenkins',
      email: 'sales@globalbeverage.com',
      phone: '+923004445566',
      address: '45 Commerce Way, Logistics Park',
      openingBalance: 0,
      currentBalance: 0
    }
  ],
  products: [
    {
      name: 'Wireless Noise-Canceling Headphones',
      description: 'High quality Bluetooth over-ear headphones with active noise cancellation.',
      categoryIndex: 0,
      supplierIndex: 0,
      purchasePrice: 4500,
      sellingPrice: 6500,
      inventoryQuantity: 50,
      storeQuantity: 25,
      minimumStock: 10,
      unit: 'pcs',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Organic Coffee Beans (1kg)',
      description: 'Premium dark roast Arabica coffee beans imported fresh.',
      categoryIndex: 1,
      supplierIndex: 1,
      purchasePrice: 1200,
      sellingPrice: 1800,
      inventoryQuantity: 100,
      storeQuantity: 40,
      minimumStock: 15,
      unit: 'kg',
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Smart Watch Series 5',
      description: 'Fitness tracker with heart rate monitor, GPS, and OLED display.',
      categoryIndex: 0,
      supplierIndex: 0,
      purchasePrice: 8000,
      sellingPrice: 12000,
      inventoryQuantity: 30,
      storeQuantity: 15,
      minimumStock: 5,
      unit: 'pcs',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
    }
  ],
  customers: [
    {
      name: 'Ali Khan',
      phone: '+923009998877',
      email: 'ali.khan@example.com',
      address: 'Block 5, Clifton, Karachi',
      isRegistered: true
    },
    {
      name: 'Sara Ahmed',
      phone: '+923007776655',
      email: 'sara.ahmed@example.com',
      address: 'Gulberg III, Lahore',
      isRegistered: true
    }
  ],
  expenses: [
    {
      title: 'Store Monthly Rent',
      category: 'Rent',
      amount: 45000,
      description: 'Monthly commercial space lease payment',
      paymentMethod: 'Bank Transfer'
    },
    {
      title: 'Utilities & Electricity',
      category: 'Electricity',
      amount: 12500,
      description: 'Commercial grid electricity bill',
      paymentMethod: 'Cash'
    }
  ],
  manualIncome: [
    {
      title: 'Consulting & Setup Fee',
      source: 'Services',
      amount: 15000,
      referenceType: 'manual'
    }
  ]
};

const clearAll = async (req, res) => {
  if (req.body.confirmed !== true) {
    return res.status(400).json({
      success: false,
      message: 'This destructive action requires confirmation'
    });
  }

  try {
    const deleted = {};
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.') || colName === 'dummypresets') {
        continue;
      }

      if (colName === 'users') {
        const result = await User.deleteMany({ _id: { $ne: req.user._id } });
        deleted['users'] = result.deletedCount || 0;
      } else {
        const result = await db.collection(colName).deleteMany({});
        deleted[colName] = result.deletedCount || 0;
      }
    }

    const totalDeleted = Object.values(deleted).reduce((sum, count) => sum + count, 0);

    res.json({
      success: true,
      message: `All site data wiped successfully (${totalDeleted} total records removed)`,
      deleted,
      totalDeleted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Unable to clear all site data' });
  }
};

const seedDummyData = async (req, res) => {
  try {
    let presetDoc = await DummyPreset.findOne({ key: 'default_erp_preset' });
    if (!presetDoc) {
      presetDoc = await DummyPreset.create({
        key: 'default_erp_preset',
        data: defaultPresetData
      });
    }

    const seed = presetDoc.data || defaultPresetData;
    const summary = {};

    const adminUser = req.user || (await User.findOne({ role: 'Admin' })) || (await User.findOne());
    const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId();

    // Create Categories
    const categoryDocs = [];
    for (const cat of seed.categories) {
      let existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        existing = await Category.create(cat);
      }
      categoryDocs.push(existing);
    }
    summary.categories = categoryDocs.length;

    // Create Suppliers
    const supplierDocs = [];
    for (const sup of seed.suppliers) {
      let existing = await Supplier.findOne({ name: sup.name });
      if (!existing) {
        existing = await Supplier.create(sup);
      }
      supplierDocs.push(existing);
    }
    summary.suppliers = supplierDocs.length;

    // Create Products
    const productDocs = [];
    for (const prod of seed.products) {
      const catId = categoryDocs[prod.categoryIndex]?._id || categoryDocs[0]._id;
      const supId = supplierDocs[prod.supplierIndex]?._id || supplierDocs[0]._id;
      
      let existing = await Product.findOne({ name: prod.name });
      if (!existing) {
        existing = await Product.create({
          name: prod.name,
          description: prod.description,
          category: catId,
          supplier: supId,
          purchasePrice: prod.purchasePrice,
          sellingPrice: prod.sellingPrice,
          inventoryQuantity: prod.inventoryQuantity,
          storeQuantity: prod.storeQuantity,
          minimumStock: prod.minimumStock,
          unit: prod.unit,
          image: prod.image,
          isActive: true
        });
      } else {
        existing.image = prod.image;
        existing.inventoryQuantity = prod.inventoryQuantity;
        existing.storeQuantity = prod.storeQuantity;
        await existing.save();
      }
      productDocs.push(existing);
    }
    summary.products = productDocs.length;

    // Create Purchase Order from Supplier 0
    const purchaseItem1 = {
      productId: productDocs[0]._id,
      quantity: 50,
      unitCost: productDocs[0].purchasePrice,
      total: 50 * productDocs[0].purchasePrice
    };
    const purchaseItem2 = {
      productId: productDocs[2]._id,
      quantity: 30,
      unitCost: productDocs[2].purchasePrice,
      total: 30 * productDocs[2].purchasePrice
    };
    const totalPurchaseCost = purchaseItem1.total + purchaseItem2.total;

    const purchaseDoc = await Purchase.create({
      supplierId: supplierDocs[0]._id,
      createdBy: adminId,
      invoiceNumber: `PO-SEED-${Date.now().toString().slice(-4)}`,
      items: [purchaseItem1, purchaseItem2],
      totalAmount: totalPurchaseCost,
      status: 'RECEIVED',
      paymentStatus: 'PAID'
    });
    summary.purchases = 1;

    // Create Supplier Payment
    await SupplierPayment.create({
      supplierId: supplierDocs[0]._id,
      amount: totalPurchaseCost,
      date: new Date(),
      method: 'Bank Transfer',
      reference: `TRX-${purchaseDoc.invoiceNumber}`,
      createdBy: adminId
    });
    summary.supplierPayments = 1;

    // Create Stock Movements (Purchase & Transfer)
    for (const pItem of [purchaseItem1, purchaseItem2]) {
      await StockMovement.create({
        productId: pItem.productId,
        type: 'PURCHASE',
        quantity: pItem.quantity,
        previousStock: 0,
        newStock: pItem.quantity,
        location: 'INVENTORY',
        referenceType: 'Purchase',
        referenceId: purchaseDoc._id,
        createdBy: adminId,
        reason: 'Supplier Stock Batch Arrival'
      });

      await StockMovement.create({
        productId: pItem.productId,
        type: 'TRANSFER',
        quantity: 15,
        previousStock: pItem.quantity,
        newStock: pItem.quantity - 15,
        fromLocation: 'INVENTORY',
        toLocation: 'STORE',
        referenceType: 'Transfer',
        createdBy: adminId,
        reason: 'Initial Store Shelf Allocation'
      });
    }
    summary.stockMovements = 4;

    // Create Customers
    const customerDocs = [];
    for (const cust of seed.customers) {
      let existing = await Customer.findOne({ phone: cust.phone });
      if (!existing) {
        existing = await Customer.create(cust);
      }
      customerDocs.push(existing);
    }
    summary.customers = customerDocs.length;

    // Create Submitted Cart for Customer 0
    const cartDoc = await Cart.create({
      customerId: customerDocs[0]._id,
      items: [{
        productId: productDocs[0]._id,
        productName: productDocs[0].name,
        quantity: 1,
        unitPriceSnapshot: productDocs[0].sellingPrice
      }],
      status: 'submitted',
      submittedAt: new Date(),
      finalizedBy: adminId
    });
    summary.carts = 1;

    // Create Sale 1 (POS Sale to Customer 0)
    const sale1Item = {
      productId: productDocs[0]._id,
      productName: productDocs[0].name,
      quantity: 1,
      unitPrice: productDocs[0].sellingPrice,
      purchaseCost: productDocs[0].purchasePrice,
      total: productDocs[0].sellingPrice
    };
    const saleDoc1 = await Sale.create({
      invoiceNumber: `INV-SEED-${Date.now().toString().slice(-4)}-1`,
      customerId: customerDocs[0]._id,
      cashierId: adminId,
      cartId: cartDoc._id,
      channel: 'pos',
      items: [sale1Item],
      subtotal: sale1Item.total,
      total: sale1Item.total,
      status: 'completed',
      paymentStatus: 'paid'
    });

    await Payment.create({
      amount: sale1Item.total,
      method: 'cash',
      referenceType: 'SALE',
      referenceId: saleDoc1._id,
      saleId: saleDoc1._id,
      createdBy: adminId,
      paidAt: new Date(),
      status: 'succeeded'
    });

    await Income.create({
      title: `Sale Payment ${saleDoc1.invoiceNumber}`,
      source: 'POS Sale',
      amount: sale1Item.total,
      referenceType: 'sale',
      referenceId: saleDoc1._id,
      createdBy: adminId
    });

    // Create Sale 2 (Walk-in Customer)
    const sale2Item = {
      productId: productDocs[1]._id,
      productName: productDocs[1].name,
      quantity: 2,
      unitPrice: productDocs[1].sellingPrice,
      purchaseCost: productDocs[1].purchasePrice,
      total: 2 * productDocs[1].sellingPrice
    };
    const saleDoc2 = await Sale.create({
      invoiceNumber: `INV-SEED-${Date.now().toString().slice(-4)}-2`,
      walkInCustomerName: 'Tariq Mehmood (Walk-in)',
      walkInCustomerPhone: '+923001239876',
      cashierId: adminId,
      channel: 'pos',
      items: [sale2Item],
      subtotal: sale2Item.total,
      total: sale2Item.total,
      status: 'completed',
      paymentStatus: 'paid'
    });

    await Payment.create({
      amount: sale2Item.total,
      method: 'cash',
      referenceType: 'SALE',
      referenceId: saleDoc2._id,
      saleId: saleDoc2._id,
      createdBy: adminId,
      paidAt: new Date(),
      status: 'succeeded'
    });

    await Income.create({
      title: `Sale Payment ${saleDoc2.invoiceNumber}`,
      source: 'POS Sale',
      amount: sale2Item.total,
      referenceType: 'sale',
      referenceId: saleDoc2._id,
      createdBy: adminId
    });
    summary.sales = 2;
    summary.payments = 2;

    // Create Manual Income
    for (const inc of seed.manualIncome) {
      await Income.create({
        ...inc,
        createdBy: adminId
      });
    }

    // Create Expenses
    for (const exp of seed.expenses) {
      await Expense.create({
        ...exp,
        createdBy: adminId
      });
    }
    summary.expenses = seed.expenses.length;

    res.json({
      success: true,
      message: 'Dummy preset object fetched from MongoDB and sample data generated successfully across all modules!',
      summary
    });
  } catch (error) {
    console.error('Seed dummy data error:', error);
    res.status(500).json({ success: false, message: error.message || 'Unable to seed dummy data' });
  }
};

module.exports = { getSettingsSummary, clearModule, clearAll, seedDummyData };
