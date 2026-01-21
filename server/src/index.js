import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000
const clientOrigin = process.env.CLIENT_ORIGIN || '*'

app.use(cors({ origin: clientOrigin }))
app.use(express.json())

const investments = [
  {
    id: 'green-bonds',
    name: 'Green Bonds',
    category: 'Fixed income',
    minAmount: 500,
    termMonths: 12,
    roiRange: [0.04, 0.055],
    risk: 'Low',
  },
  {
    id: 'startup-growth',
    name: 'Startup Growth',
    category: 'Venture capital',
    minAmount: 1500,
    termMonths: 18,
    roiRange: [0.055, 0.07],
    risk: 'Medium',
  },
  {
    id: 'real-estate',
    name: 'Urban Real Estate',
    category: 'Real estate',
    minAmount: 2000,
    termMonths: 24,
    roiRange: [0.045, 0.065],
    risk: 'Medium',
  },
  {
    id: 'crypto-yield',
    name: 'Digital Yield',
    category: 'Digital assets',
    minAmount: 750,
    termMonths: 6,
    roiRange: [0.05, 0.07],
    risk: 'High',
  },
]

const metrics = {
  investorsActive: 12400,
  assetsTrackedEur: 48000000,
  alertsTriggered: 1900,
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  })
})

app.get('/api/investments', (req, res) => {
  res.json({ items: investments })
})

app.get('/api/metrics', (req, res) => {
  res.json(metrics)
})

app.get('/api/roi', (req, res) => {
  const amount = Number(req.query.amount)
  const months = Number(req.query.months)
  const rate = Number(req.query.rate)

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'invalid_amount' })
  }
  if (!Number.isFinite(months) || months <= 0) {
    return res.status(400).json({ error: 'invalid_months' })
  }
  if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
    return res.status(400).json({ error: 'invalid_rate' })
  }

  const roi = amount * rate * (months / 12)
  const total = amount + roi

  return res.json({
    amount,
    months,
    rate,
    roi: Math.round(roi),
    total: Math.round(total),
  })
})

app.listen(port, () => {
  console.log(`NELIAXA API listening on port ${port}`)
})
