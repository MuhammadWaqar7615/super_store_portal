const express = require('express');
const router = express.Router();
const { getSettingsSummary, clearModule } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const adminOnly = [protect, authorizeRoles('Admin')];

router.get('/summary', ...adminOnly, getSettingsSummary);
router.post('/clear/:module', ...adminOnly, clearModule);

module.exports = router;
