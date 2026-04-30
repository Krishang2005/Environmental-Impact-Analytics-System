import api from './axiosInstance'

export const userApi = {
  getDashboard: () => api.get('/api/user/dashboard'),

  getEmissionInsights: () => api.get('/api/user/emission-insights'),

  chatWithAssistant: (message, history = []) => api.post('/api/user/assistant/chat', { message, history }),

  getStreakOverview: () => api.get('/api/user/streak'),

  checkInStreak: () => api.post('/api/user/streak/check-in'),

  claimWeeklyStreakBox: () => api.post('/api/user/streak/claim-weekly-box'),

  getRecommendations: () => api.get('/api/user/recommendations'),

  getChallenge: () => api.get('/api/user/challenge'),

  getZoneEmissions: () => api.get('/api/user/zone-emissions'),

  getGoalProgress: () => api.get('/api/user/goals/progress'),

  updateGoalSettings: (data) => api.put('/api/user/goals/settings', data),

  sendGoalWeeklySummary: () => api.post('/api/user/goals/send-weekly-summary'),

  getCurrentMission: () => api.get('/api/user/missions/current'),

  getRewards: () => api.get('/api/user/rewards'),

  getNotifications: () => api.get('/api/user/notifications'),

  markAllNotificationsRead: () => api.post('/api/user/notifications/mark-all-read'),

  getLeaderboard: (month, year) => {
    const params = new URLSearchParams()
    if (month) params.append('month', month)
    if (year) params.append('year', year)
    return api.get(`/api/user/leaderboard?${params.toString()}`)
  },
}
