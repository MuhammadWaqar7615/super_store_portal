import React, { useEffect, useState } from 'react';
import { PackagePlus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import purchaseService from '../services/purchaseService';
import supplierService from '../services/supplierService';
import ProductFormModal from '../components/products/ProductFormModal';

const emptyLine = { productId: '', quantity: 1, purchasePrice: '' };

const Purchases = () => {
  const { user } = useAuth();
  const canManagePurchases = user?.role === 'Admin' || user?.role === 'Store_Manager' || user?.role === 'Inventory_Manager';
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([{ ...emptyLine }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productLineIndex, setProductLineIndex] = useState(0);

  const loadData = async () => {
    try {
      const [supplierResponse, productResponse, purchaseResponse] = await Promise.all([
        canManagePurchases ? supplierService.getSuppliers({ isActive: 'true' }) : Promise.resolve({ data: [] }),
        canManagePurchases ? api.get('/products') : Promise.resolve({ data: { data: [] } }),
        purchaseService.getPurchases()
      ]);
      setSuppliers(supplierResponse.data || []);
      setProducts(productResponse.data.data || []);
      setPurchases(purchaseResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [canManagePurchases]);

  const updateLine = (index, field, value) => {
    setItems(current => current.map((item, lineIndex) => (
      lineIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.purchasePrice) || 0), 0);

  const submitPurchase = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await purchaseService.createPurchase({ supplierId, items });
      setSupplierId('');
      setItems([{ ...emptyLine }]);
      await loadData();
      setMessage('Purchase saved and stock added to inventory.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save purchase');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#064e3b] text-white p-6 lg:p-8 -m-4 lg:-m-8">
      <div className="flex items-center gap-3 mb-8">
        <PackagePlus className="text-[#10b981]" size={30} />
        <div>
          <h1 className="text-3xl font-bold">Purchases</h1>
          <p className="text-gray-300 text-sm">Receive stock and keep supplier balances current.</p>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/15 p-3 text-red-100">{error}</div>}
      {message && <div className="mb-4 rounded-xl border border-green-400/40 bg-green-500/15 p-3 text-green-100">{message}</div>}

      {canManagePurchases && <form onSubmit={submitPurchase} className="bg-white/10 border border-white/15 rounded-2xl p-5 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-5">
          <label className="flex-1 text-sm text-gray-300">Supplier
            <select required value={supplierId} onChange={event => setSupplierId(event.target.value)} className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 px-3 py-2.5 text-white">
              <option value="" className="text-black">Select supplier</option>
              {suppliers.map(supplier => <option key={supplier._id} value={supplier._id} className="text-black">{supplier.name}</option>)}
            </select>
          </label>
          <div className="flex items-end text-lg font-semibold">Total: Rs. {total.toLocaleString()}</div>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_140px_160px_44px] gap-3 items-end">
              <label className="text-sm text-gray-300">
                <span className="flex items-center justify-between gap-3">
                  <span>Product</span>
                  <button type="button" onClick={() => { setProductLineIndex(index); setIsProductModalOpen(true); }} className="inline-flex items-center gap-1 text-xs text-[#6ee7b7] hover:text-white">
                    <Plus size={14} /> New product
                  </button>
                </span>
                <select required value={item.productId} onChange={event => updateLine(index, 'productId', event.target.value)} className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 px-3 py-2.5 text-white">
                  <option value="" className="text-black">Select product</option>
                  {products.map(product => <option key={product._id} value={product._id} className="text-black">{product.name}</option>)}
                </select>
              </label>
              <label className="text-sm text-gray-300">Quantity
                <input required min="1" type="number" value={item.quantity} onChange={event => updateLine(index, 'quantity', event.target.value)} className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 px-3 py-2.5 text-white" />
              </label>
              <label className="text-sm text-gray-300">Purchase price
                <input required min="0" step="0.01" type="number" value={item.purchasePrice} onChange={event => updateLine(index, 'purchasePrice', event.target.value)} className="mt-1 w-full rounded-xl bg-black/20 border border-white/20 px-3 py-2.5 text-white" />
              </label>
              <button type="button" title="Remove line" onClick={() => setItems(current => current.filter((_, lineIndex) => lineIndex !== index))} disabled={items.length === 1} className="h-11 rounded-xl text-red-300 hover:bg-red-500/15 disabled:opacity-30"><Trash2 size={18} className="mx-auto" /></button>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-5">
          <button type="button" onClick={() => setItems(current => [...current, { ...emptyLine }])} className="inline-flex items-center gap-2 text-[#6ee7b7] text-sm"><Plus size={16} /> Add line</button>
          <button disabled={saving || !supplierId} className="rounded-xl bg-[#10b981] px-5 py-2.5 font-semibold disabled:opacity-50">{saving ? 'Saving...' : 'Save Purchase'}</button>
        </div>
      </form>}

      {canManagePurchases && <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={async (createdProduct) => {
          await loadData();
          const createdSupplierId = createdProduct?.supplier?._id || createdProduct?.supplier;
          if (!supplierId && createdSupplierId) setSupplierId(createdSupplierId);
          if (createdProduct?._id) {
            setItems(current => current.map((item, index) => index === productLineIndex
              ? { ...item, productId: createdProduct._id, purchasePrice: createdProduct.purchasePrice || item.purchasePrice }
              : item
            ));
          }
          setMessage('Product created. Enter the quantity and save this purchase to add stock to Inventory.');
        }}
        initialSupplier={supplierId}
        productToEdit={null}
      />}

      <div className="bg-white/10 border border-white/15 rounded-2xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-left text-gray-300"><tr><th className="p-4">Supplier</th><th className="p-4">Lines</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4">Date</th></tr></thead>
          <tbody className="divide-y divide-white/10">
            {!loading && purchases.map(purchase => <tr key={purchase._id}><td className="p-4">{purchase.supplierId?.name || 'Unknown'}</td><td className="p-4">{purchase.items?.length || 0}</td><td className="p-4">Rs. {(purchase.totalAmount || 0).toLocaleString()}</td><td className="p-4">{purchase.status}</td><td className="p-4 text-gray-300">{new Date(purchase.createdAt).toLocaleDateString()}</td></tr>)}
            {!loading && purchases.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">No purchases recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Purchases;
