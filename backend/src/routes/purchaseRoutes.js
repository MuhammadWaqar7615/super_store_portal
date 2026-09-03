const express = require('express');
const { createPurchase, getPurchases, getPurchaseById } = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();
const purchaseRead = [protect, authorizeRoles('Admin', 'Store_Manager', 'Accounts/Finance', 'Auditor')];
const purchaseWrite = [protect, authorizeRoles('Admin', 'Store_Manager')];

router.get('/', ...purchaseRead, getPurchases);
router.post('/', ...purchaseWrite, createPurchase);
router.get('/:id', ...purchaseRead, getPurchaseById);

module.exports = router;
