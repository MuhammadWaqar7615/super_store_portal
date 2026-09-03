const express = require('express');
const router = express.Router();
const { getStoreProducts } = require('../controllers/storeController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/products', protect, authorizeRoles('Admin', 'Cashier', 'Store_Manager', 'Inventory_Manager'), getStoreProducts);

module.exports = router;
