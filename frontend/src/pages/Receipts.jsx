import React, { useEffect, useMemo, useState } from 'react';
import { getSales } from '../services/saleService';
import ReceiptModal from '../components/pos/ReceiptModal';
import { CalendarDays, RefreshCw, Search, ShoppingBag, X } from 'lucide-react';

const Receipts = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getSales();
      setSales(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load sales.');
      console.error('Failed to fetch sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const filteredSales = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const now = new Date();

    return sales.filter((sale) => {
      const saleDate = new Date(sale.createdAt);
      const matchesDate = dateFilter === 'all'
        || (dateFilter === 'today' && saleDate.toDateString() === now.toDateString())
        || (dateFilter === 'month' && saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear());
      const customerName = sale.customerId?.name || sale.walkInCustomerName || 'Walk-in Customer';
      const matchesSearch = !normalizedSearch
        || sale.invoiceNumber?.toLowerCase().includes(normalizedSearch)
        || customerName.toLowerCase().includes(normalizedSearch);
      return matchesDate && matchesSearch;
    });
  }, [dateFilter, sales, searchTerm]);

  const totalAmount = filteredSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0);
  const totalItems = filteredSales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + (Number(item.quantity) || 0), 0),
    0
  );

  const formatAmount = (amount) => `Rs. ${(Number(amount) || 0).toLocaleString()}`;

  return (
    <div className="min-h-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-emerald-300">Cashier workspace</p>
            <h1 className="text-3xl font-bold mt-1">Sales</h1>
            <p className="text-gray-300 mt-1">View and open sales recorded through your account.</p>
          </div>
          <button onClick={fetchSales} disabled={loading} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            Refresh sales
          </button>
        </div>

        {error && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">
            <span>{error}</span>
            <button onClick={fetchSales} className="text-sm font-semibold hover:text-white">Try again</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5"><p className="text-sm text-gray-300">Displayed sales</p><p className="text-2xl font-bold mt-2">{filteredSales.length}</p></div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-5"><p className="text-sm text-gray-300">Displayed items</p><p className="text-2xl font-bold mt-2">{totalItems}</p></div>
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-5"><p className="text-sm text-emerald-100">Displayed sales value</p><p className="text-2xl font-bold mt-2 text-emerald-200">{formatAmount(totalAmount)}</p></div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search invoice or customer" className="w-full rounded-lg border border-white/10 bg-black/20 py-2.5 pl-10 pr-10 text-white placeholder:text-gray-500 outline-none focus:border-emerald-400" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label="Clear search"><X size={17} /></button>}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays size={17} className="text-emerald-300" />
              {['all', 'today', 'month'].map((filter) => (
                <button key={filter} onClick={() => setDateFilter(filter)} className={`rounded-md px-3 py-2 capitalize ${dateFilter === filter ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/15'}`}>{filter === 'all' ? 'All time' : filter}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-300">Loading sales...</div>
          ) : filteredSales.length === 0 ? (
            <div className="p-12 text-center"><ShoppingBag className="mx-auto text-gray-500" size={40} /><p className="mt-3 text-gray-200 font-medium">No sales found</p><p className="mt-1 text-sm text-gray-400">Completed sales matching the selected filters will appear here.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Date</th><th className="px-5 py-4 font-semibold">Invoice</th><th className="px-5 py-4 font-semibold">Customer</th><th className="px-5 py-4 font-semibold">Channel</th><th className="px-5 py-4 font-semibold">Items</th><th className="px-5 py-4 font-semibold text-right">Total</th><th className="px-5 py-4 font-semibold text-center">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map((sale) => {
                    const customerName = sale.customerId?.name || sale.walkInCustomerName || 'Walk-in Customer';
                    const itemCount = sale.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
                    return <tr
                      key={sale._id}
                      onClick={() => setSelectedSale(sale)}
                      className="border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(sale.createdAt).toLocaleString()}</td><td className="px-5 py-4 text-emerald-300 font-medium">{sale.invoiceNumber}</td><td className="px-5 py-4 text-gray-200">{customerName}</td><td className="px-5 py-4 text-sm text-gray-300 capitalize">{sale.channel?.replace('-', ' ') || 'POS'}</td><td className="px-5 py-4 text-gray-300">{itemCount}</td><td className="px-5 py-4 text-right font-bold">{formatAmount(sale.total)}</td><td className="px-5 py-4 text-center"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${sale.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>{(sale.paymentStatus || 'unknown').toUpperCase()}</span></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedSale && (
        <ReceiptModal 
          sale={selectedSale} 
          onClose={() => setSelectedSale(null)} 
        />
      )}
    </div>
  );
};

export default Receipts;
