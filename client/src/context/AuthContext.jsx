import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUser = async () => {
      const token = api.getToken()
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const data = await api.me()
        setUser(data.user)
      } catch (err) {
        api.setToken(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const signIn = async (email, password) => {
    setError('')
    const data = await api.login({ email, password })
    api.setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const signUp = async (email, password) => {
    setError('')
    const data = await api.register({ email, password })
    api.setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const signOut = () => {
    api.setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAdmin: user?.role === 'admin',
      signIn,
      signUp,
      signOut,
    }),
    [user, loading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
