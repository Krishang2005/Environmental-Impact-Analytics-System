import api from './axiosInstance'

export const adminApi = {
  getDashboard: () => api.get('/api/admin/dashboard'),

  getZoneIntelligence: () => api.get('/api/admin/zone-intelligence'),

  getLiveMonitor: () => api.get('/api/admin/live-monitor'),

  getComplaintAnalytics: () => api.get('/api/admin/complaints/analytics'),

  getHighEmitters: () => api.get('/api/admin/high-emitters'),

  broadcastToAllUsers: (data) => api.post('/api/admin/notifications/broadcast', data),

  sendInbuiltHighEmitterMessage: () => api.post('/api/admin/notifications/high-emitters/inbuilt'),

  sendInbuiltHighEmitterMessageToSelected: (userIds) =>
    api.post('/api/admin/notifications/high-emitters/selected', { userIds }),

  getNotificationHistory: () => api.get('/api/admin/notifications/history'),

  getZoneSectorSummary: () => api.get('/api/admin/zone-sector-summary'),

  getUsersByZone: (zoneId) => api.get(`/api/admin/zones/${zoneId}/users`),

  getUserLocation: (id) => api.get(`/api/admin/user/${id}`),

  getEmissionLocations: () => api.get('/api/admin/emission-locations'),

  // Zone CRUD
  getZones: () => api.get('/api/zones'),

  getZoneById: (id) => api.get(`/api/zones/${id}`),

  createZone: (data) => api.post('/api/zones', data),

  updateZone: (id, data) => api.put(`/api/zones/${id}`, data),

  deleteZone: (id) => api.delete(`/api/zones/${id}`),

  // Zone analytics
  getZoneSummary: () => api.get('/api/admin/zones/summary'),

  getZoneEmissions: () => api.get('/api/admin/zones/emissions'),

  getZoneTotal: (zoneId) => api.get(`/api/admin/zones/${zoneId}/total`),

  // All users
  getAllUsers: () => api.get('/api/admin/users'),

  assignUserZone: (userId, zoneId) => api.put(`/api/admin/users/${userId}/zone/${zoneId}`),

  getUserStreakProfile: (id) => api.get(`/api/admin/users/${id}/streak`),

  updateUserStreakProfile: (id, data) => api.put(`/api/admin/users/${id}/streak`, data),
}
