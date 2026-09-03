const Product = require('../models/Product');

const getStoreProducts = async (req, res) => {
  try {
    const filter = { isActive: true, storeQuantity: { $gt: 0 } };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.name = { $regex: req.query.search.trim(), $options: 'i' };

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('supplier', 'name email phone contactPerson')
      .sort({ name: 1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching store products' });
  }
};

module.exports = { getStoreProducts };
