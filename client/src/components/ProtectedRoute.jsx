import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hasPermission } from '../lib/permissions'

const LoadingGate = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
    Loading workspace...
  </div>
)

const ProtectedRoute = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingGate />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
