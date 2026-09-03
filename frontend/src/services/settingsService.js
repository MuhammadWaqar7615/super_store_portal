import api from './api';

const settingsService = {
  getSummary: async () => (await api.get('/settings/summary')).data,
  clearModule: async (module) => (await api.post(`/settings/clear/${module}`, { confirmed: true })).data
};

export default settingsService;
