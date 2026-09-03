const express = require('express');
const router = express.Router();
const { getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, authorizeRoles('Admin', 'Store_Manager', 'Cashier'), getCustomers)
  .post(protect, authorizeRoles('Admin', 'Store_Manager', 'Cashier'), createCustomer);

router.route('/:id')
  .get(protect, authorizeRoles('Admin', 'Store_Manager', 'Cashier'), getCustomerById)
  .put(protect, authorizeRoles('Admin', 'Store_Manager'), updateCustomer)
  .delete(protect, authorizeRoles('Admin', 'Store_Manager'), deleteCustomer);

module.exports = router;
