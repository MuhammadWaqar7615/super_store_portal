const express = require('express');
const router = express.Router();
const { getSettingsSummary, clearModule, clearAll, seedDummyData } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const adminOnly = [protect, authorizeRoles('Admin')];

router.get('/summary', ...adminOnly, getSettingsSummary);
router.post('/seed-dummy', ...adminOnly, seedDummyData);
router.post('/clear-all', ...adminOnly, clearAll);
router.post('/clear/:module', ...adminOnly, clearModule);

module.exports = router;
