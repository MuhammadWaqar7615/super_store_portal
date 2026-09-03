const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');

// @desc    Get all products (with optional filters by category or supplier)
// @route   GET /api/products
// @access  Public (or protected)
const getProducts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.supplier) {
      filter.supplier = req.query.supplier;
    }
    if (req.userType === 'customer' || !req.user.role) {
      filter.isActive = true;
      filter.storeQuantity = { $gt: 0 };
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name email phone contactPerson')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('supplier', 'name email phone contactPerson address');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin only)
const createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    delete productData.stockQuantity;
    delete productData.inventoryQuantity;
    delete productData.storeQuantity;
    if (req.file) {
      productData.image = req.file.path;
    }
    if (!productData.supplier || productData.supplier === 'null') {
      return res.status(422).json({ success: false, message: 'Supplier is required' });
    }
    if (productData.supplier === '' || productData.supplier === 'null' || !productData.supplier) {
      delete productData.supplier;
    }
    const product = new Product(productData);
    const createdProduct = await product.save();
    const populatedProduct = await Product.findById(createdProduct._id)
      .populate('category', 'name')
      .populate('supplier', 'name email phone contactPerson');

    res.status(201).json({ success: true, data: populatedProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin only)
const updateProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    delete productData.stockQuantity;
    delete productData.inventoryQuantity;
    delete productData.storeQuantity;
    if (req.file) {
      productData.image = req.file.path;
    }
    if (productData.supplier === '' || productData.supplier === 'null') {
      productData.supplier = null;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true, runValidators: true })
      .populate('category', 'name')
      .populate('supplier', 'name email phone contactPerson');

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    await StockMovement.deleteMany({ productId: product._id });
    res.json({ success: true, message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
