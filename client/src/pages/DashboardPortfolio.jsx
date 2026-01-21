import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import Topbar from '../components/Topbar'

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const DashboardPortfolio = () => {
  const [portfolio, setPortfolio] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isActive = true
    const loadData = async () => {
      try {
        const data = await api.portfolio()
        if (!isActive) return
        setPortfolio(data.items || [])
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

  const totalInvested = useMemo(
    () => portfolio.reduce((acc, item) => acc + item.amount, 0),
    [portfolio]
  )

  if (status === 'error') {
    return (
      <div className="glass p-6">
        <p className="text-sm text-rose-200">
          Unable to load portfolio. Please refresh.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <Topbar
        title="Portfolio"
        subtitle="Track your active placements and risk distribution."
        actions={
          <button className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-900">
            Add funds
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Total invested
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {status === 'loading'
              ? '...'
              : currencyFormatter.format(totalInvested)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Active positions
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {status === 'loading' ? '...' : portfolio.length}
          </p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Average ROI band
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            {portfolio.length
              ? percentFormatter.format(
                  portfolio.reduce(
                    (acc, item) =>
                      acc +
                      (item.investment.roiRange[0] +
                        item.investment.roiRange[1]) /
                        2,
                    0
                  ) / portfolio.length
                )
              : '...'}
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {portfolio.map((item) => (
          <div key={item.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {item.investment.name}
                </h3>
                <p className="text-sm text-slate-400">
                  {item.investment.category} • {item.investment.termMonths} months
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                {item.investment.risk} risk
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
              <p>Invested: {currencyFormatter.format(item.amount)}</p>
              <p>
                ROI range:{' '}
                {percentFormatter.format(item.investment.roiRange[0])} -{' '}
                {percentFormatter.format(item.investment.roiRange[1])}
              </p>
              <p>Min ticket: {currencyFormatter.format(item.investment.minAmount)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPortfolio
