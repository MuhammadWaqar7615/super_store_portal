import api from './api';

const settingsService = {
  getSummary: async () => (await api.get('/settings/summary')).data,
  clearModule: async (module) => (await api.post(`/settings/clear/${module}`, { confirmed: true })).data,
  clearAll: async () => (await api.post('/settings/clear-all', { confirmed: true })).data,
  seedDummyData: async () => (await api.post('/settings/seed-dummy')).data
};

export default settingsService;
