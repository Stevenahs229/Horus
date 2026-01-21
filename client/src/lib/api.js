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
  const { authToken, ...fetchOptions } = options
  const headers = {
    ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
    ...(fetchOptions.headers || {}),
  }
  const token = authToken || getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
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
  verifyTwoFactor: (payload, tempToken) =>
    request('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken: tempToken,
    }),
  me: () => request('/api/auth/me'),
  setupTwoFactor: () => request('/api/2fa/setup', { method: 'POST' }),
  confirmTwoFactor: (payload) =>
    request('/api/2fa/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  disableTwoFactor: (payload) =>
    request('/api/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  summary: () => request('/api/dashboard/summary'),
  portfolio: () => request('/api/portfolio'),
  performance: () => request('/api/performance'),
  wallet: () => request('/api/wallet'),
  walletDeposit: (payload) =>
    request('/api/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  walletWithdraw: (payload) =>
    request('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminUsers: () => request('/api/admin/users'),
  adminOverview: () => request('/api/admin/overview'),
  adminUpdateRole: (id, payload) =>
    request(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  adminInvestments: () => request('/api/admin/investments'),
  adminCreateInvestment: (payload) =>
    request('/api/admin/investments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  adminUpdateInvestment: (id, payload) =>
    request(`/api/admin/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  adminDeleteInvestment: (id) =>
    request(`/api/admin/investments/${id}`, {
      method: 'DELETE',
    }),
  adminWallets: () => request('/api/admin/wallets'),
}
