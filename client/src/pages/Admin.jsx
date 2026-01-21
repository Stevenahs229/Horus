import { useEffect, useMemo, useState } from 'react'
import Topbar from '../components/Topbar'
import { api } from '../lib/api'
import { hasPermission } from '../lib/permissions'
import { useAuth } from '../context/AuthContext'

const roleOptions = ['admin', 'manager', 'support', 'user']
const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const Admin = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [overview, setOverview] = useState(null)
  const [investments, setInvestments] = useState([])
  const [wallets, setWallets] = useState([])
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')
  const [newInvestment, setNewInvestment] = useState({
    name: '',
    category: '',
    minAmount: 500,
    termMonths: 12,
    roiMin: 0.04,
    roiMax: 0.06,
    risk: 'Medium',
  })
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const canReadUsers = hasPermission(user?.role, 'users:read')
  const canEditRoles = hasPermission(user?.role, 'users:write')
  const canReadInvestments = hasPermission(user?.role, 'investments:read')
  const canWriteInvestments = hasPermission(user?.role, 'investments:write')
  const canReadWallets = hasPermission(user?.role, 'wallets:read')
  const canReadMetrics = hasPermission(user?.role, 'metrics:read')

  const messageClass = useMemo(() => {
    if (messageTone === 'success') return 'text-emerald-200'
    if (messageTone === 'error') return 'text-rose-200'
    return 'text-slate-300'
  }, [messageTone])

  useEffect(() => {
    let isActive = true
    const loadData = async () => {
      setStatus('loading')
      try {
        if (canReadUsers) {
          const usersData = await api.adminUsers()
          if (isActive) setUsers(usersData.items || [])
        }
        if (canReadMetrics) {
          const overviewData = await api.adminOverview()
          if (isActive) setOverview(overviewData)
        }
        if (canReadInvestments) {
          const investmentData = await api.adminInvestments()
          if (isActive) setInvestments(investmentData.items || [])
        }
        if (canReadWallets) {
          const walletsData = await api.adminWallets()
          if (isActive) setWallets(walletsData.items || [])
        }
        if (isActive) setStatus('ready')
      } catch (error) {
        if (!isActive) return
        setStatus('error')
      }
    }
    loadData()
    return () => {
      isActive = false
    }
  }, [
    canReadUsers,
    canReadMetrics,
    canReadInvestments,
    canReadWallets,
  ])

  const handleRoleChange = async (userId, role) => {
    setMessage('')
    try {
      const result = await api.adminUpdateRole(userId, { role })
      setUsers((prev) =>
        prev.map((entry) => (entry.id === userId ? result.user : entry))
      )
      setMessage('Role updated.')
      setMessageTone('success')
    } catch (error) {
      setMessage('Unable to update role.')
      setMessageTone('error')
    }
  }

  const handleCreateInvestment = async () => {
    setMessage('')
    try {
      const payload = {
        ...newInvestment,
        minAmount: Number(newInvestment.minAmount),
        termMonths: Number(newInvestment.termMonths),
        roiMin: Number(newInvestment.roiMin),
        roiMax: Number(newInvestment.roiMax),
      }
      const result = await api.adminCreateInvestment(payload)
      setInvestments((prev) => [result.investment, ...prev])
      setNewInvestment({
        name: '',
        category: '',
        minAmount: 500,
        termMonths: 12,
        roiMin: 0.04,
        roiMax: 0.06,
        risk: 'Medium',
      })
      setMessage('Investment created.')
      setMessageTone('success')
    } catch (error) {
      setMessage('Unable to create investment.')
      setMessageTone('error')
    }
  }

  const handleEditInvestment = (investment) => {
    setEditId(investment.id)
    setEditForm({
      name: investment.name,
      category: investment.category,
      minAmount: investment.minAmount,
      termMonths: investment.termMonths,
      roiMin: investment.roiRange[0],
      roiMax: investment.roiRange[1],
      risk: investment.risk,
    })
  }

  const handleUpdateInvestment = async () => {
    setMessage('')
    try {
      const payload = {
        ...editForm,
        minAmount: Number(editForm.minAmount),
        termMonths: Number(editForm.termMonths),
        roiMin: Number(editForm.roiMin),
        roiMax: Number(editForm.roiMax),
      }
      const result = await api.adminUpdateInvestment(editId, payload)
      setInvestments((prev) =>
        prev.map((item) =>
          item.id === editId ? result.investment : item
        )
      )
      setEditId(null)
      setEditForm({})
      setMessage('Investment updated.')
      setMessageTone('success')
    } catch (error) {
      setMessage('Unable to update investment.')
      setMessageTone('error')
    }
  }

  const handleDeleteInvestment = async (id) => {
    setMessage('')
    try {
      await api.adminDeleteInvestment(id)
      setInvestments((prev) => prev.filter((item) => item.id !== id))
      setMessage('Investment deleted.')
      setMessageTone('success')
    } catch (error) {
      const messageText =
        error.message === 'positions_exist'
          ? 'Cannot delete investment with active positions.'
          : 'Unable to delete investment.'
      setMessage(messageText)
      setMessageTone('error')
    }
  }

  if (status === 'error') {
    return (
      <div className="glass p-6">
        <p className="text-sm text-rose-200">
          Admin data is unavailable. Check your credentials.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <Topbar
        title="Admin control"
        subtitle="Manage users, roles, investments, and wallets."
      />

      {message && (
        <div className="glass px-4 py-3">
          <p className={`text-sm ${messageClass}`}>{message}</p>
        </div>
      )}

      {canReadMetrics && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Total users',
              value: overview?.metrics?.investorsActive ?? '...',
            },
            {
              label: 'Investments',
              value: overview?.investments ?? '...',
            },
            {
              label: 'Alerts triggered',
              value: overview?.metrics?.alertsTriggered ?? '...',
            },
          ].map((item) => (
            <div key={item.label} className="glass p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {canReadUsers && (
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white">Users</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3">Email</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">2FA</th>
                  <th className="py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((entry) => (
                  <tr key={entry.id} className="border-b border-white/5">
                    <td className="py-3 text-white">{entry.email}</td>
                    <td className="py-3">
                      {canEditRoles ? (
                        <select
                          value={entry.role}
                          onChange={(event) =>
                            handleRoleChange(entry.id, event.target.value)
                          }
                          className="rounded-lg border border-white/10 bg-slate-900/60 px-2 py-1 text-xs text-white"
                        >
                          {roleOptions.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      ) : (
                        entry.role
                      )}
                    </td>
                    <td className="py-3">
                      {entry.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </td>
                    <td className="py-3">
                      {new Date(entry.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {canReadInvestments && (
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white">Investments</h2>
          {canWriteInvestments && (
            <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
              <input
                type="text"
                value={newInvestment.name}
                onChange={(event) =>
                  setNewInvestment((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Name"
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
              />
              <input
                type="text"
                value={newInvestment.category}
                onChange={(event) =>
                  setNewInvestment((prev) => ({
                    ...prev,
                    category: event.target.value,
                  }))
                }
                placeholder="Category"
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
              />
              <select
                value={newInvestment.risk}
                onChange={(event) =>
                  setNewInvestment((prev) => ({
                    ...prev,
                    risk: event.target.value,
                  }))
                }
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <input
                type="number"
                min="100"
                value={newInvestment.minAmount}
                onChange={(event) =>
                  setNewInvestment((prev) => ({
                    ...prev,
                    minAmount: event.target.value,
                  }))
                }
                placeholder="Minimum amount"
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="3"
                value={newInvestment.termMonths}
                onChange={(event) =>
                  setNewInvestment((prev) => ({
                    ...prev,
                    termMonths: event.target.value,
                  }))
                }
                placeholder="Term months"
                className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  max="1"
                  value={newInvestment.roiMin}
                  onChange={(event) =>
                    setNewInvestment((prev) => ({
                      ...prev,
                      roiMin: event.target.value,
                    }))
                  }
                  placeholder="ROI min"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
                />
                <input
                  type="number"
                  step="0.001"
                  min="0.01"
                  max="1"
                  value={newInvestment.roiMax}
                  onChange={(event) =>
                    setNewInvestment((prev) => ({
                      ...prev,
                      roiMax: event.target.value,
                    }))
                  }
                  placeholder="ROI max"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
                />
              </div>
              <button
                onClick={handleCreateInvestment}
                className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-900"
              >
                Create investment
              </button>
            </div>
          )}
          <div className="mt-6 space-y-4">
            {investments.map((investment) => (
              <div key={investment.id} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                {editId === investment.id ? (
                  <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-3">
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
                    />
                    <input
                      type="text"
                      value={editForm.category || ''}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          category: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
                    />
                    <select
                      value={editForm.risk || 'Medium'}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          risk: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    <input
                      type="number"
                      min="100"
                      value={editForm.minAmount || ''}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          minAmount: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
                    />
                    <input
                      type="number"
                      min="3"
                      value={editForm.termMonths || ''}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          termMonths: event.target.value,
                        }))
                      }
                      className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0.01"
                        max="1"
                        value={editForm.roiMin || ''}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            roiMin: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
                      />
                      <input
                        type="number"
                        step="0.001"
                        min="0.01"
                        max="1"
                        value={editForm.roiMax || ''}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            roiMax: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleUpdateInvestment}
                        className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-900"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-300">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {investment.name}
                      </h3>
                      <p>
                        {investment.category} • {investment.termMonths} months
                      </p>
                      <p>
                        ROI {percentFormatter.format(investment.roiRange[0])} -{' '}
                        {percentFormatter.format(investment.roiRange[1])} •{' '}
                        {investment.risk}
                      </p>
                    </div>
                    {canWriteInvestments && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditInvestment(investment)}
                          className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteInvestment(investment.id)}
                          className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {!investments.length && status === 'ready' && (
              <p className="text-sm text-slate-400">No investments found.</p>
            )}
          </div>
        </div>
      )}

      {canReadWallets && (
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white">Wallets</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-3">User</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">Balance</th>
                  <th className="py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className="border-b border-white/5">
                    <td className="py-3 text-white">{wallet.email}</td>
                    <td className="py-3">{wallet.role}</td>
                    <td className="py-3">
                      {currencyFormatter.format(wallet.balance)}
                    </td>
                    <td className="py-3">
                      {new Date(wallet.updatedAt).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
                {!wallets.length && status === 'ready' && (
                  <tr>
                    <td className="py-3 text-slate-400" colSpan={4}>
                      No wallet data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
