import { useAuth } from '../context/AuthContext'

const Topbar = ({ title, subtitle, actions }) => {
  const { signOut } = useAuth()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Dashboard
        </p>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button
          onClick={signOut}
          className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

export default Topbar
