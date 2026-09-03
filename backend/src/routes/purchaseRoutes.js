const express = require('express');
const { createPurchase, getPurchases, getPurchaseById } = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();
const adminOnly = [protect, authorizeRoles('Admin', 'Store_Manager')];

router.get('/', ...adminOnly, getPurchases);
router.post('/', ...adminOnly, createPurchase);
router.get('/:id', ...adminOnly, getPurchaseById);

module.exports = router;
