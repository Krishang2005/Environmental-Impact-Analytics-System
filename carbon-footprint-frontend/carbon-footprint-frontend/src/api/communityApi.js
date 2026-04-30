import api from './axiosInstance'

export const communityApi = {
  getIssues: () => api.get('/api/community/issues'),

  getMyIssues: () => api.get('/api/community/issues/mine'),

  createIssue: (data) => api.post('/api/community/issues', data),

  updateIssueStatus: (id, status, data = {}) =>
    api.put(`/api/community/issues/${id}/status?status=${status}`, data),

  toggleUpvote: (id) => api.post(`/api/community/issues/${id}/upvote`),

  toggleFollow: (id) => api.post(`/api/community/issues/${id}/follow`),

  getComplaintAnalytics: () => api.get('/api/admin/complaints/analytics'),
}
