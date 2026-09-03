const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const SupplierPayment = require('../models/SupplierPayment');

/**
 * Get all suppliers with optional search and filter
 * Also aggregates product counts per supplier for high-level traceability
 */
const getAllSuppliers = async ({ search, isActive } = {}) => {
  const query = {};

  if (isActive !== undefined && isActive !== '') {
    query.isActive = isActive === 'true' || isActive === true;
  }

  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [
      { name: searchRegex },
      { contactPerson: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { address: searchRegex }
    ];
  }

  const suppliers = await Supplier.find(query).sort({ createdAt: -1 }).lean();

  // Aggregate product counts and total stock per supplier
  const supplierIds = suppliers.map(s => s._id);
  const productAgg = await Product.aggregate([
    { $match: { supplier: { $in: supplierIds } } },
    {
      $group: {
        _id: '$supplier',
        productCount: { $sum: 1 },
        totalStock: { $sum: { $add: ['$inventoryQuantity', '$storeQuantity'] } },
        totalInventoryCost: { $sum: { $multiply: [{ $add: ['$inventoryQuantity', '$storeQuantity'] }, '$purchasePrice'] } }
      }
    }
  ]);

  const aggMap = new Map();
  productAgg.forEach(item => {
    aggMap.set(item._id.toString(), {
      productCount: item.productCount,
      totalStock: item.totalStock,
      totalInventoryCost: item.totalInventoryCost
    });
  });

  return suppliers.map(supplier => {
    const agg = aggMap.get(supplier._id.toString()) || {
      productCount: 0,
      totalStock: 0,
      totalInventoryCost: 0
    };
    return {
      ...supplier,
      ...agg
    };
  });
};

/**
 * Get supplier by ID
 */
const getSupplierById = async (id) => {
  const supplier = await Supplier.findById(id);
  return supplier;
};

/**
 * Create a new supplier
 */
const createSupplier = async (data) => {
  const supplier = new Supplier(data);
  return await supplier.save();
};

/**
 * Update an existing supplier
 */
const updateSupplier = async (id, data) => {
  const supplier = await Supplier.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
  return supplier;
};

/**
 * Delete a supplier
 * Throws error if products are currently linked to preserve traceability
 */
const deleteSupplier = async (id) => {
  const linkedProductsCount = await Product.countDocuments({ supplier: id });
  if (linkedProductsCount > 0) {
    const error = new Error(`Cannot delete supplier. ${linkedProductsCount} product(s) are currently attached to this supplier for traceability.`);
    error.statusCode = 400;
    throw error;
  }

  const [purchaseCount, paymentCount] = await Promise.all([
    Purchase.countDocuments({ supplierId: id }),
    SupplierPayment.countDocuments({ supplierId: id })
  ]);
  if (purchaseCount > 0 || paymentCount > 0) {
    const error = new Error('Cannot delete supplier with purchase or payment history.');
    error.statusCode = 400;
    throw error;
  }

  const supplier = await Supplier.findByIdAndDelete(id);
  return supplier;
};

/**
 * Get all products attached to a specific supplier (Traceability Endpoint)
 * Computes live inventory stats for the supplier's goods
 */
const getSupplierProductsTraceability = async (supplierId) => {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    const error = new Error('Supplier not found');
    error.statusCode = 404;
    throw error;
  }

  const products = await Product.find({ supplier: supplierId })
    .populate('category', 'name')
    .sort({ createdAt: -1 });

  let totalStock = 0;
  let inventoryCostValue = 0;
  let inventoryRetailValue = 0;
  let lowStockCount = 0;

  products.forEach(p => {
    const inventoryStock = Number(p.inventoryQuantity) || 0;
    const storeStock = Number(p.storeQuantity) || 0;
    const stock = inventoryStock + storeStock;
    const purchase = Number(p.purchasePrice) || 0;
    const selling = Number(p.sellingPrice) || 0;
    const minStock = Number(p.minimumStock) || 0;

    totalStock += stock;
    inventoryCostValue += stock * purchase;
    inventoryRetailValue += stock * selling;

    if (stock <= minStock) {
      lowStockCount += 1;
    }
  });

  return {
    supplier,
    products,
    stats: {
      totalProducts: products.length,
      totalStock,
      inventoryCostValue,
      inventoryRetailValue,
      potentialProfit: inventoryRetailValue - inventoryCostValue,
      lowStockCount
    }
  };
};

module.exports = {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierProductsTraceability
};
