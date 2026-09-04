const User = require('../models/User');
const { hashPassword } = require('./authController');

const DEFAULT_ROLE_PERMISSIONS = {
  Admin: ['dashboard', 'pos', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'sales', 'customers', 'expenses', 'income', 'reports', 'users', 'settings'],
  Store_Manager: ['dashboard', 'pos', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'sales', 'customers', 'expenses', 'income'],
  Inventory_Manager: ['dashboard', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'reports'],
  Cashier: ['dashboard', 'pos', 'products', 'categories', 'sales', 'customers'],
  'Accounts/Finance': ['dashboard', 'sales', 'purchases', 'expenses', 'income', 'reports'],
};

const normalizeRole = (role) => ({
  Admin: 'Admin',
  Cashier: 'Cashier',
  'Store Manager': 'Store_Manager',
  'Store-Manager': 'Store_Manager',
  Store_Manager: 'Store_Manager',
  'Inventory Manager': 'Inventory_Manager',
  'Inventory-Manager': 'Inventory_Manager',
  Inventory_Manager: 'Inventory_Manager',
  'Accounts/Finance': 'Accounts/Finance',
}[role]);

const publicUser = (user) => {
  const result = user.toObject ? user.toObject() : { ...user };
  delete result.password;
  if (!result.permissions || result.permissions.length === 0) {
    result.permissions = DEFAULT_ROLE_PERMISSIONS[result.role] || [];
  }
  return result;
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const formattedUsers = users.map(user => publicUser(user));
    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, permissions } = req.body;
    const role = normalizeRole(req.body.role);
    if (!name || !email || !password) {
      return res.status(422).json({ success: false, message: 'Name, email, and password are required' });
    }
    if (!role) {
      return res.status(422).json({ success: false, message: 'A valid role is required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email is already in use' });

    const finalPermissions = Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : (DEFAULT_ROLE_PERMISSIONS[role] || []);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: await hashPassword(password),
      role,
      permissions: finalPermissions
    });
    res.status(201).json({ success: true, data: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, isActive, password, permissions } = req.body;
    const role = req.body.role === undefined ? undefined : normalizeRole(req.body.role);
    if (req.params.id === req.user._id.toString() && isActive === false) {
      return res.status(403).json({ success: false, message: 'You cannot deactivate your own account' });
    }
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) {
      if (!role) {
        return res.status(422).json({ success: false, message: 'A valid role is required' });
      }
      updates.role = role;
    }
    if (isActive !== undefined) updates.isActive = isActive;
    if (password) updates.password = await hashPassword(password);
    if (Array.isArray(permissions)) updates.permissions = permissions;

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: publicUser(user) });
  } catch (error) {
    res.status(error.name === 'ValidationError' ? 422 : 500).json({ success: false, message: error.message || 'Server error updating user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You cannot delete your own account' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser, DEFAULT_ROLE_PERMISSIONS };
