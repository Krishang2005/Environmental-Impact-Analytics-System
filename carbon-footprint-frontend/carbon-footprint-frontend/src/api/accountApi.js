import api from './axiosInstance'

export const accountApi = {
  getCurrentProfile: () => api.get('/api/account/me'),
}
