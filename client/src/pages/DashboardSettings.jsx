import { useState } from 'react'
import Topbar from '../components/Topbar'
import { useAuth } from '../context/AuthContext'

const DashboardSettings = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [twoFactor, setTwoFactor] = useState(true)

  return (
    <div className="flex flex-col gap-8">
      <Topbar
        title="Settings"
        subtitle="Customize alerts, security, and account access."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white">Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Manage your credentials and profile details.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-slate-300">
            <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              Email: <span className="text-white">{user?.email}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              Role: <span className="text-white">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white">Preferences</h2>
          <div className="mt-4 grid gap-4 text-sm text-slate-300">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              <span>Personalized notifications</span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => setNotifications((prev) => !prev)}
                className="h-4 w-4 accent-cyan-400"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              <span>Two-factor authentication</span>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={() => setTwoFactor((prev) => !prev)}
                className="h-4 w-4 accent-cyan-400"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSettings
