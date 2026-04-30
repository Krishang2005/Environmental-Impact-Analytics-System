import api from './axiosInstance'

export const authApi = {
  login: (data) => api.post('/api/auth/login', data),

  userLogin: (data) => api.post('/api/auth/login', data),

  adminLogin: (data) => api.post('/api/auth/login', data),

  register: (data) => api.post('/api/auth/register', data),

  verifyOtp: (data) => api.post('/api/auth/verify-otp', data),

  adminVerifyOtp: (data) => api.post('/api/admin-auth/verify-otp', data),

  forgotPassword: (email) =>
    api.post(`/api/auth/forgot-password?email=${encodeURIComponent(email)}`),

  resetPassword: (data) => api.post('/api/auth/reset-password', data),

  logout: () => api.post('/api/auth/logout'),

  changeUserPassword: (data) => api.post('/api/account/change-password', data),

  changeAdminPassword: (data) => api.post('/api/account/change-password', data),

  changePassword: (data, role = 'user') =>
    api.post('/api/account/change-password', data),
}
