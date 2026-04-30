import api from './axiosInstance'

export const carbonApi = {
  addEntry: (data) => api.post('/api/carbon/add', data),

  getMyEntries: () => api.get('/api/carbon/my'),

  getTotal: () => api.get('/api/carbon/total'),

  getScore: () => api.get('/api/carbon/score'),

  getBreakdown: () => api.get('/api/carbon/breakdown'),

  simulateImpact: (data) => api.post('/api/carbon/simulate', data),

  getTemplates: () => api.get('/api/carbon/templates'),

  createTemplate: (data) => api.post('/api/carbon/templates', data),

  useTemplate: (id) => api.post(`/api/carbon/templates/${id}/use`),

  deleteTemplate: (id) => api.delete(`/api/carbon/templates/${id}`),

  downloadMonthlyReport: (year, month) =>
    api.get(`/api/carbon/download-monthly?year=${year}&month=${month}`, {
      responseType: 'blob',
    }),

  downloadMonthlyPdfReport: (year, month) =>
    api.get(`/api/carbon/download-monthly-pdf?year=${year}&month=${month}`, {
      responseType: 'blob',
    }),

  downloadAdminMonthlyReport: (year, month) =>
    api.get(`/api/carbon/admin/download-monthly?year=${year}&month=${month}`, {
      responseType: 'blob',
    }),
}
