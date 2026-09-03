const Expense = require('../models/Expense');
const Income = require('../models/Income');

const dateQuery = (query) => {
  const filter = {};
  if (query.from || query.to) filter.date = {};
  if (query.from) filter.date.$gte = new Date(query.from);
  if (query.to) {
    const to = new Date(query.to);
    to.setHours(23, 59, 59, 999);
    filter.date.$lte = to;
  }
  return filter;
};

const listExpenses = async (req, res) => {
  try { res.json({ success: true, data: await Expense.find({ ...dateQuery(req.query), ...(req.query.category ? { category: req.query.category } : {}) }).sort({ date: -1 }) }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error fetching expenses' }); }
};
const createExpense = async (req, res) => {
  try { res.status(201).json({ success: true, data: await Expense.create({ ...req.body, createdBy: req.user._id }) }); }
  catch (error) { res.status(422).json({ success: false, message: error.message }); }
};
const updateExpense = async (req, res) => {
  try { const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' }); res.json({ success: true, data: expense }); }
  catch (error) { res.status(422).json({ success: false, message: error.message }); }
};
const deleteExpense = async (req, res) => {
  try { const expense = await Expense.findByIdAndDelete(req.params.id); if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error deleting expense' }); }
};

const listIncome = async (req, res) => {
  try { res.json({ success: true, data: await Income.find(dateQuery(req.query)).populate('referenceId', 'invoiceNumber').sort({ date: -1 }) }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error fetching income' }); }
};
const createIncome = async (req, res) => {
  try { res.status(201).json({ success: true, data: await Income.create({ ...req.body, source: req.body.source || 'Manual', referenceType: 'manual', referenceId: undefined, createdBy: req.user._id }) }); }
  catch (error) { res.status(422).json({ success: false, message: error.message }); }
};
const updateIncome = async (req, res) => {
  try { const income = await Income.findById(req.params.id); if (!income) return res.status(404).json({ success: false, message: 'Income not found' }); if (income.referenceType !== 'manual') return res.status(409).json({ success: false, message: 'Sale-linked income is read-only' }); const allowed = { title: req.body.title, source: req.body.source, amount: req.body.amount, date: req.body.date }; Object.assign(income, allowed); await income.save(); res.json({ success: true, data: income }); }
  catch (error) { res.status(422).json({ success: false, message: error.message }); }
};
const deleteIncome = async (req, res) => {
  try { const income = await Income.findById(req.params.id); if (!income) return res.status(404).json({ success: false, message: 'Income not found' }); if (income.referenceType !== 'manual') return res.status(409).json({ success: false, message: 'Sale-linked income is read-only' }); await income.deleteOne(); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, message: 'Server error deleting income' }); }
};

module.exports = { listExpenses, createExpense, updateExpense, deleteExpense, listIncome, createIncome, updateIncome, deleteIncome };