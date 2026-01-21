import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  maximumFractionDigits: 1,
})

function App() {
  const [apiStatus, setApiStatus] = useState('loading')
  const [apiTime, setApiTime] = useState('')
  const [investments, setInvestments] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [roiInput, setRoiInput] = useState({
    amount: 2500,
    months: 12,
    rate: 0.06,
  })
  const [roiResult, setRoiResult] = useState(null)
  const [roiState, setRoiState] = useState('idle')
  const [roiError, setRoiError] = useState('')

  const formattedAmount = useMemo(
    () => currencyFormatter.format(Number(roiInput.amount || 0)),
    [roiInput.amount]
  )

  useEffect(() => {
    let isActive = true

    const loadData = async () => {
      try {
        const [healthRes, investmentsRes, metricsRes] = await Promise.all([
          fetch(`${API_BASE}/api/health`),
          fetch(`${API_BASE}/api/investments`),
          fetch(`${API_BASE}/api/metrics`),
        ])

        if (!healthRes.ok || !investmentsRes.ok || !metricsRes.ok) {
          throw new Error('api_unavailable')
        }

        const health = await healthRes.json()
        const investmentData = await investmentsRes.json()
        const metricsData = await metricsRes.json()

        if (!isActive) return
        setApiStatus(health.status || 'online')
        setApiTime(health.timestamp || '')
        setInvestments(investmentData.items || [])
        setMetrics(metricsData)
      } catch (error) {
        if (!isActive) return
        setApiStatus('offline')
        setInvestments([])
        setMetrics(null)
      }
    }

    loadData()
    return () => {
      isActive = false
    }
  }, [])

  const handleInputChange = (field) => (event) => {
    const value = event.target.value
    setRoiInput((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCalculate = async () => {
    setRoiState('loading')
    setRoiError('')
    try {
      const params = new URLSearchParams({
        amount: roiInput.amount,
        months: roiInput.months,
        rate: roiInput.rate,
      })
      const response = await fetch(`${API_BASE}/api/roi?${params.toString()}`)
      if (!response.ok) {
        throw new Error('invalid_response')
      }
      const data = await response.json()
      setRoiResult(data)
      setRoiState('success')
    } catch (error) {
      setRoiError('Unable to calculate ROI. Check API connection.')
      setRoiState('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-grid opacity-20" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-indigo-500" />
          <span className="text-lg font-semibold tracking-wide">NeliAxa</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
            Full stack
          </span>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">
            API {apiStatus}
          </span>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20 pt-6">
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="flex flex-col gap-6">
            <motion.p
              variants={fadeUp}
              className="text-sm uppercase tracking-[0.3em] text-slate-400"
            >
              Investment platform
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-4xl font-semibold leading-tight text-white md:text-5xl"
            >
              Modern, animated, and data-driven investing with{' '}
              <span className="gradient-text">4% to 7% ROI</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-slate-300">
              NeliAxa combines portfolio diversification, automated plans, and
              real-time analytics. The API feeds live products and ROI
              simulations so the UI stays dynamic.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-4"
            >
              <button className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/40">
                Start investing
              </button>
              <button className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white/80">
                View the demo
              </button>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="grid gap-4 sm:grid-cols-3"
            >
              {[
                {
                  label: 'Investors active',
                  value: metrics
                    ? `${(metrics.investorsActive / 1000).toFixed(1)}k`
                    : '12.4k',
                },
                {
                  label: 'Assets tracked',
                  value: metrics
                    ? `${Math.round(metrics.assetsTrackedEur / 1000000)}M EUR`
                    : '48M EUR',
                },
                {
                  label: 'Alerts triggered',
                  value: metrics
                    ? `${(metrics.alertsTriggered / 1000).toFixed(1)}k`
                    : '1.9k',
                },
              ].map((item) => (
                <div key={item.label} className="glass px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            className="glass flex flex-col gap-6 p-6"
          >
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Live ROI calculator
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Simulate your returns
              </h2>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm text-slate-300">
                Amount
                <input
                  type="number"
                  min="250"
                  step="250"
                  value={roiInput.amount}
                  onChange={handleInputChange('amount')}
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white"
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Duration (months)
                <input
                  type="number"
                  min="3"
                  max="36"
                  value={roiInput.months}
                  onChange={handleInputChange('months')}
                  className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white"
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Target rate
                <input
                  type="range"
                  min="0.04"
                  max="0.07"
                  step="0.001"
                  value={roiInput.rate}
                  onChange={handleInputChange('rate')}
                />
                <span className="text-xs text-slate-400">
                  {percentFormatter.format(Number(roiInput.rate))}
                </span>
              </label>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleCalculate}
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900"
              >
                {roiState === 'loading' ? 'Calculating...' : 'Calculate ROI'}
              </button>
              <div className="rounded-xl border border-white/10 bg-slate-900/50 px-4 py-4">
                {roiState === 'error' ? (
                  <p className="text-sm text-rose-200">{roiError}</p>
                ) : roiResult ? (
                  <div className="grid gap-1 text-sm text-slate-200">
                    <p>
                      Invested: <span className="text-white">{formattedAmount}</span>
                    </p>
                    <p>
                      ROI: <span className="text-white">{currencyFormatter.format(roiResult.roi)}</span>
                    </p>
                    <p>
                      Total return:{' '}
                      <span className="text-white">
                        {currencyFormatter.format(roiResult.total)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Run a simulation to see projected returns.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-8"
        >
          <motion.div variants={fadeUp}>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Products
            </p>
            <h2 className="section-title">Investment options</h2>
            <p className="mt-2 max-w-2xl text-slate-300">
              Diversify with curated opportunities across real estate, startups,
              and fixed income. All options are served by the API.
            </p>
          </motion.div>
          <motion.div
            variants={stagger}
            className="grid gap-6 md:grid-cols-2"
          >
            {investments.map((item) => (
              <motion.div
                key={item.id}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className="glass p-6 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {item.name}
                    </h3>
                    <p className="text-sm text-slate-400">{item.category}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {item.risk}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-300">
                  <p>Minimum: {currencyFormatter.format(item.minAmount)}</p>
                  <p>Term: {item.termMonths} months</p>
                  <p>
                    ROI range:{' '}
                    {percentFormatter.format(item.roiRange[0])} -{' '}
                    {percentFormatter.format(item.roiRange[1])}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="glass grid gap-6 p-8"
        >
          <motion.div variants={fadeUp}>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Platform trust
            </p>
            <h2 className="section-title">Security and transparency</h2>
          </motion.div>
          <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'KYC automation',
                description: 'Identity validation with secure document capture.',
              },
              {
                title: 'Capital coverage',
                description:
                  'Partial guarantee and insured deposits for confidence.',
              },
              {
                title: 'On-chain audit',
                description:
                  'Proof of returns with blockchain-backed reporting.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-5"
              >
                <h3 className="text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {item.description}
                </p>
              </div>
            ))}
          </motion.div>
        </motion.section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        API status: {apiStatus} {apiTime ? `| ${apiTime}` : ''}
      </footer>
    </div>
  )
}

export default App
