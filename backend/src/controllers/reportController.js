const Sale = require('../models/Sale');
const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');

const dateMatch = (field, query) => {
  const match = {};
  if (query.from || query.to) match[field] = {};
  if (query.from) match[field].$gte = new Date(query.from);
  if (query.to) { const date = new Date(query.to); date.setHours(23, 59, 59, 999); match[field].$lte = date; }
  return match;
};

const aggregateSum = async (Model, match, amountField) => {
  const result = await Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: amountField }, count: { $sum: 1 } } }]);
  return result[0] || { total: 0, count: 0 };
};

const getSalesReport = async (req, res) => {
  try {
    const match = { status: 'completed', ...dateMatch('createdAt', req.query) };
    const [summary, byChannel, byDate] = await Promise.all([
      aggregateSum(Sale, match, '$total'),
      Sale.aggregate([{ $match: match }, { $group: { _id: '$channel', total: { $sum: '$total' }, count: { $sum: 1 } } }]),
      Sale.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
    ]);
    res.json({ success: true, data: { summary, byChannel, byDate } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error generating sales report' }); }
};

const getPurchasesReport = async (req, res) => {
  try {
    const match = dateMatch('createdAt', req.query);
    const [summary, bySupplier, byProduct] = await Promise.all([
      aggregateSum(Purchase, match, '$totalAmount'),
      Purchase.aggregate([{ $match: match }, { $group: { _id: '$supplierId', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }, { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } }, { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } }, { $project: { _id: 0, supplier: '$supplier.name', total: 1, count: 1 } }]),
      Purchase.aggregate([{ $match: match }, { $unwind: '$items' }, { $group: { _id: '$items.productId', quantity: { $sum: '$items.quantity' }, total: { $sum: '$items.total' } } }, { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } }, { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }, { $project: { _id: 0, product: '$product.name', quantity: 1, total: 1 } }])
    ]);
    res.json({ success: true, data: { summary, bySupplier, byProduct } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error generating purchase report' }); }
};

const getInventoryReport = async (req, res) => {
  try {
    const [summary, byProduct, lowStock, outOfStock] = await Promise.all([
      Product.aggregate([{ $group: { _id: null, products: { $sum: 1 }, units: { $sum: '$stockQuantity' }, value: { $sum: { $multiply: ['$stockQuantity', '$purchasePrice'] } } } }]),
      Product.aggregate([
        { $lookup: { from: 'suppliers', localField: 'supplier', foreignField: '_id', as: 'supplier' } },
        { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, product: '$name', supplier: '$supplier.name', quantity: '$stockQuantity', total: { $multiply: ['$stockQuantity', '$purchasePrice'] } } },
        { $sort: { product: 1 } }
      ]),
      Product.find({ $expr: { $lte: ['$stockQuantity', '$minimumStock'] } }).select('name stockQuantity minimumStock'),
      Product.find({ stockQuantity: 0 }).select('name stockQuantity')
    ]);
    res.json({ success: true, data: { summary: summary[0] || { products: 0, units: 0, value: 0 }, byProduct, lowStock, outOfStock } });
  }
  catch (error) { res.status(500).json({ success: false, message: 'Server error generating inventory report' }); }
};

const getPaymentsReport = async (req, res) => {
  try { const match = dateMatch('createdAt', req.query); const [summary, byStatus] = await Promise.all([aggregateSum(Payment, match, '$amount'), Payment.aggregate([{ $match: match }, { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }])]); res.json({ success: true, data: { summary, byStatus } }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error generating payment report' }); }
};

const getExpensesReport = async (req, res) => {
  try { const match = dateMatch('date', req.query); const [summary, byCategory, byDate] = await Promise.all([aggregateSum(Expense, match, '$amount'), Expense.aggregate([{ $match: match }, { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }]), Expense.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: '$amount' } } }, { $sort: { _id: 1 } }])]); res.json({ success: true, data: { summary, byCategory, byDate } }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error generating expense report' }); }
};

const getIncomeReport = async (req, res) => {
  try { const match = dateMatch('date', req.query); const [summary, bySource, byDate] = await Promise.all([aggregateSum(Income, match, '$amount'), Income.aggregate([{ $match: match }, { $group: { _id: '$referenceType', total: { $sum: '$amount' }, count: { $sum: 1 } } }]), Income.aggregate([{ $match: match }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: '$amount' } } }, { $sort: { _id: 1 } }])]); res.json({ success: true, data: { summary, bySource, byDate } }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error generating income report' }); }
};

const getProfitLossReport = async (req, res) => {
  try {
    const match = { status: 'completed', ...dateMatch('createdAt', req.query) };
    const [sales, expenses] = await Promise.all([Sale.aggregate([{ $match: match }, { $project: { total: 1, cogs: { $sum: { $map: { input: '$items', as: 'item', in: { $multiply: ['$$item.purchaseCost', '$$item.quantity'] } } } } } }, { $group: { _id: null, revenue: { $sum: '$total' }, cogs: { $sum: '$cogs' } } }]), aggregateSum(Expense, dateMatch('date', req.query), '$amount')]);
    const revenue = sales[0]?.revenue || 0; const cogs = sales[0]?.cogs || 0; const expenseTotal = expenses.total || 0;
    res.json({ success: true, data: { revenue, cogs, expenses: expenseTotal, netProfit: revenue - cogs - expenseTotal } });
  } catch (error) { res.status(500).json({ success: false, message: 'Server error generating profit and loss report' }); }
};

const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Sales & Orders Aggregation
    const salesData = await Sale.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          totalCOGS: {
            $sum: {
              $sum: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: { $multiply: ["$$item.quantity", "$$item.purchaseCost"] }
                }
              }
            }
          }
        }
      }
    ]);

    const totalSales = salesData.length > 0 ? salesData[0].totalRevenue : 0;
    const totalOrders = salesData.length > 0 ? salesData[0].totalOrders : 0;
    const totalCOGS = salesData.length > 0 ? salesData[0].totalCOGS : 0;

    // 2. Products Count
    const totalProducts = await Product.countDocuments();

    // 3. Income & Expenses Aggregation
    const incomeData = await Income.aggregate([
      { $group: { _id: null, totalIncome: { $sum: "$amount" } } }
    ]);
    const totalIncome = incomeData.length > 0 ? incomeData[0].totalIncome : 0;

    const expenseData = await Expense.aggregate([
      { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expenseData.length > 0 ? expenseData[0].totalExpenses : 0;

    // 4. Net Profit Calculation
    const netProfit = totalSales - totalCOGS - totalExpenses;

    // 5. Recent Activity (Latest 5 Sales)
    const recentSales = await Sale.find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'name')
      .populate('cashierId', 'name');

    // 6. Low Stock Products
    const lowStockProducts = await Product.find({
      $expr: {
        $or: [
          { $lte: ["$stockQuantity", "$minimumStock"] },
          { $eq: ["$stockQuantity", 0] }
        ]
      }
    }).limit(5);

    const [recentPurchases, recentExpenses, topSellingProducts] = await Promise.all([
      Purchase.find().populate('supplierId', 'name').sort({ createdAt: -1 }).limit(5),
      Expense.find().sort({ date: -1 }).limit(5),
      Sale.aggregate([
        { $match: { status: 'completed' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.productId', productName: { $first: '$items.productName' }, quantity: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
        { $sort: { quantity: -1 } },
        { $limit: 5 }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalSales,
          totalOrders,
          totalProducts,
          totalIncome,
          totalExpenses,
          totalCOGS,
          netProfit
        },
        recentSales,
        lowStockProducts,
        recentPurchases,
        recentExpenses,
        topSellingProducts
      }
    });

  } catch (error) {
    console.error('Dashboard Metrics Error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching metrics' });
  }
};

const getCashierDashboardMetrics = async (req, res) => {
  try {
    const cashierId = req.user._id;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Sales & Orders Aggregation for Cashier (Today)
    const salesData = await Sale.aggregate([
      { 
        $match: { 
          cashierId: cashierId,
          createdAt: { $gte: today } 
        } 
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          itemsSold: {
             $sum: { $sum: "$items.quantity" }
          }
        }
      }
    ]);

    const totalSales = salesData.length > 0 ? salesData[0].totalRevenue : 0;
    const totalOrders = salesData.length > 0 ? salesData[0].totalOrders : 0;
    const itemsSold = salesData.length > 0 ? salesData[0].itemsSold : 0;

    // 2. Recent Activity (Latest 5 Sales by Cashier)
    const recentSales = await Sale.find({ cashierId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customerId', 'name')
      .populate('cashierId', 'name');

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalSales,
          totalOrders,
          itemsSold
        },
        recentSales
      }
    });

  } catch (error) {
    console.error('Cashier Dashboard Metrics Error:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching cashier metrics' });
  }
};

module.exports = {
  getDashboardMetrics,
  getCashierDashboardMetrics,
  getSalesReport,
  getPurchasesReport,
  getInventoryReport,
  getPaymentsReport,
  getExpensesReport,
  getIncomeReport,
  getProfitLossReport
};
