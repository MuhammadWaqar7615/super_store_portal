const express = require('express');
const router = express.Router();
const { exportData, importData } = require('../controllers/backupController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const adminOnly = [protect, authorizeRoles('Admin')];

router.get('/export', ...adminOnly, exportData);
router.post('/import', ...adminOnly, importData);

module.exports = router;
