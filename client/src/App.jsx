import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Admin from './pages/Admin'
import DashboardAnalytics from './pages/DashboardAnalytics'
import DashboardLayout from './pages/DashboardLayout'
import DashboardOverview from './pages/DashboardOverview'
import DashboardPortfolio from './pages/DashboardPortfolio'
import DashboardSettings from './pages/DashboardSettings'
import DashboardWallet from './pages/DashboardWallet'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Register from './pages/Register'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="portfolio" element={<DashboardPortfolio />} />
        <Route path="analytics" element={<DashboardAnalytics />} />
        <Route path="wallet" element={<DashboardWallet />} />
        <Route path="settings" element={<DashboardSettings />} />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'support']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Admin />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
