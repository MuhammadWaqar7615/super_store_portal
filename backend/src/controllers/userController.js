const User = require('../models/User');
const { hashPassword } = require('./authController');

const publicUser = (user) => {
  const result = user.toObject ? user.toObject() : user;
  delete result.password;
  return result;
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(422).json({ success: false, message: 'Name, email, and password are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email is already in use' });
    const user = await User.create({ name, email, password: await hashPassword(password), role: 'Cashier' });
    res.status(201).json({ success: true, data: publicUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, role, isActive, password } = req.body;
    if (req.params.id === req.user._id.toString() && isActive === false) {
      return res.status(403).json({ success: false, message: 'You cannot deactivate your own account' });
    }
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (password) updates.password = await hashPassword(password);
    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
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

module.exports = { getUsers, createUser, updateUser, deleteUser };