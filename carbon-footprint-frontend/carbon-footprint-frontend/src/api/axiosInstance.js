import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || ''

let inMemoryToken = localStorage.getItem('token')

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

export function setApiAuthToken(token) {
  if (token) {
    inMemoryToken = token
    localStorage.setItem('token', token)
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  inMemoryToken = null
  delete api.defaults.headers.common.Authorization
}

api.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`
    } else {
      delete config.headers.Authorization
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const storedUser = localStorage.getItem('user')
      let redirectTo = '/login'

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          if (parsedUser?.role === 'ROLE_ADMIN') {
            redirectTo = '/admin/login'
          }
        } catch {
          redirectTo = '/login'
        }
      }

      setApiAuthToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = redirectTo
    }
    return Promise.reject(error)
  },
)

export default api
