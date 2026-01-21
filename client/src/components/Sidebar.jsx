import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccessAdmin } from '../lib/permissions'

const navLinkClass = ({ isActive }) =>
  `flex items-center justify-between rounded-xl px-4 py-3 text-sm transition ${
    isActive
      ? 'bg-white/10 text-white shadow-lg shadow-black/20'
      : 'text-slate-300 hover:bg-white/5 hover:text-white'
  }`

const Sidebar = () => {
  const { user } = useAuth()

  return (
    <aside className="flex h-full flex-col gap-6 border-r border-white/10 bg-slate-950/70 px-5 py-8 backdrop-blur">
      <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          NeliAxa
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">Dashboard</h2>
        <p className="mt-1 text-xs text-slate-400">{user?.email}</p>
      </div>

      <nav className="flex flex-col gap-2">
        <NavLink to="/dashboard" end className={navLinkClass}>
          Overview
        </NavLink>
        <NavLink to="/dashboard/portfolio" className={navLinkClass}>
          Portfolio
        </NavLink>
        <NavLink to="/dashboard/analytics" className={navLinkClass}>
          Analytics
        </NavLink>
        <NavLink to="/dashboard/wallet" className={navLinkClass}>
          Wallet
        </NavLink>
        <NavLink to="/dashboard/settings" className={navLinkClass}>
          Settings
        </NavLink>
        {canAccessAdmin(user?.role) && (
          <NavLink to="/admin" className={navLinkClass}>
            Admin
          </NavLink>
        )}
      </nav>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
        <p className="font-semibold text-white">Premium insights</p>
        <p className="mt-2">
          Early access placements and AI advisory are enabled for admins.
        </p>
      </div>
    </aside>
  )
}

export default Sidebar
