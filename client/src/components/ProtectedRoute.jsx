import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoadingGate = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
    Loading workspace...
  </div>
)

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingGate />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
