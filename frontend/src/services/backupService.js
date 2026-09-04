import api from './api';

const backupService = {
  exportData: async () => (await api.get('/backup/export')).data,
  importData: async (data) => (await api.post('/backup/import', { data })).data,
};

export default backupService;
