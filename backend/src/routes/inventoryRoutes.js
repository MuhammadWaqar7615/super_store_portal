const express = require('express');
const router = express.Router();
const { getInventory, getLowStock, adjustStock, enlistInventory, getMovements } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager', 'Auditor'), getInventory);
router.get('/low-stock', protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager', 'Auditor'), getLowStock);
router.post('/adjustment', protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager'), adjustStock);
router.post('/enlist', protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager'), enlistInventory);
router.get('/movements', protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager', 'Auditor'), getMovements);

module.exports = router;
