import { useEffect, useState } from 'react'
import Topbar from '../components/Topbar'
import { api } from '../lib/api'

const Admin = () => {
  const [users, setUsers] = useState([])
  const [overview, setOverview] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isActive = true
    const loadData = async () => {
      try {
        const [usersData, overviewData] = await Promise.all([
          api.adminUsers(),
          api.adminOverview(),
        ])
        if (!isActive) return
        setUsers(usersData.items || [])
        setOverview(overviewData)
        setStatus('ready')
      } catch (error) {
        if (!isActive) return
        setStatus('error')
      }
    }
    loadData()
    return () => {
      isActive = false
    }
  }, [])

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
        subtitle="Manage users, metrics, and premium access."
      />

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

      <div className="glass p-6">
        <h2 className="text-lg font-semibold text-white">Users</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3">Email</th>
                <th className="py-3">Role</th>
                <th className="py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5">
                  <td className="py-3 text-white">{user.email}</td>
                  <td className="py-3">{user.role}</td>
                  <td className="py-3">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Admin
