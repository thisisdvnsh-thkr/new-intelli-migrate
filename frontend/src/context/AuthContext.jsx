import { createContext, useContext, useState, useEffect } from 'react'
import api, { setAuthToken, getMe } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('intelli-auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setAuthState(parsed.user, parsed.token)
      } catch (e) {
        localStorage.removeItem('intelli-auth')
      }
    }
    setLoading(false)
  }, [])

  const setAuthState = (userObj, token) => {
    setUser(userObj)
    if (token) setAuthToken(token)
    localStorage.setItem('intelli-auth', JSON.stringify({ user: userObj, token }))
  }

  const login = (userObj, token) => {
    setAuthState(userObj, token)
  }

  const logout = () => {
    setUser(null)
    setAuthToken(null)
    localStorage.removeItem('intelli-auth')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
