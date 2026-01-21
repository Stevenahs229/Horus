import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
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

const DashboardOverview = () => {
  const [summary, setSummary] = useState(null)
  const [performance, setPerformance] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isActive = true
    const loadData = async () => {
      try {
        const [summaryData, performanceData] = await Promise.all([
          api.summary(),
          api.performance(),
        ])
        if (!isActive) return
        setSummary(summaryData)
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

  const totalValue = useMemo(() => {
    if (!summary) return 0
    return summary.totalInvested + summary.projectedRoi
  }, [summary])

  if (status === 'error') {
    return (
      <div className="glass p-6">
        <p className="text-sm text-rose-200">
          Unable to load dashboard data. Please refresh.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <Topbar
        title="Overview"
        subtitle="Your portfolio at a glance with live API insights."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: 'Total invested',
            value: summary
              ? currencyFormatter.format(summary.totalInvested)
              : '...'
          },
          {
            label: 'Projected ROI',
            value: summary
              ? currencyFormatter.format(summary.projectedRoi)
              : '...'
          },
          {
            label: 'Active positions',
            value: summary ? summary.positions : '...'
          },
        ].map((item) => (
          <div key={item.label} className="glass p-5">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="glass grid gap-6 p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Performance
          </p>
          <h2 className="text-xl font-semibold text-white">
            Portfolio growth trend
          </h2>
          <p className="text-sm text-slate-400">
            Current portfolio value: {currencyFormatter.format(totalValue)}
          </p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performance}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis
                stroke="#94a3b8"
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview
