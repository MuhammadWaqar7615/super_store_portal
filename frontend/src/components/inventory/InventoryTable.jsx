import React from 'react';

const InventoryTable = ({ products, onAdjustStock, onEnlist }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md shadow-xl overflow-x-auto sm:rounded-2xl border border-white/20">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/5">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Product</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Stock Locations</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {products.map((product) => {
            const inventoryQuantity = product.inventoryQuantity || 0;
            const storeQuantity = product.storeQuantity || 0;
            const inventoryLow = inventoryQuantity <= product.minimumStock;
            const storeLow = storeQuantity <= product.minimumStock;

            return (
              <tr key={product._id} onClick={() => onEnlist(product)} className="cursor-pointer hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div className="flex flex-col gap-1">
                    <span className="text-amber-300">Inventory: {inventoryQuantity} {product.unit}</span>
                    <span className="text-green-300">Store: {storeQuantity} {product.unit}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1 text-xs">
                    <span className={inventoryLow ? 'text-amber-300' : 'text-green-300'}>Inventory: {inventoryLow ? 'Low' : 'Healthy'}</span>
                    <span className={storeLow ? 'text-amber-300' : 'text-green-300'}>Store: {storeLow ? 'Low' : 'Healthy'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={(event) => { event.stopPropagation(); onEnlist(product); }} disabled={inventoryQuantity <= 0} className="text-[#10b981] hover:text-pink-400 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold transition-colors">Enlist to Store</button>
                    <button onClick={(event) => { event.stopPropagation(); onAdjustStock(product); }} className="text-blue-300 hover:text-blue-200 font-semibold transition-colors">Adjust Stock</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {products.length === 0 && (
            <tr>
              <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-400">No inventory stock found. Receive a supplier purchase to add stock.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
