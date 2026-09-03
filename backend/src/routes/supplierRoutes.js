const express = require('express');
const router = express.Router();
const { 
  getSuppliers, 
  getSupplierById, 
  createSupplier, 
  updateSupplier, 
  deleteSupplier,
  getSupplierProducts 
} = require('../controllers/supplierController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { createSupplierPayment, getSupplierPayments } = require('../controllers/supplierPaymentController');

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager'), createSupplier);

router.route('/:id')
  .get(protect, getSupplierById)
  .put(protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager'), updateSupplier)
  .delete(protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager'), deleteSupplier);

router.route('/:id/products')
  .get(protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager', 'Auditor'), getSupplierProducts);

router.route('/:id/payments')
  .get(protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager', 'Auditor'), getSupplierPayments)
  .post(protect, authorizeRoles('Admin', 'Store_Manager', 'Inventory_Manager'), createSupplierPayment);

module.exports = router;
