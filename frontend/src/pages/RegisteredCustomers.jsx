import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, UserRound, UsersRound } from 'lucide-react';
import api from '../services/api';

const RegisteredCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/customers');
      setCustomers(Array.isArray(data.data) ? data.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load registered customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const registeredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return customers
      .filter((customer) => customer.isRegistered)
      .filter((customer) => !query
        || customer.name?.toLowerCase().includes(query)
        || customer.phone?.toLowerCase().includes(query)
        || customer.email?.toLowerCase().includes(query));
  }, [customers, searchTerm]);

  return (
    <div className="min-h-full text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wider text-emerald-300">Customer directory</p>
            <h1 className="text-3xl font-bold mt-1">Registered Customers</h1>
            <p className="text-gray-300 mt-1">Browse customers available for POS checkout.</p>
          </div>
          <button onClick={fetchCustomers} disabled={loading} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50">
            <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            Refresh customers
          </button>
        </div>

        {error && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">
            <span>{error}</span>
            <button onClick={fetchCustomers} className="text-sm font-semibold hover:text-white">Try again</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-gray-300">Registered customers</p>
            <p className="text-2xl font-bold mt-2">{registeredCustomers.length}</p>
          </div>
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-5">
            <p className="text-sm text-emerald-100">Directory status</p>
            <p className="text-2xl font-bold mt-2 text-emerald-200">{loading ? 'Loading' : 'Live data'}</p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search by name, phone, or email" className="w-full rounded-lg border border-white/10 bg-black/20 py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 outline-none focus:border-emerald-400" />
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-300">Loading registered customers...</div>
          ) : registeredCustomers.length === 0 ? (
            <div className="p-12 text-center"><UsersRound className="mx-auto text-gray-500" size={40} /><p className="mt-3 text-gray-200 font-medium">No registered customers found</p><p className="mt-1 text-sm text-gray-400">Customers registered in the system will appear here.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                  <tr><th className="px-5 py-4 font-semibold">Customer</th><th className="px-5 py-4 font-semibold">Phone</th><th className="px-5 py-4 font-semibold">Email</th><th className="px-5 py-4 font-semibold">Status</th></tr>
                </thead>
                <tbody>
                  {registeredCustomers.map((customer) => (
                    <tr key={customer._id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-emerald-400/15 text-emerald-300 flex items-center justify-center"><UserRound size={17} /></div><span className="font-medium text-gray-100">{customer.name}</span></div></td>
                      <td className="px-5 py-4 text-sm text-gray-300">{customer.phone || 'Not provided'}</td>
                      <td className="px-5 py-4 text-sm text-gray-300">{customer.email || 'Not provided'}</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">Registered</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisteredCustomers;
