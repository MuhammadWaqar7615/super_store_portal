const express = require('express');
const router = express.Router();
const { validateCart, createSale, completeExistingSale, getSales, getSaleById } = require('../controllers/saleController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const staffOnly = authorizeRoles('Admin', 'Store_Manager', 'Cashier', 'Accounts/Finance', 'Auditor');
const posStaffOnly = authorizeRoles('Admin', 'Cashier');

router.post('/validate', protect, posStaffOnly, validateCart);
router.post('/', protect, posStaffOnly, createSale);
router.post('/:id/complete', protect, posStaffOnly, completeExistingSale);
router.get('/', protect, staffOnly, getSales);
router.get('/:id', protect, staffOnly, getSaleById);

module.exports = router;
