const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.route('/')
  .get(protect, getCategories)
  .post(protect, authorizeRoles('Admin', 'Store_Manager'), createCategory);

router.route('/:id')
  .put(protect, authorizeRoles('Admin', 'Store_Manager'), updateCategory)
  .delete(protect, authorizeRoles('Admin', 'Store_Manager'), deleteCategory);

module.exports = router;
