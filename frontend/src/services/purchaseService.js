import api from './api';

const purchaseService = {
  getPurchases: async () => (await api.get('/purchases')).data,
  getPurchase: async (id) => (await api.get(`/purchases/${id}`)).data,
  createPurchase: async (payload) => (await api.post('/purchases', payload)).data
};

export default purchaseService;
