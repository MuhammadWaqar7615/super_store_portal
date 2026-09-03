const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(protect, getProducts)
  .post(protect, authorizeRoles('Admin', 'Store_Manager'), upload.single('image'), createProduct);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, authorizeRoles('Admin', 'Store_Manager'), upload.single('image'), updateProduct)
  .delete(protect, authorizeRoles('Admin', 'Store_Manager'), deleteProduct);

module.exports = router;
