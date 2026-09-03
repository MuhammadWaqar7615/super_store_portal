import api from './api';

export const supplierService = {
  getSuppliers: async (params = {}) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },
  getSupplier: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },
  createSupplier: async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },
  updateSupplier: async (id, data) => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },
  deleteSupplier: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },
  getSupplierProducts: async (id) => {
    const response = await api.get(`/suppliers/${id}/products`);
    return response.data;
  },
  getSupplierPayments: async (id) => {
    const response = await api.get(`/suppliers/${id}/payments`);
    return response.data;
  },
  createSupplierPayment: async (id, data) => {
    const response = await api.post(`/suppliers/${id}/payments`, data);
    return response.data;
  }
};

export default supplierService;
