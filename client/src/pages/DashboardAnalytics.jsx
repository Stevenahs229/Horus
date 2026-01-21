import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../lib/api'
import Topbar from '../components/Topbar'

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const DashboardAnalytics = () => {
  const [portfolio, setPortfolio] = useState([])
  const [performance, setPerformance] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isActive = true
    const loadData = async () => {
      try {
        const [portfolioData, performanceData] = await Promise.all([
          api.portfolio(),
          api.performance(),
        ])
        if (!isActive) return
        setPortfolio(portfolioData.items || [])
        setPerformance(performanceData.points || [])
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

  const allocation = useMemo(() => {
    const totals = portfolio.reduce((acc, item) => {
      const key = item.investment.category
      acc[key] = (acc[key] || 0) + item.amount
      return acc
    }, {})
    return Object.entries(totals).map(([category, value]) => ({
      category,
      value,
    }))
  }, [portfolio])

  if (status === 'error') {
    return (
      <div className="glass p-6">
        <p className="text-sm text-rose-200">
          Unable to load analytics data. Please refresh.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <Topbar
        title="Analytics"
        subtitle="Visualize performance, allocation, and ROI trends."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white">
            Allocation by category
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Breakdown of active placements.
          </p>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={allocation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="category" stroke="#94a3b8" />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => currencyFormatter.format(value)}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                />
                <Legend />
                <Bar dataKey="value" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white">Monthly growth</h2>
          <p className="mt-1 text-sm text-slate-400">
            ROI progression based on portfolio snapshots.
          </p>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis
                  stroke="#94a3b8"
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => currencyFormatter.format(value)}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardAnalytics
