import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const Register = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setError('')
    try {
      await signUp(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError('Unable to create account. Try a different email.')
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-grid opacity-10" />
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass w-full max-w-md p-8"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Get started
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Access live portfolios, ROI projections, and analytics.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm text-slate-300">
              Email
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                required
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white"
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Password
              <input
                type="password"
                minLength={6}
                value={form.password}
                onChange={handleChange('password')}
                required
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white"
              />
            </label>
            {error && <p className="text-sm text-rose-200">{error}</p>}
            <button
              type="submit"
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Creating...' : 'Create account'}
            </button>
          </form>
          <p className="mt-6 text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-300">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Register
