import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { accountApi } from '../api/accountApi'
import { authApi } from '../api/authApi'
import { setApiAuthToken } from '../api/axiosInstance'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    setApiAuthToken(null)
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  const persistUser = useCallback((nextUser) => {
    localStorage.setItem('user', JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const refreshProfile = useCallback(async (tokenOverride = null) => {
    if (tokenOverride) {
      setApiAuthToken(tokenOverride)
    }

    try {
      const res = await accountApi.getCurrentProfile()
      persistUser(res.data)
      setToken(tokenOverride || 'cookie-session')
      return res.data
    } catch (error) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        clearSession()
      }
      return null
    }
  }, [clearSession, persistUser])

  useEffect(() => {
    window.addEventListener('auth:session-expired', clearSession)

    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('token')

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
        setToken(storedToken || 'cookie-session')
        if (storedToken) {
          setApiAuthToken(storedToken)
        }
      } catch {
        localStorage.removeItem('user')
      }
    }

    refreshProfile(storedToken).finally(() => setLoading(false))
    return () => window.removeEventListener('auth:session-expired', clearSession)
  }, [clearSession, refreshProfile])

  const login = useCallback((authData) => {
    const initialUser = {
      name: authData.name,
      email: authData.email,
      role: authData.role,
      sectorCategory: authData.sectorCategory,
      sectorType: authData.sectorType,
    }

    setApiAuthToken(authData.token || null)
    setToken(authData.token || 'cookie-session')
    persistUser(initialUser)
    void refreshProfile(authData.token)
  }, [persistUser, refreshProfile])

  const logout = useCallback(() => {
    void authApi.logout().catch(() => {})
    clearSession()
  }, [clearSession])

  const isAdmin = user?.role === 'ROLE_ADMIN'
  const isUser = user?.role === 'ROLE_USER'
  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshProfile, isAdmin, isUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
