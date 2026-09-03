const express = require('express');
const router = express.Router();
const { getPendingCarts, getCartById, finalizeCart, completeFinalizedSale } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const cashierOnly = authorizeRoles('Cashier');
const customerOnly = (req, res, next) => {
	if (req.user && !req.user.role) return next();
	return res.status(403).json({ success: false, message: 'Customer access required' });
};

router.get('/pending', protect, cashierOnly, getPendingCarts);
router.get('/:id', protect, cashierOnly, getCartById);
router.post('/:id/finalize', protect, cashierOnly, finalizeCart);
router.post('/sales/:saleId/complete', protect, customerOnly, completeFinalizedSale);

module.exports = router;
