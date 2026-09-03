import React, { useEffect, useState } from 'react';
import { ArrowRight, Package, X } from 'lucide-react';
import api from '../../services/api';

const InventoryEnlistModal = ({ isOpen, onClose, onSuccess, product }) => {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setError('');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const inventoryQuantity = product.inventoryQuantity || 0;
  const storeQuantity = product.storeQuantity || 0;

  const submit = async (event) => {
    event.preventDefault();
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount <= 0 || amount > inventoryQuantity) {
      setError(`Enter a whole number between 1 and ${inventoryQuantity}.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/inventory/enlist', { productId: product._id, quantity: amount });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to enlist inventory to store');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#064e3b] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#10b981]/20 p-3 text-[#6ee7b7]"><Package size={24} /></div>
            <div><h2 className="text-xl font-bold text-white">Enlist to Store</h2><p className="text-sm text-gray-400">{product.name}</p></div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4"><p className="text-xs text-amber-200">Inventory</p><p className="mt-1 text-2xl font-bold text-amber-100">{inventoryQuantity}</p><p className="text-xs text-amber-200/70">available to move</p></div>
          <div className="rounded-xl border border-green-400/20 bg-green-400/10 p-4"><p className="text-xs text-green-200">Store Products</p><p className="mt-1 text-2xl font-bold text-green-100">{storeQuantity}</p><p className="text-xs text-green-200/70">already on shelf</p></div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/15 p-3 text-sm text-red-100">{error}</div>}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Units to move to Store Products</label>
            <input type="number" min="1" max={inventoryQuantity} step="1" required value={quantity} onChange={event => setQuantity(event.target.value)} disabled={inventoryQuantity === 0} placeholder={inventoryQuantity === 0 ? 'No inventory available' : `Maximum ${inventoryQuantity}`} className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 disabled:cursor-not-allowed disabled:opacity-50" />
            <p className="mt-2 text-xs text-gray-400">Only products moved to Store Products become available for POS sales.</p>
          </div>
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 font-medium text-gray-300 hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={loading || inventoryQuantity === 0} className="inline-flex items-center gap-2 rounded-xl bg-[#10b981] px-5 py-2.5 font-semibold text-white hover:bg-[#059669] disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Moving...' : 'Enlist to Store'} <ArrowRight size={17} /></button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryEnlistModal;
