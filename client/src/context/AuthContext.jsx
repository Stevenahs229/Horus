import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingToken, setPendingToken] = useState(null)

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
    if (data.requires2fa) {
      setPendingToken(data.tempToken)
      return { requires2fa: true }
    }
    api.setToken(data.token)
    setUser(data.user)
    return { requires2fa: false, user: data.user }
  }

  const signUp = async (email, password) => {
    setError('')
    const data = await api.register({ email, password })
    api.setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const verifyTwoFactor = async (token) => {
    if (!pendingToken) {
      throw new Error('missing_two_factor_token')
    }
    const data = await api.verifyTwoFactor({ token }, pendingToken)
    api.setToken(data.token)
    setUser(data.user)
    setPendingToken(null)
    return data.user
  }

  const signOut = () => {
    api.setToken(null)
    setUser(null)
    setPendingToken(null)
  }

  const refreshUser = async () => {
    try {
      const data = await api.me()
      setUser(data.user)
      return data.user
    } catch (error) {
      api.setToken(null)
      setUser(null)
      setPendingToken(null)
      throw error
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAdmin: user?.role === 'admin',
      pendingTwoFactor: Boolean(pendingToken),
      signIn,
      signUp,
      verifyTwoFactor,
      signOut,
      refreshUser,
    }),
    [user, loading, error, pendingToken]
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
