import React, { useEffect, useState } from 'react';
import { ArrowRight, FilePlus2, Landmark, Receipt, TrendingUp, Wallet, PieChart, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAccountantDashboardMetrics } from '../services/reportService';

const money = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const AccountantDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getAccountantDashboardMetrics()
      .then((response) => setData(response.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load financial dashboard'));
  }, []);

  if (error) {
    return <div className="min-h-screen bg-[#064e3b] p-6 text-red-200">{error}</div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-[#064e3b] p-6 text-white">Loading financial dashboard...</div>;
  }

  const { metrics, recentExpenses, recentIncome, expenseByCategory, incomeByType } = data;

  return (
    <div className="min-h-screen bg-[#064e3b] text-white p-6 lg:p-8 -m-4 lg:-m-8">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.12),transparent_28%)]" />
      <header className="relative mb-8">
        <p className="text-emerald-300 uppercase tracking-[0.3em] text-xs mb-2">Finance Workspace</p>
        <h1 className="text-4xl font-extrabold">Financial Dashboard</h1>
        <p className="text-gray-300 mt-2 max-w-2xl">Monitor revenue, costs, expenses, and profit in one place. Operational modules stay out of scope for this role.</p>
      </header>

      <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {[
          ['Revenue', metrics.totalRevenue, <TrendingUp />],
          ['Orders', metrics.totalOrders, <Receipt />],
          ['Expenses', metrics.totalExpenses, <Wallet />],
          ['COGS', metrics.totalCOGS, <Landmark />],
          ['Net Profit', metrics.netProfit, <BarChart3 />],
        ].map(([label, value, icon]) => (
          <div key={label} className="rounded-2xl bg-white/10 border border-white/15 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-gray-300 mb-3">
              <span className="text-xs uppercase tracking-wider">{label}</span>
              <span className="text-emerald-300">{icon}</span>
            </div>
            <div className="text-2xl font-bold">{typeof value === 'number' ? money(value) : value}</div>
          </div>
        ))}
      </div>

      <div className="relative flex flex-wrap gap-3 mb-8">
        <Link to="/expenses" className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2.5 font-semibold text-white">
          <FilePlus2 size={18} /> Add Expense
        </Link>
        <Link to="/income" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 font-semibold text-white border border-white/15">
          <FilePlus2 size={18} /> Add Income
        </Link>
        <Link to="/reports" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 font-semibold text-white border border-white/15">
          View Reports <ArrowRight size={18} />
        </Link>
      </div>

      <div className="relative grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-3xl bg-white/10 border border-white/15 p-5">
          <h2 className="text-xl font-bold mb-4">Recent Expenses</h2>
          <div className="space-y-3">
            {recentExpenses.map((expense) => (
              <div key={expense._id} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3">
                <div>
                  <p className="font-semibold">{expense.title}</p>
                  <p className="text-sm text-gray-300">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <span className="font-semibold text-emerald-300">{money(expense.amount)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white/10 border border-white/15 p-5">
          <h2 className="text-xl font-bold mb-4">Recent Income</h2>
          <div className="space-y-3">
            {recentIncome.map((income) => (
              <div key={income._id} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3">
                <div>
                  <p className="font-semibold">{income.title}</p>
                  <p className="text-sm text-gray-300">
                    {income.referenceType === 'sale' ? 'Auto (Sale)' : 'Manual'} • {new Date(income.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-emerald-300">{money(income.amount)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white/10 border border-white/15 p-5">
          <h2 className="text-xl font-bold mb-4">Expense by Category</h2>
          <div className="space-y-3">
            {expenseByCategory.map((item) => (
              <div key={item._id} className="flex items-center justify-between text-sm">
                <span>{item._id}</span>
                <span className="text-emerald-300 font-semibold">{money(item.total)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white/10 border border-white/15 p-5">
          <h2 className="text-xl font-bold mb-4">Income by Type</h2>
          <div className="space-y-3">
            {incomeByType.map((item) => (
              <div key={item._id} className="flex items-center justify-between text-sm">
                <span>{item._id === 'sale' ? 'Sale-linked' : 'Manual'}</span>
                <span className="text-emerald-300 font-semibold">{money(item.total)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AccountantDashboard;
