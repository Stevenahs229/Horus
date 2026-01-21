const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const getToken = () => localStorage.getItem('neliaxa_token')

const setToken = (token) => {
  if (token) {
    localStorage.setItem('neliaxa_token', token)
  } else {
    localStorage.removeItem('neliaxa_token')
  }
}

const request = async (path, options = {}) => {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = errorBody.error || 'request_failed'
    throw new Error(message)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const api = {
  getToken,
  setToken,
  health: () => request('/api/health'),
  metrics: () => request('/api/metrics'),
  investments: () => request('/api/investments'),
  roi: (params) => request(`/api/roi?${new URLSearchParams(params).toString()}`),
  register: (payload) =>
    request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  me: () => request('/api/auth/me'),
  summary: () => request('/api/dashboard/summary'),
  portfolio: () => request('/api/portfolio'),
  performance: () => request('/api/performance'),
  adminUsers: () => request('/api/admin/users'),
  adminOverview: () => request('/api/admin/overview'),
}
