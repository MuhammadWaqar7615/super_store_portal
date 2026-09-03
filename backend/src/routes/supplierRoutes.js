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
  .post(protect, authorizeRoles('Admin'), createSupplier);

router.route('/:id')
  .get(protect, getSupplierById)
  .put(protect, authorizeRoles('Admin'), updateSupplier)
  .delete(protect, authorizeRoles('Admin'), deleteSupplier);

router.route('/:id/products')
  .get(protect, authorizeRoles('Admin'), getSupplierProducts);

router.route('/:id/payments')
  .get(protect, authorizeRoles('Admin'), getSupplierPayments)
  .post(protect, authorizeRoles('Admin'), createSupplierPayment);

module.exports = router;
