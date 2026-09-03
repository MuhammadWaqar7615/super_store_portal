import React, { useState, useEffect } from 'react';
import api from '../services/api';
import InventoryTable from '../components/inventory/InventoryTable';
import StockAdjustmentModal from '../components/inventory/StockAdjustmentModal';
import StockMovementList from '../components/inventory/StockMovementList';
import InventoryEnlistModal from '../components/inventory/InventoryEnlistModal';
import { useAuth } from '../context/AuthContext';

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isEnlistModalOpen, setIsEnlistModalOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState(null);
  
  // To trigger re-render of Movement List
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchInventory();
  }, [refreshKey]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/inventory');
      setProducts(data.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = (product) => {
    setProductToAdjust(product);
    setIsAdjustmentModalOpen(true);
  };

  const handleAdjustmentSuccess = () => {
    setRefreshKey(prev => prev + 1); // Refresh both inventory and movements
  };

  const handleEnlist = (product) => {
    setProductToAdjust(product);
    setIsEnlistModalOpen(true);
  };

  return (
    <div className="min-h-[100vh] bg-[#064e3b] p-8 -m-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">
          {user?.role === 'Inventory_Manager' ? 'Inventory Dashboard' : 'Inventory Management'}
        </h1>
        <p className="text-gray-400 mt-2">
          {user?.role === 'Inventory_Manager'
            ? 'Monitor stock levels, supplier flow, and purchase activity'
            : 'Monitor stocked products and track movements'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-96 rounded-2xl bg-white/5 border border-white/10 animate-pulse"></div>
          ) : (
            <InventoryTable 
              products={products} 
              onAdjustStock={handleAdjustStock}
              onEnlist={handleEnlist}
            />
          )}
        </div>
        
        <div className="lg:col-span-1">
          <StockMovementList key={refreshKey} />
        </div>
      </div>

      <StockAdjustmentModal 
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={handleAdjustmentSuccess}
        product={productToAdjust}
      />
      <InventoryEnlistModal
        isOpen={isEnlistModalOpen}
        onClose={() => setIsEnlistModalOpen(false)}
        onSuccess={handleAdjustmentSuccess}
        product={productToAdjust}
      />
    </div>
  );
};

export default Inventory;
