import React from 'react';
import { Truck } from 'lucide-react';

const ProductTable = ({ products, onEdit, onDelete, onToggleActive, readOnly = false }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md shadow-xl overflow-x-auto sm:rounded-2xl border border-white/20">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/5">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Product</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Category</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Supplier</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Price (Rs.)</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Stock</th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
            {!readOnly && <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {products.map((product) => (
            <tr key={product._id} className="hover:bg-white/5 transition-colors">
              {/* Product Info */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-white/10 rounded-lg overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <img className="h-10 w-10 object-cover" src={product.image} alt={product.name} />
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-white">{product.name}</div>
                  </div>
                </div>
              </td>

              {/* Category */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {product.category?.name || 'N/A'}
              </td>

              {/* Supplier / Traceability */}
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {product.supplier ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/25 text-xs font-medium">
                    <Truck size={12} />
                    <span>{product.supplier.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500 italic">Unassigned</span>
                )}
              </td>

              {/* Price */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-mono">
                {product.sellingPrice}
              </td>

              {/* Stock */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  product.stockQuantity > (product.minimumStock || 0) 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                }`}>
                  {product.stockQuantity} {product.unit}
                </span>
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {readOnly ? (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${product.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                ) : (
                  <button
                    onClick={() => onToggleActive(product)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none cursor-pointer ${product.isActive ? 'bg-[#10b981]' : 'bg-gray-600'}`}
                    aria-label={`Set ${product.name} ${product.isActive ? 'inactive' : 'active'}`}
                  >
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${product.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                )}
              </td>

              {/* Actions */}
              {!readOnly && <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onClick={() => onEdit(product)} className="text-blue-400 hover:text-blue-300 mr-4 transition-colors cursor-pointer">Edit</button>
                <button onClick={() => onDelete(product._id)} className="text-red-400 hover:text-red-300 transition-colors cursor-pointer">Delete</button>
              </td>}
            </tr>
          ))}

          {products.length === 0 && (
            <tr>
              <td colSpan={readOnly ? 6 : 7} className="px-6 py-8 text-center text-sm text-gray-400">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
