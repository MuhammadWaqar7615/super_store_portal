const bcrypt = require('bcrypt');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const hashPassword = (password) => bcrypt.hash(password, 10);

const DEFAULT_ROLE_PERMISSIONS = {
  Admin: ['dashboard', 'pos', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'sales', 'customers', 'expenses', 'income', 'reports', 'users', 'settings'],
  Store_Manager: ['dashboard', 'pos', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'sales', 'customers', 'expenses', 'income'],
  Inventory_Manager: ['dashboard', 'products', 'categories', 'suppliers', 'purchases', 'inventory', 'reports'],
  Cashier: ['dashboard', 'pos', 'products', 'categories', 'sales', 'customers'],
  'Accounts/Finance': ['dashboard', 'sales', 'purchases', 'expenses', 'income', 'reports'],
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.isActive !== false && (await bcrypt.compare(password, user.password))) {
      const userPermissions = (user.permissions && user.permissions.length > 0)
        ? user.permissions
        : (DEFAULT_ROLE_PERMISSIONS[user.role] || []);

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: userPermissions,
          token: generateToken(user._id, user.role),
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private (Admin/Cashier)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      const userData = user.toObject ? user.toObject() : { ...user };
      if (!userData.permissions || userData.permissions.length === 0) {
        userData.permissions = DEFAULT_ROLE_PERMISSIONS[userData.role] || [];
      }
      res.json({ success: true, data: userData });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Logout user / clear cookie (if applicable)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { loginUser, getUserProfile, logoutUser, hashPassword };
