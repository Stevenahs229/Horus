import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import { z } from 'zod'
import {
  createInvestment,
  createUser,
  createWalletTransactionForUser,
  deleteInvestmentById,
  getInvestments,
  getMetrics,
  getPerformanceByUserId,
  getPortfolioByUserId,
  getUserByEmail,
  getUserById,
  getWalletByUserId,
  initializeDatabase,
  listUsers,
  listWallets,
  setTwoFactorSecretForUser,
  disableTwoFactorForUser,
  enableTwoFactorForUser,
  updateInvestmentById,
  updateUserRoleById,
} from './db.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 4000
const clientOrigin = process.env.CLIENT_ORIGIN || '*'
const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_me'
const appName = process.env.APP_NAME || 'NeliAxa'

initializeDatabase()

const corsOptions =
  clientOrigin === '*' ? {} : { origin: clientOrigin, credentials: true }

app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))

const rolePermissions = {
  admin: ['*'],
  manager: ['investments:read', 'investments:write', 'metrics:read', 'users:read', 'wallets:read'],
  support: ['users:read', 'wallets:read'],
  user: [],
}

const hasPermission = (role, permission) => {
  const permissions = rolePermissions[role] || []
  return permissions.includes('*') || permissions.includes(permission)
}

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  twoFactorEnabled: Boolean(user.two_factor_enabled),
})

const adminUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.created_at,
  twoFactorEnabled: Boolean(user.two_factor_enabled),
})

const signToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '7d' }
  )

const signTwoFactorToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role, tfa: true },
    jwtSecret,
    { expiresIn: '10m' }
  )

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing_token' })
  }
  try {
    const payload = jwt.verify(token, jwtSecret)
    if (payload.tfa) {
      return res.status(401).json({ error: 'two_factor_required' })
    }
    req.user = payload
    return next()
  } catch (error) {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

const twoFactorMiddleware = (req, res, next) => {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing_token' })
  }
  try {
    const payload = jwt.verify(token, jwtSecret)
    if (!payload.tfa) {
      return res.status(401).json({ error: 'invalid_token' })
    }
    req.user = payload
    return next()
  } catch (error) {
    return res.status(401).json({ error: 'invalid_token' })
  }
}

const requirePermission = (permission) => (req, res, next) => {
  if (!hasPermission(req.user?.role, permission)) {
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
    user: publicUser(user),
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

  if (user.two_factor_enabled) {
    const tempToken = signTwoFactorToken(user)
    return res.json({
      requires2fa: true,
      tempToken,
    })
  }

  const token = signToken(user)
  return res.json({
    token,
    user: publicUser(user),
  })
})

app.post('/api/auth/2fa/verify', twoFactorMiddleware, (req, res) => {
  const schema = z.object({
    token: z.string().min(6),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload' })
  }

  const user = getUserById(req.user.sub)
  if (!user || !user.two_factor_secret) {
    return res.status(404).json({ error: 'user_not_found' })
  }

  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: parsed.data.token,
    window: 1,
  })

  if (!verified) {
    return res.status(401).json({ error: 'invalid_token' })
  }

  const token = signToken(user)
  return res.json({
    token,
    user: publicUser(user),
  })
})

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = getUserById(req.user.sub)
  if (!user) {
    return res.status(404).json({ error: 'user_not_found' })
  }
  return res.json({ user: publicUser(user) })
})

app.post('/api/2fa/setup', authMiddleware, (req, res) => {
  const user = getUserById(req.user.sub)
  if (!user) {
    return res.status(404).json({ error: 'user_not_found' })
  }

  const secret = speakeasy.generateSecret({
    name: `${appName} (${user.email})`,
    issuer: appName,
  })

  setTwoFactorSecretForUser(user.id, secret.base32)

  return res.json({
    otpauthUrl: secret.otpauth_url,
    secret: secret.base32,
  })
})

app.post('/api/2fa/confirm', authMiddleware, (req, res) => {
  const schema = z.object({
    token: z.string().min(6),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload' })
  }

  const user = getUserById(req.user.sub)
  if (!user || !user.two_factor_secret) {
    return res.status(404).json({ error: 'user_not_found' })
  }

  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: parsed.data.token,
    window: 1,
  })

  if (!verified) {
    return res.status(401).json({ error: 'invalid_token' })
  }

  const updated = enableTwoFactorForUser(user.id)
  return res.json({ user: publicUser(updated) })
})

app.post('/api/2fa/disable', authMiddleware, (req, res) => {
  const schema = z.object({
    token: z.string().min(6),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload' })
  }

  const user = getUserById(req.user.sub)
  if (!user || !user.two_factor_secret) {
    return res.status(404).json({ error: 'user_not_found' })
  }

  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: parsed.data.token,
    window: 1,
  })

  if (!verified) {
    return res.status(401).json({ error: 'invalid_token' })
  }

  const updated = disableTwoFactorForUser(user.id)
  return res.json({ user: publicUser(updated) })
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

app.get('/api/wallet', authMiddleware, (req, res) => {
  const wallet = getWalletByUserId(req.user.sub, 12)
  res.json(wallet)
})

app.post('/api/wallet/deposit', authMiddleware, (req, res) => {
  const schema = z.object({
    amount: z.coerce.number().int().positive(),
    method: z.string().min(2),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload' })
  }

  const updated = createWalletTransactionForUser({
    userId: req.user.sub,
    amount: parsed.data.amount,
    type: 'deposit',
    method: parsed.data.method,
  })

  return res.json(updated)
})

app.post('/api/wallet/withdraw', authMiddleware, (req, res) => {
  const schema = z.object({
    amount: z.coerce.number().int().positive(),
    destination: z.string().min(2),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_payload' })
  }

  const wallet = getWalletByUserId(req.user.sub, 1)
  if (parsed.data.amount > wallet.balance) {
    return res.status(400).json({ error: 'insufficient_funds' })
  }

  const updated = createWalletTransactionForUser({
    userId: req.user.sub,
    amount: parsed.data.amount,
    type: 'withdraw',
    method: parsed.data.destination,
  })

  return res.json(updated)
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

app.get(
  '/api/admin/users',
  authMiddleware,
  requirePermission('users:read'),
  (req, res) => {
    res.json({ items: listUsers().map(adminUser) })
  }
)

app.put(
  '/api/admin/users/:id/role',
  authMiddleware,
  requirePermission('users:write'),
  (req, res) => {
    const schema = z.object({
      role: z.enum(['admin', 'manager', 'support', 'user']),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_payload' })
    }

    const userId = Number(req.params.id)
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: 'invalid_user' })
    }

    const updated = updateUserRoleById(userId, parsed.data.role)
    if (!updated) {
      return res.status(404).json({ error: 'user_not_found' })
    }

    return res.json({ user: adminUser(updated) })
  }
)

app.get(
  '/api/admin/overview',
  authMiddleware,
  requirePermission('metrics:read'),
  (req, res) => {
    res.json({
      metrics: getMetrics(),
      investments: getInvestments().length,
    })
  }
)

app.get(
  '/api/admin/investments',
  authMiddleware,
  requirePermission('investments:read'),
  (req, res) => {
    res.json({ items: getInvestments() })
  }
)

app.post(
  '/api/admin/investments',
  authMiddleware,
  requirePermission('investments:write'),
  (req, res) => {
    const schema = z.object({
      id: z.string().optional(),
      name: z.string().min(3),
      category: z.string().min(2),
      minAmount: z.coerce.number().int().positive(),
      termMonths: z.coerce.number().int().positive(),
      roiMin: z.coerce.number().min(0).max(1),
      roiMax: z.coerce.number().min(0).max(1),
      risk: z.enum(['Low', 'Medium', 'High']),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_payload' })
    }
    if (parsed.data.roiMin > parsed.data.roiMax) {
      return res.status(400).json({ error: 'invalid_roi_range' })
    }

    const id = parsed.data.id || crypto.randomUUID()
    try {
      const investment = createInvestment({
        id,
        name: parsed.data.name,
        category: parsed.data.category,
        minAmount: parsed.data.minAmount,
        termMonths: parsed.data.termMonths,
        roiRange: [parsed.data.roiMin, parsed.data.roiMax],
        risk: parsed.data.risk,
      })

      if (!investment) {
        return res.status(500).json({ error: 'create_failed' })
      }
      return res.status(201).json({ investment })
    } catch (error) {
      return res.status(409).json({ error: 'investment_exists' })
    }
  }
)

app.put(
  '/api/admin/investments/:id',
  authMiddleware,
  requirePermission('investments:write'),
  (req, res) => {
    const schema = z.object({
      name: z.string().min(3),
      category: z.string().min(2),
      minAmount: z.coerce.number().int().positive(),
      termMonths: z.coerce.number().int().positive(),
      roiMin: z.coerce.number().min(0).max(1),
      roiMax: z.coerce.number().min(0).max(1),
      risk: z.enum(['Low', 'Medium', 'High']),
    })
    const parsed = schema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'invalid_payload' })
    }
    if (parsed.data.roiMin > parsed.data.roiMax) {
      return res.status(400).json({ error: 'invalid_roi_range' })
    }

    const updated = updateInvestmentById(req.params.id, {
      name: parsed.data.name,
      category: parsed.data.category,
      minAmount: parsed.data.minAmount,
      termMonths: parsed.data.termMonths,
      roiRange: [parsed.data.roiMin, parsed.data.roiMax],
      risk: parsed.data.risk,
    })
    if (!updated) {
      return res.status(404).json({ error: 'investment_not_found' })
    }

    return res.json({ investment: updated })
  }
)

app.delete(
  '/api/admin/investments/:id',
  authMiddleware,
  requirePermission('investments:write'),
  (req, res) => {
    const result = deleteInvestmentById(req.params.id)
    if (!result.deleted && result.reason === 'positions_exist') {
      return res.status(409).json({ error: 'positions_exist' })
    }
    if (!result.deleted) {
      return res.status(404).json({ error: 'investment_not_found' })
    }
    return res.status(204).send()
  }
)

app.get(
  '/api/admin/wallets',
  authMiddleware,
  requirePermission('wallets:read'),
  (req, res) => {
    res.json({
      items: listWallets().map((wallet) => ({
        id: wallet.id,
        email: wallet.email,
        role: wallet.role,
        balance: wallet.balance,
        updatedAt: wallet.updated_at,
      })),
    })
  }
)

app.listen(port, () => {
  console.log(`NELIAXA API listening on port ${port}`)
})
