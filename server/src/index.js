import bcrypt from 'bcryptjs'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import {
  createUser,
  getInvestments,
  getMetrics,
  getPerformanceByUserId,
  getPortfolioByUserId,
  getUserByEmail,
  getUserById,
  initializeDatabase,
  listUsers,
} from './db.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000
const clientOrigin = process.env.CLIENT_ORIGIN || '*'
const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me'

initializeDatabase()

const corsOptions =
  clientOrigin === '*' ? {} : { origin: clientOrigin, credentials: true }

app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  )

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing_token' })
  }
  try {
    const payload = jwt.verify(token, jwtSecret)
    req.user = payload
    return next()
  } catch (error) {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' })
  }
  return next()
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  })
})

app.post('/api/auth/register', (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload' })
  }

  const existing = getUserByEmail(parsed.data.email)
  if (existing) {
    return res.status(409).json({ error: 'email_in_use' })
  }

  const user = createUser(parsed.data.email, parsed.data.password, 'user')
  const token = signToken(user)

  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  })
})

app.post('/api/auth/login', (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload' })
  }

  const user = getUserByEmail(parsed.data.email)
  if (!user) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  const matches = bcrypt.compareSync(parsed.data.password, user.password_hash)
  if (!matches) {
    return res.status(401).json({ error: 'invalid_credentials' })
  }

  const token = signToken(user)
  return res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  })
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = getUserById(req.user.sub)
  if (!user) {
    return res.status(404).json({ error: 'user_not_found' })
  }
  return res.json({ user })
})

app.get('/api/investments', (req, res) => {
  res.json({ items: getInvestments() })
})

app.get('/api/metrics', (req, res) => {
  res.json(getMetrics())
})

app.get('/api/portfolio', authMiddleware, (req, res) => {
  const portfolio = getPortfolioByUserId(req.user.sub)
  res.json({ items: portfolio })
})

app.get('/api/performance', authMiddleware, (req, res) => {
  const points = getPerformanceByUserId(req.user.sub)
  res.json({ points })
})

app.get('/api/dashboard/summary', authMiddleware, (req, res) => {
  const portfolio = getPortfolioByUserId(req.user.sub)
  const totals = portfolio.reduce(
    (acc, position) => {
      const maxRoi =
        position.amount *
        position.investment.roiRange[1] *
        (position.investment.termMonths / 12)
      acc.invested += position.amount
      acc.projectedRoi += maxRoi
      return acc
    },
    { invested: 0, projectedRoi: 0 }
  )

  res.json({
    totalInvested: Math.round(totals.invested),
    projectedRoi: Math.round(totals.projectedRoi),
    positions: portfolio.length,
  })
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

app.get('/api/admin/users', authMiddleware, requireAdmin, (req, res) => {
  res.json({ items: listUsers() })
})

app.get('/api/admin/overview', authMiddleware, requireAdmin, (req, res) => {
  res.json({
    metrics: getMetrics(),
    investments: getInvestments().length,
  })
})

app.listen(port, () => {
  console.log(`NELIAXA API listening on port ${port}`)
})
