import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-grid opacity-10" />
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <Sidebar />
        <main className="px-6 py-10 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
