const express = require('express');
const router = express.Router();
const { getDashboardMetrics, getCashierDashboardMetrics, getSalesReport, getPurchasesReport, getInventoryReport, getPaymentsReport, getExpensesReport, getIncomeReport, getProfitLossReport } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/dashboard', protect, authorizeRoles('Admin'), getDashboardMetrics);
router.get('/cashier-dashboard', protect, authorizeRoles('Cashier'), getCashierDashboardMetrics);
router.get('/sales', protect, authorizeRoles('Admin'), getSalesReport);
router.get('/purchases', protect, authorizeRoles('Admin'), getPurchasesReport);
router.get('/inventory', protect, authorizeRoles('Admin'), getInventoryReport);
router.get('/payments', protect, authorizeRoles('Admin'), getPaymentsReport);
router.get('/expenses', protect, authorizeRoles('Admin'), getExpensesReport);
router.get('/income', protect, authorizeRoles('Admin'), getIncomeReport);
router.get('/profit-loss', protect, authorizeRoles('Admin'), getProfitLossReport);

module.exports = router;
