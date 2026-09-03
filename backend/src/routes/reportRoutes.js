const express = require('express');
const router = express.Router();
const { getDashboardMetrics, getCashierDashboardMetrics, getSalesReport, getPurchasesReport, getInventoryReport, getPaymentsReport, getExpensesReport, getIncomeReport, getProfitLossReport, getAccountantDashboardMetrics } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/dashboard', protect, authorizeRoles('Admin', 'Store_Manager'), getDashboardMetrics);
router.get('/accountant-dashboard', protect, authorizeRoles('Admin', 'Accounts/Finance', 'Auditor'), getAccountantDashboardMetrics);
router.get('/cashier-dashboard', protect, authorizeRoles('Cashier'), getCashierDashboardMetrics);
router.get('/sales', protect, authorizeRoles('Admin', 'Accounts/Finance', 'Auditor'), getSalesReport);
router.get('/purchases', protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager', 'Accounts/Finance', 'Auditor'), getPurchasesReport);
router.get('/inventory', protect, authorizeRoles('Admin'), getInventoryReport);
router.get('/payments', protect, authorizeRoles('Admin'), getPaymentsReport);
router.get('/expenses', protect, authorizeRoles('Admin', 'Accounts/Finance', 'Auditor'), getExpensesReport);
router.get('/income', protect, authorizeRoles('Admin', 'Accounts/Finance', 'Auditor'), getIncomeReport);
router.get('/profit-loss', protect, authorizeRoles('Admin', 'Accounts/Finance', 'Auditor'), getProfitLossReport);

module.exports = router;
