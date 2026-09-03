import api from './api';

const storeService = {
  getProducts: async (params = {}) => (await api.get('/store/products', { params })).data
};

export default storeService;
