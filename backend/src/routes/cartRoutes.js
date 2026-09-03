const express = require('express');
const router = express.Router();
const { submitCart, getPendingCarts, getCartById, finalizeCart, rejectCart, completeFinalizedSale } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const cashierOnly = authorizeRoles('Admin', 'Cashier');
const customerOnly = (req, res, next) => {
	if (req.user && !req.user.role) return next();
	return res.status(403).json({ success: false, message: 'Customer access required' });
};

router.post('/', protect, customerOnly, submitCart);
router.get('/pending', protect, cashierOnly, getPendingCarts);
router.get('/:id', protect, cashierOnly, getCartById);
router.post('/:id/finalize', protect, cashierOnly, finalizeCart);
router.post('/:id/reject', protect, cashierOnly, rejectCart);
router.post('/sales/:saleId/complete', protect, customerOnly, completeFinalizedSale);

module.exports = router;
