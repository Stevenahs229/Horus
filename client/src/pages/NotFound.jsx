import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="glass max-w-md p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you requested does not exist yet.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-900"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
