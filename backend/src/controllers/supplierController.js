const supplierService = require('../services/supplierService');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private (Admin, Cashier)
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await supplierService.getAllSuppliers({
      search: req.query.search,
      isActive: req.query.isActive
    });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Server error fetching suppliers' 
    });
  }
};

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private (Admin, Cashier)
const getSupplierById = async (req, res) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Server error fetching supplier' 
    });
  }
};

// @desc    Create a new supplier
// @route   POST /api/suppliers
// @access  Private (Admin only)
const createSupplier = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }

    const supplier = await supplierService.createSupplier(req.body);
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Server error creating supplier' 
    });
  }
};

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin only)
const updateSupplier = async (req, res) => {
  try {
    const supplier = await supplierService.updateSupplier(req.params.id, req.body);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Server error updating supplier' 
    });
  }
};

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin only)
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await supplierService.deleteSupplier(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.json({ success: true, message: 'Supplier removed successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Server error deleting supplier' 
    });
  }
};

// @desc    Get all products attached to a supplier (Traceability)
// @route   GET /api/suppliers/:id/products
// @access  Private (Admin only)
const getSupplierProducts = async (req, res) => {
  try {
    const traceabilityData = await supplierService.getSupplierProductsTraceability(req.params.id);
    res.json({ success: true, data: traceabilityData });
  } catch (error) {
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Server error fetching supplier products' 
    });
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProducts
};
