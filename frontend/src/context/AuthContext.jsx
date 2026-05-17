import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getMe, setAuthToken } from '../lib/api'

const AuthContext = createContext(null)
const AUTH_KEY = 'intelli-auth'
const THEME_KEY = 'intelli-theme'

function applyThemePreference(preference) {
  const root = document.documentElement
  if (preference === 'light') root.classList.add('theme-light')
  else root.classList.remove('theme-light')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const setAuthState = useCallback((userObj, token) => {
    setUser(userObj)
    if (token) setAuthToken(token)
    localStorage.setItem(AUTH_KEY, JSON.stringify({ user: userObj, token }))
  }, [])

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser)
    const stored = localStorage.getItem(AUTH_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      localStorage.setItem(AUTH_KEY, JSON.stringify({ ...parsed, user: nextUser }))
    } catch {
      // ignore corrupted local auth state
    }
  }, [])

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY)
    applyThemePreference(savedTheme === 'light' ? 'light' : 'dark')

    const hydrate = async () => {
      const stored = localStorage.getItem(AUTH_KEY)
      if (!stored) {
        setLoading(false)
        return
      }
      try {
        const parsed = JSON.parse(stored)
        if (parsed?.token) {
          setAuthToken(parsed.token)
        }
        if (parsed?.user) {
          setUser(parsed.user)
        }
        if (parsed?.token) {
          try {
            const fresh = await getMe()
            setAuthState(fresh, parsed.token)
          } catch {
            // keep cached user if token refresh fails
          }
        }
      } catch {
        localStorage.removeItem(AUTH_KEY)
      } finally {
        setLoading(false)
      }
    }
    hydrate()
  }, [setAuthState])

  const login = (userObj, token) => {
    setAuthState(userObj, token)
  }

  const logout = () => {
    setUser(null)
    setAuthToken(null)
    localStorage.removeItem(AUTH_KEY)
  }

  const setTheme = (darkModeEnabled) => {
    const preference = darkModeEnabled ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, preference)
    applyThemePreference(preference)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, setTheme }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
