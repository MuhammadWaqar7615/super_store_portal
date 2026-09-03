import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import api from '../services/api';

const reports = [
  ['sales', 'Sales'], ['purchases', 'Purchases'], ['inventory', 'Inventory'], ['payments', 'Payments'], ['expenses', 'Expenses'], ['income', 'Income'], ['profit-loss', 'Profit & Loss']
];
const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const getRows = (type, data) => {
  if (type === 'inventory') return data?.byProduct || [];
  return data?.byDate || data?.byChannel || data?.byCategory || data?.byStatus || data?.bySource || data?.bySupplier || data?.byProduct || [];
};

const Reports = () => {
  const [type, setType] = useState('sales');
  const [range, setRange] = useState({ from: '', to: '' });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    api.get(`/reports/${type}`, { params: range })
      .then(response => setData(response.data.data))
      .catch(err => setError(err.response?.data?.message || 'Unable to load report'));
  }, [type, range.from, range.to]);

  const rows = getRows(type, data);
  const inventorySummary = data?.summary;
  const isProfitLoss = type === 'profit-loss';

  return (
    <div className="min-h-screen bg-[#064e3b] text-white p-6 lg:p-8 -m-4 lg:-m-8">
      <header className="flex items-center gap-3 mb-8"><BarChart3 className="text-[#10b981]" size={30} /><div><h1 className="text-3xl font-bold">Reports</h1><p className="text-gray-300 text-sm">Live aggregated reports from MongoDB.</p></div></header>
      <div className="flex flex-wrap gap-2 mb-5">
        {reports.map(([value, label]) => <button key={value} onClick={() => setType(value)} className={`rounded-lg px-3 py-2 text-sm ${type === value ? 'bg-[#10b981] text-white' : 'bg-white/10 text-gray-300'}`}>{label}</button>)}
        <input type="date" value={range.from} onChange={e => setRange({ ...range, from: e.target.value })} className="input ml-auto" />
        <input type="date" value={range.to} onChange={e => setRange({ ...range, to: e.target.value })} className="input" />
      </div>
      {error && <p className="text-red-200 mb-4">{error}</p>}
      {inventorySummary && type === 'inventory' && <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">{[['Products', inventorySummary.products], ['Units in stock', inventorySummary.units], ['Inventory value', formatCurrency(inventorySummary.value)]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white/10 border border-white/15 p-5"><p className="text-gray-300">{label}</p><p className="text-2xl font-bold mt-1">{value}</p></div>)}</div>}
      {isProfitLoss && data && <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">{[['Revenue', data.revenue], ['COGS', data.cogs], ['Expenses', data.expenses], ['Net Profit', data.netProfit]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white/10 border border-white/15 p-5"><p className="text-gray-300">{label}</p><p className="text-2xl font-bold mt-1">{formatCurrency(value)}</p></div>)}</div>}
      {!isProfitLoss && type !== 'inventory' && data?.summary && <div className="mb-5 rounded-2xl bg-white/10 border border-white/15 p-5"><p className="text-gray-300">Total</p><p className="text-3xl font-bold">{formatCurrency(data.summary.total ?? 0)}</p></div>}
      {!isProfitLoss && <div className="bg-white/10 border border-white/15 rounded-2xl overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-white/5 text-left text-gray-300"><tr><th className="p-4">{type === 'inventory' ? 'Product' : 'Group'}</th>{type === 'inventory' ? <><th className="p-4">Inventory</th><th className="p-4">Store</th></> : <th className="p-4">Count / Quantity</th>}<th className="p-4">Amount</th></tr></thead><tbody className="divide-y divide-white/10">{rows.map((row, index) => <tr key={index}><td className="p-4">{row._id || row.product || row.supplier || 'Unknown'}</td>{type === 'inventory' ? <><td className="p-4">{row.inventoryQuantity ?? 0}</td><td className="p-4">{row.storeQuantity ?? 0}</td></> : <td className="p-4">{row.count ?? row.quantity ?? '-'}</td>}<td className="p-4">{formatCurrency(row.total)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={type === 'inventory' ? 4 : 3} className="p-8 text-center text-gray-400">No grouped data for this report.</td></tr>}</tbody></table></div>}
    </div>
  );
};
export default Reports;
