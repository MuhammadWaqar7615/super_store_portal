import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ProductTable from '../components/products/ProductTable';
import ProductFormModal from '../components/products/ProductFormModal';
import { useAuth } from '../context/AuthContext';

const Products = () => {
  const { user } = useAuth();
  const canManageCatalog = user?.role === 'Admin' || user?.role === 'Store_Manager' || user?.role === 'Inventory_Manager';
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  useEffect(() => {
    fetchProducts();
    if (canManageCatalog) {
      fetchCategories();
      fetchSuppliers();
    }
  }, [canManageCatalog]);

  useEffect(() => {
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (categoryFilter) {
      filtered = filtered.filter(p => (p.category?._id || p.category) === categoryFilter);
    }
    if (supplierFilter) {
      filtered = filtered.filter(p => (p.supplier?._id || p.supplier) === supplierFilter);
    }
    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter, supplierFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/products');
      setProducts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        alert('Failed to delete product.');
      }
    }
  };

  const handleToggleActive = async (product) => {
    const nextIsActive = !product.isActive;

    // Update the visible row immediately instead of reloading the whole page/list.
    setProducts(currentProducts => currentProducts.map(currentProduct => (
      currentProduct._id === product._id
        ? { ...currentProduct, isActive: nextIsActive }
        : currentProduct
    )));

    try {
      // Create FormData since the endpoint expects it for updates (multer)
      const data = new FormData();
      data.append('isActive', nextIsActive);
      
      const response = await api.put(`/products/${product._id}`, data);
      const updatedProduct = response.data?.data;
      if (updatedProduct) {
        setProducts(currentProducts => currentProducts.map(currentProduct => (
          currentProduct._id === updatedProduct._id ? updatedProduct : currentProduct
        )));
      }
    } catch (error) {
      setProducts(currentProducts => currentProducts.map(currentProduct => (
        currentProduct._id === product._id
          ? { ...currentProduct, isActive: product.isActive }
          : currentProduct
      )));
      console.error('Failed to toggle status:', error);
    }
  };

  const handleEdit = (product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setProductToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-[100vh] bg-[#064e3b] p-8 -m-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Store Products</h1>
          <p className="text-gray-400 mt-2">{canManageCatalog ? 'Manage your store catalog, suppliers, and product details' : 'View live store product prices and availability'}</p>
        </div>
        {/* {canManageCatalog && <button onClick={openAddModal} className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all font-medium flex items-center shrink-0 cursor-pointer">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Product
        </button>} */}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <input 
          type="text" 
          placeholder="Search products..." 
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {canManageCatalog && <select
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none md:w-56"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="" className="text-black">All Categories</option>
          {categories.map(c => <option key={c._id} value={c._id} className="text-black">{c.name}</option>)}
        </select>}
        {canManageCatalog && <select
          className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none md:w-56"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
        >
          <option value="" className="text-black">All Suppliers</option>
          {suppliers.map(s => <option key={s._id} value={s._id} className="text-black">{s.name}</option>)}
        </select>}
      </div>

      {loading ? (
        <div className="h-96 rounded-2xl bg-white/5 border border-white/10 animate-pulse"></div>
      ) : (
        <ProductTable 
          products={filteredProducts} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          onToggleActive={handleToggleActive}
          readOnly={!canManageCatalog}
        />
      )}

      {canManageCatalog && <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchProducts();
          fetchSuppliers();
        }}
        productToEdit={productToEdit}
      />}
    </div>
  );
};

export default Products;
