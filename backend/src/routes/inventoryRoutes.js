const express = require('express');
const router = express.Router();
const { getInventory, getLowStock, adjustStock, getMovements } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, authorizeRoles('Admin', 'Store_Manager'), getInventory);
router.get('/low-stock', protect, authorizeRoles('Admin', 'Store_Manager'), getLowStock);
router.post('/adjustment', protect, authorizeRoles('Admin', 'Store_Manager'), adjustStock);
router.get('/movements', protect, authorizeRoles('Admin', 'Store_Manager'), getMovements);

module.exports = router;
