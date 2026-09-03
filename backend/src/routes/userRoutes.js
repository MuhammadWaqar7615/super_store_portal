const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();
const adminOnly = [protect, authorizeRoles('Admin')];

router.get('/', ...adminOnly, getUsers);
router.post('/', ...adminOnly, createUser);
router.put('/:id', ...adminOnly, updateUser);
router.delete('/:id', ...adminOnly, deleteUser);

module.exports = router;
