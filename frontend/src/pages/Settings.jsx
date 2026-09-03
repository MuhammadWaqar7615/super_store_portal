import React, { useEffect, useState } from 'react';
import { AlertTriangle, Database, ExternalLink, Package, RefreshCw, Settings as SettingsIcon, Trash2, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import settingsService from '../services/settingsService';

const clearableModules = [
  ['inventory', 'Inventory Stock', 'Reset inventory and store quantities to zero, then remove movement history.'],
  ['products', 'Products', 'Delete all catalog products and their stock movement history.'],
  ['categories', 'Categories', 'Delete all product categories.'],
  ['suppliers', 'Suppliers', 'Delete all supplier records.'],
  ['purchases', 'Purchases', 'Delete purchase history, purchase movements, and reset supplier balances.'],
  ['sales', 'Sales', 'Delete sales, sale payments, sale income, and sale movements.'],
  ['finance', 'Finance', 'Delete all expenses, income, and supplier payment records.'],
  ['income', 'Manual Income', 'Delete manually entered income records. Sale-linked income is removed with Sales.'],
  ['expenses', 'Expenses', 'Delete all expense records.'],
  ['payments', 'Payments', 'Delete all payment records.'],
  ['supplierPayments', 'Supplier Payments', 'Delete all supplier payment records.'],
  ['stockMovements', 'Stock Movements', 'Delete all inventory movement history.'],
  ['customers', 'Customers', 'Delete customers and submitted carts.'],
  ['carts', 'Carts', 'Delete all pending and submitted carts.'],
  ['users', 'Staff Users', 'Delete all staff users except the currently logged-in admin.']
];

const Settings = () => {
  const [summary, setSummary] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyModule, setBusyModule] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, productsResponse] = await Promise.all([
        settingsService.getSummary(),
        api.get('/products')
      ]);
      setSummary(summaryResponse.data || {});
      setProducts(productsResponse.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const hasModuleData = (module) => {
    if (module === 'inventory') return (summary.inventoryStock || 0) > 0 || (summary.stockMovements || 0) > 0;
    if (module === 'finance') return ['expenses', 'income', 'supplierPayments'].some(key => (summary[key] || 0) > 0);
    if (module === 'customers') return (summary.customers || 0) > 0 || (summary.carts || 0) > 0;
    return (summary[module] || 0) > 0;
  };

  const moduleCount = (module) => {
    if (module === 'inventory') return (summary.inventoryStock || 0) + (summary.stockMovements || 0);
    if (module === 'finance') return ['expenses', 'income', 'supplierPayments'].reduce((total, key) => total + (summary[key] || 0), 0);
    if (module === 'customers') return (summary.customers || 0) + (summary.carts || 0);
    return summary[module] || 0;
  };

  const clearModule = async (module, label) => {
    if (!window.confirm(`Are you sure you want to clear ${label}? This action cannot be undone.`)) return;

    try {
      setBusyModule(module);
      setError('');
      const response = await settingsService.clearModule(module);
      const deletedTotal = Object.values(response.deleted || {}).reduce((total, count) => total + count, 0);
      setMessage(`${response.message} (${deletedTotal} record${deletedTotal === 1 ? '' : 's'} removed)`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to clear ${label}`);
    } finally {
      setBusyModule('');
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete product "${product.name}" from the catalog? This cannot be undone.`)) return;
    try {
      setError('');
      await api.delete(`/products/${product._id}`);
      setMessage(`${product.name} deleted successfully`);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete product');
    }
  };

  return (
    <div className="min-h-screen bg-[#064e3b] text-white p-6 lg:p-8 -m-4 lg:-m-8">
      <header className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30"><SettingsIcon size={28} /></div>
          <div><h1 className="text-3xl font-bold">Admin Settings</h1><p className="text-gray-300 mt-1">Manage catalog, staff access, and module data.</p></div>
        </div>
        <button onClick={loadData} disabled={loading} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50 flex items-center gap-2"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </header>

      <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-100 flex gap-3">
        <AlertTriangle className="shrink-0 text-amber-300" />
        <div><p className="font-semibold">Destructive controls</p><p className="text-sm text-amber-100/80 mt-1">Clearing a module permanently removes data. Each action asks for a simple Cancel or OK confirmation.</p></div>
      </div>

      {message && <p className="mb-4 rounded-xl bg-green-500/15 border border-green-400/30 p-3 text-green-200">{message}</p>}
      {error && <p className="mb-4 rounded-xl bg-red-500/15 border border-red-400/30 p-3 text-red-200">{error}</p>}

      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
        {Object.entries(summary).filter(([key]) => key !== 'inventoryStock').map(([key, value]) => <div key={key} className="rounded-2xl bg-white/10 border border-white/15 p-4"><p className="text-xs text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p><p className="text-2xl font-bold mt-1">{value}</p></div>)}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div className="rounded-2xl bg-white/10 border border-white/15 p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-semibold flex items-center gap-2"><UsersRound size={20} className="text-[#10b981]" /> Staff and Roles</h2><Link to="/users" className="text-sm text-[#6ee7b7] hover:underline flex items-center gap-1">Manage roles <ExternalLink size={14} /></Link></div>
          <p className="text-sm text-gray-300">Create, edit, activate, deactivate, or remove staff accounts. Backend role values remain protected and canonical.</p>
        </div>
        <div className="rounded-2xl bg-white/10 border border-white/15 p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-semibold flex items-center gap-2"><Package size={20} className="text-[#10b981]" /> Store Product Management</h2><Link to="/products" className="text-sm text-[#6ee7b7] hover:underline flex items-center gap-1">Open store products <ExternalLink size={14} /></Link></div>
          <p className="text-sm text-gray-300">Delete individual store or inventory products from the catalog. Stock is managed separately through Inventory.</p>
        </div>
      </section>

      <section className="rounded-2xl bg-white/10 border border-white/15 overflow-hidden mb-8">
        <div className="p-5 border-b border-white/10"><h2 className="text-xl font-semibold">Store Products</h2><p className="text-sm text-gray-400 mt-1">Individual store product deletion controls for Admin.</p></div>
        <div className="divide-y divide-white/10 max-h-80 overflow-y-auto">
          {products.map(product => <div key={product._id} className="p-4 flex items-center justify-between gap-4"><div><p className="font-medium">{product.name}</p><p className="text-xs text-gray-400">Inventory: {product.inventoryQuantity || 0} · Store: {product.storeQuantity || 0} {product.unit || ''}</p></div><button onClick={() => deleteProduct(product)} className="rounded-lg border border-red-400/40 px-3 py-2 text-red-300 hover:bg-red-500/15 flex items-center gap-1 text-sm"><Trash2 size={16} /> Delete</button></div>)}
          {!loading && products.length === 0 && <p className="p-6 text-center text-gray-400">No catalog products found.</p>}
        </div>
      </section>

      <section className="rounded-2xl bg-white/10 border border-red-500/20 overflow-hidden">
        <div className="p-5 border-b border-white/10"><h2 className="text-xl font-semibold flex items-center gap-2"><Database size={20} className="text-red-300" /> Clear Module Data</h2><p className="text-sm text-gray-400 mt-1">Use only when intentionally resetting a module or preparing a clean environment.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-5">
          {clearableModules.map(([module, label, description]) => {
            const hasData = hasModuleData(module);
            return <div key={module} className="rounded-xl bg-black/20 border border-white/10 p-4 flex items-center justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2"><p className="font-medium truncate">{label}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${hasData ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-gray-400'}`}>{hasData ? `${moduleCount(module)} record${moduleCount(module) === 1 ? '' : 's'}` : 'Clean'}</span></div><p className="text-xs text-gray-400 mt-1">{description}</p></div><button onClick={() => clearModule(module, label)} disabled={busyModule !== '' || !hasData} className={`shrink-0 rounded-lg px-3 py-2 text-xs flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${hasData ? 'bg-red-600 border border-red-500 text-white hover:bg-red-700' : 'border border-white/25 text-gray-400'}`}><Trash2 size={14} />{busyModule === module ? 'Clearing...' : hasData ? 'Clear' : 'Clean'}</button></div>;
          })}
        </div>
      </section>
    </div>
  );
};

export default Settings;
