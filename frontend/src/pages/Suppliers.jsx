import React, { useState, useEffect } from 'react';
import supplierService from '../services/supplierService';
import { 
  Truck, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  X,
  Boxes,
  ExternalLink,
  AlertCircle
  ,CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Suppliers = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    isActive: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Traceability Modal states
  const [isTraceModalOpen, setIsTraceModalOpen] = useState(false);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'Bank transfer', reference: '' });
  const [paymentError, setPaymentError] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [statusFilter]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await supplierService.getSuppliers({
        search: searchTerm,
        isActive: statusFilter
      });
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSuppliers();
  };

  const openCreateModal = () => {
    setSupplierToEdit(null);
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
      isActive: true
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (supplier) => {
    setSupplierToEdit(supplier);
    setFormData({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
      isActive: supplier.isActive !== false
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      if (supplierToEdit) {
        await supplierService.updateSupplier(supplierToEdit._id, formData);
      } else {
        await supplierService.createSupplier(formData);
      }
      setIsFormModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save supplier');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (supplier.productCount > 0) {
      alert(`Cannot delete "${supplier.name}" because ${supplier.productCount} products are currently attached to it for traceability. Please reassign or remove these products first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
      try {
        await supplierService.deleteSupplier(supplier._id);
        fetchSuppliers();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete supplier');
      }
    }
  };

  const handleToggleStatus = async (supplier) => {
    try {
      await supplierService.updateSupplier(supplier._id, {
        isActive: !supplier.isActive
      });
      fetchSuppliers();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleOpenTraceability = async (supplier) => {
    setSelectedSupplier(supplier);
    setIsTraceModalOpen(true);
    setTraceLoading(true);
    try {
      const res = await supplierService.getSupplierProducts(supplier._id);
      setTraceData(res.data);
      const paymentRes = await supplierService.getSupplierPayments(supplier._id);
      setPayments(paymentRes.data || []);
    } catch (err) {
      console.error('Failed to fetch supplier products:', err);
    } finally {
      setTraceLoading(false);
    }
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    setPaymentSaving(true);
    setPaymentError('');
    try {
      await supplierService.createSupplierPayment(selectedSupplier._id, paymentForm);
      const response = await supplierService.getSupplierPayments(selectedSupplier._id);
      setPayments(response.data || []);
      const supplierResponse = await supplierService.getSupplier(selectedSupplier._id);
      setSelectedSupplier(supplierResponse.data);
      setPaymentForm({ amount: '', date: new Date().toISOString().slice(0, 10), method: 'Bank transfer', reference: '' });
      fetchSuppliers();
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSaving(false);
    }
  };

  // Aggregated KPI Stats
  const totalSuppliersCount = suppliers.length;
  const activeSuppliersCount = suppliers.filter(s => s.isActive).length;
  const totalProductsSupplied = suppliers.reduce((sum, s) => sum + (s.productCount || 0), 0);
  const totalInventoryCost = suppliers.reduce((sum, s) => sum + (s.totalInventoryCost || 0), 0);

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(term) ||
      s.contactPerson?.toLowerCase().includes(term) ||
      s.phone?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-[100vh] bg-[#064e3b] p-6 lg:p-8 -m-4 lg:-m-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30">
              <Truck size={28} />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">Suppliers & Sourcing</h1>
              <p className="text-gray-300 text-sm mt-1">Manage suppliers, track shipments, and trace inventory back to vendors</p>
            </div>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#10b981] hover:bg-[#059669] text-white px-5 py-3 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all font-medium flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus size={20} />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm font-medium">Total Suppliers</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
              <Truck size={20} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white mt-2">{totalSuppliersCount}</p>
          <span className="text-xs text-gray-400 mt-1 block">Registered in ERP</span>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm font-medium">Active Suppliers</span>
            <div className="p-2 rounded-xl bg-green-500/20 text-green-300">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white mt-2">{activeSuppliersCount}</p>
          <span className="text-xs text-green-300/80 mt-1 block">Ready for procurement</span>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm font-medium">Attached Products</span>
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <Package size={20} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white mt-2">{totalProductsSupplied}</p>
          <span className="text-xs text-purple-300/80 mt-1 block">With source traceability</span>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm font-medium">Sourced Stock Value</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-white mt-2">
            Rs. {totalInventoryCost.toLocaleString()}
          </p>
          <span className="text-xs text-amber-300/80 mt-1 block">Current inventory at cost</span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search suppliers by name, contact person, phone, email..."
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        <select
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#10b981] md:w-56"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="" className="text-black">All Statuses</option>
          <option value="true" className="text-black">Active Only</option>
          <option value="false" className="text-black">Inactive Only</option>
        </select>
      </div>

      {/* Suppliers Table */}
      {loading ? (
        <div className="h-96 rounded-2xl bg-white/5 border border-white/10 animate-pulse flex items-center justify-center text-gray-400">
          Loading suppliers data...
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-md shadow-xl overflow-x-auto sm:rounded-2xl border border-white/20">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Contact Details</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Address / Notes</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Traceability</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier._id} className="hover:bg-white/5 transition-colors">
                  {/* Supplier Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 border border-[#10b981]/30 flex items-center justify-center text-[#10b981] font-bold text-base mr-3 shrink-0">
                        {supplier.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{supplier.name}</div>
                        {supplier.contactPerson && (
                          <div className="text-xs text-gray-400">Attn: {supplier.contactPerson}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact Info */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="space-y-1">
                      {supplier.phone ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <Phone size={13} className="text-[#10b981]" />
                          <span>{supplier.phone}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">No phone</div>
                      )}
                      {supplier.email ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <Mail size={13} className="text-blue-400" />
                          <span>{supplier.email}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">No email</div>
                      )}
                    </div>
                  </td>

                  {/* Address / Notes */}
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs">
                    {supplier.address && (
                      <div className="flex items-start gap-1.5 text-xs text-gray-300 truncate">
                        <MapPin size={13} className="text-amber-400 shrink-0 mt-0.5" />
                        <span className="truncate">{supplier.address}</span>
                      </div>
                    )}
                    {supplier.notes && (
                      <div className="text-xs text-gray-400 italic mt-0.5 truncate">
                        Note: {supplier.notes}
                      </div>
                    )}
                    {!supplier.address && !supplier.notes && (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </td>

                  {/* Traceability Action */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleOpenTraceability(supplier)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-all shadow-sm cursor-pointer"
                    >
                      <Boxes size={14} />
                      <span>{supplier.productCount || 0} Products</span>
                      <ExternalLink size={12} className="opacity-70" />
                    </button>
                  </td>

                  {/* Status Toggle */}
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleToggleStatus(supplier)}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none cursor-pointer ${
                        supplier.isActive ? 'bg-[#10b981]' : 'bg-gray-600'
                      }`}
                      title={supplier.isActive ? 'Active - click to deactivate' : 'Inactive - click to activate'}
                    >
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                          supplier.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(supplier)}
                      className="text-blue-400 hover:text-blue-300 mr-4 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(supplier)}
                      className="text-red-400 hover:text-red-300 transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Truck size={36} className="text-gray-500 mb-2 opacity-60" />
                      <p className="text-base font-medium text-white">No suppliers found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {searchTerm ? 'Try adjusting your search filters' : 'Get started by clicking "Add Supplier" above'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#064e3b] border border-white/20 rounded-3xl p-6 lg:p-8 w-full max-w-xl shadow-2xl relative my-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#10b981]/20 text-[#10b981]">
                  <Truck size={22} />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {supplierToEdit ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Supplier / Company Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nestlé Wholesale Pakistan"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Ali Raza"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +92 300 1234567"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. supply@nestle.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Physical Address / Warehouse</label>
                <input
                  type="text"
                  placeholder="e.g. Plot 42, Industrial Area, Lahore"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Notes / Supply Terms</label>
                <textarea
                  rows="2"
                  placeholder="Payment terms, lead time, contracts, delivery schedules..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#10b981]"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  className="w-4 h-4 accent-[#10b981] rounded cursor-pointer"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                <label htmlFor="isActiveToggle" className="text-sm font-medium text-gray-200 cursor-pointer">
                  Supplier is active and available for product sourcing
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-gray-300 hover:bg-white/5 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-medium shadow-[0_0_15px_rgba(16,185,129,0.4)] disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Saving...' : supplierToEdit ? 'Update Supplier' : 'Create Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRACEABILITY MODAL */}
      {isTraceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#064e3b] border border-white/25 rounded-3xl p-6 lg:p-8 w-full max-w-4xl shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/15 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <Boxes size={26} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedSupplier?.name}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Product Traceability
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Viewing all products attached to this supplier & inventory valuation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTraceModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* Traceability Content */}
            {traceLoading ? (
              <div className="py-20 text-center text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#10b981] mb-3"></div>
                <p>Loading traceability details...</p>
              </div>
            ) : traceData ? (
              <div className="flex-1 overflow-y-auto pt-4 space-y-6">
                {/* Metrics for this supplier */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-gray-400 text-xs">Total Products</span>
                    <p className="text-xl font-bold text-white mt-1">{traceData.stats?.totalProducts || 0}</p>
                  </div>
                  <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-gray-400 text-xs">Total Units In Stock</span>
                    <p className="text-xl font-bold text-white mt-1">{traceData.stats?.totalStock || 0}</p>
                  </div>
                  <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-gray-400 text-xs">Inventory Cost</span>
                    <p className="text-xl font-bold text-[#10b981] mt-1">
                      Rs. {(traceData.stats?.inventoryCostValue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/10 p-3.5 rounded-2xl border border-white/10">
                    <span className="text-gray-400 text-xs">Est. Retail Value</span>
                    <p className="text-xl font-bold text-blue-300 mt-1">
                      Rs. {(traceData.stats?.inventoryRetailValue || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/15 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2"><CreditCard size={16} className="text-[#10b981]" /> Supplier balance</h3>
                    <span className="text-lg font-bold text-amber-300">Rs. {(selectedSupplier?.currentBalance || 0).toLocaleString()}</span>
                  </div>
                  {paymentError && <p className="text-sm text-red-200 mb-2">{paymentError}</p>}
                  <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    <input required min="0.01" step="0.01" type="number" placeholder="Amount" value={paymentForm.amount} onChange={event => setPaymentForm({ ...paymentForm, amount: event.target.value })} className="rounded-lg bg-black/20 border border-white/20 px-3 py-2 text-white" />
                    <input required type="date" value={paymentForm.date} onChange={event => setPaymentForm({ ...paymentForm, date: event.target.value })} className="rounded-lg bg-black/20 border border-white/20 px-3 py-2 text-white" />
                    <input required placeholder="Method" value={paymentForm.method} onChange={event => setPaymentForm({ ...paymentForm, method: event.target.value })} className="rounded-lg bg-black/20 border border-white/20 px-3 py-2 text-white" />
                    <input placeholder="Reference" value={paymentForm.reference} onChange={event => setPaymentForm({ ...paymentForm, reference: event.target.value })} className="rounded-lg bg-black/20 border border-white/20 px-3 py-2 text-white" />
                    <button disabled={paymentSaving} className="rounded-lg bg-[#10b981] px-3 py-2 font-semibold disabled:opacity-50">{paymentSaving ? 'Saving...' : 'Record Payment'}</button>
                  </form>
                  <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
                    {payments.map(payment => <div key={payment._id} className="flex justify-between text-xs text-gray-300"><span>{new Date(payment.date).toLocaleDateString()} · {payment.method}</span><span>Rs. {payment.amount.toLocaleString()}</span></div>)}
                    {payments.length === 0 && <p className="text-xs text-gray-500">No supplier payments recorded.</p>}
                  </div>
                </div>

                {/* Products List Table */}
                <div className="bg-white/5 rounded-2xl border border-white/15 overflow-hidden">
                  <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                      <Package size={16} className="text-[#10b981]" />
                      <span>Traceable Products ({traceData.products?.length || 0})</span>
                    </h3>
                    <button
                      onClick={() => {
                        setIsTraceModalOpen(false);
                        navigate('/products');
                      }}
                      className="text-xs text-[#10b981] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage in Products Module</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-white/5 text-xs text-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Product Name</th>
                          <th className="px-4 py-3 text-left font-medium">Category</th>
                          <th className="px-4 py-3 text-right font-medium">Cost Price</th>
                          <th className="px-4 py-3 text-right font-medium">Selling Price</th>
                          <th className="px-4 py-3 text-center font-medium">Stock</th>
                          <th className="px-4 py-3 text-right font-medium">Total Cost</th>
                          <th className="px-4 py-3 text-center font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-sm">
                        {traceData.products?.map((product) => {
                          const stock = product.stockQuantity || 0;
                          const purchase = product.purchasePrice || 0;
                          const totalLineCost = stock * purchase;

                          return (
                            <tr key={product._id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-8 h-8 rounded-lg object-cover bg-white/10 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gray-400 shrink-0">
                                      <Package size={16} />
                                    </div>
                                  )}
                                  <span className="font-medium text-white">{product.name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-300 text-xs">
                                {product.category?.name || 'Unassigned'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-gray-300 font-mono text-xs">
                                Rs. {purchase}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-gray-300 font-mono text-xs">
                                Rs. {product.sellingPrice}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  stock <= (product.minimumStock || 0)
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-green-500/20 text-green-300 border border-green-500/30'
                                }`}>
                                  {stock} {product.unit || 'pcs'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right text-[#10b981] font-mono text-xs font-medium">
                                Rs. {totalLineCost.toLocaleString()}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                {product.isActive ? (
                                  <span className="text-xs text-green-400 font-medium">Active</span>
                                ) : (
                                  <span className="text-xs text-gray-400 font-medium">Inactive</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}

                        {(!traceData.products || traceData.products.length === 0) && (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-400 text-sm">
                              No products have been attached to this supplier yet.
                              <div className="mt-2">
                                <button
                                  onClick={() => {
                                    setIsTraceModalOpen(false);
                                    navigate('/products');
                                  }}
                                  className="text-[#10b981] underline text-xs cursor-pointer"
                                >
                                  Go to Products module to add or assign products to this supplier
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-red-400">Failed to load supplier traceability.</div>
            )}

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-white/15 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsTraceModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors cursor-pointer"
              >
                Close Traceability
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
