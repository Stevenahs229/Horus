import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

const dbPath =
  process.env.DB_PATH || path.join(process.cwd(), 'data', 'neliaxa.sqlite')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    min_amount INTEGER NOT NULL,
    term_months INTEGER NOT NULL,
    roi_min REAL NOT NULL,
    roi_max REAL NOT NULL,
    risk TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    investment_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (investment_id) REFERENCES investments (id)
  );

  CREATE TABLE IF NOT EXISTS performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    value INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(user_id, month),
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`)

const findUserByEmail = db.prepare(
  'SELECT id, email, password_hash, role, created_at FROM users WHERE email = ?'
)
const findUserById = db.prepare(
  'SELECT id, email, role, created_at FROM users WHERE id = ?'
)
const insertUser = db.prepare(
  'INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
)

const insertInvestment = db.prepare(
  `INSERT INTO investments
   (id, name, category, min_amount, term_months, roi_min, roi_max, risk)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
)

const insertPosition = db.prepare(
  'INSERT INTO positions (user_id, investment_id, amount, created_at) VALUES (?, ?, ?, ?)'
)

const insertPerformance = db.prepare(
  'INSERT OR IGNORE INTO performance (user_id, month, value, created_at) VALUES (?, ?, ?, ?)'
)

const investmentSeed = [
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

const ensureUser = (email, password, role) => {
  const existing = findUserByEmail.get(email)
  if (existing) {
    return existing
  }
  const hash = bcrypt.hashSync(password, 10)
  const createdAt = new Date().toISOString()
  insertUser.run(email, hash, role, createdAt)
  return findUserByEmail.get(email)
}

const seedInvestments = () => {
  const count = db.prepare('SELECT COUNT(*) as count FROM investments').get()
  if (count.count > 0) return
  investmentSeed.forEach((item) => {
    insertInvestment.run(
      item.id,
      item.name,
      item.category,
      item.minAmount,
      item.termMonths,
      item.roiRange[0],
      item.roiRange[1],
      item.risk
    )
  })
}

const seedPositions = (userId) => {
  const count = db
    .prepare('SELECT COUNT(*) as count FROM positions WHERE user_id = ?')
    .get(userId)
  if (count.count > 0) return
  const now = new Date().toISOString()
  insertPosition.run(userId, 'green-bonds', 5000, now)
  insertPosition.run(userId, 'startup-growth', 3200, now)
  insertPosition.run(userId, 'real-estate', 7800, now)
}

const seedPerformance = (userId) => {
  const count = db
    .prepare('SELECT COUNT(*) as count FROM performance WHERE user_id = ?')
    .get(userId)
  if (count.count > 0) return
  const base = 12000 + userId * 1200
  const now = new Date()
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now)
    date.setMonth(now.getMonth() - i)
    const month = date.toISOString().slice(0, 7)
    const value = Math.round(base * (1 + (5 - i) * 0.035))
    insertPerformance.run(userId, month, value, new Date().toISOString())
  }
}

export const initializeDatabase = () => {
  seedInvestments()
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@neliaxa.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234'
  const demoEmail = process.env.DEMO_EMAIL || 'demo@neliaxa.com'
  const demoPassword = process.env.DEMO_PASSWORD || 'demo1234'

  const admin = ensureUser(adminEmail, adminPassword, 'admin')
  const demo = ensureUser(demoEmail, demoPassword, 'user')

  seedPositions(demo.id)
  seedPositions(admin.id)
  seedPerformance(demo.id)
  seedPerformance(admin.id)
}

export const getUserByEmail = (email) => findUserByEmail.get(email)
export const getUserById = (id) => findUserById.get(id)

export const createUser = (email, password, role = 'user') => {
  const hash = bcrypt.hashSync(password, 10)
  const createdAt = new Date().toISOString()
  const info = insertUser.run(email, hash, role, createdAt)
  return findUserById.get(info.lastInsertRowid)
}

export const getInvestments = () => {
  const rows = db
    .prepare(
      `SELECT id, name, category, min_amount, term_months, roi_min, roi_max, risk
       FROM investments ORDER BY name`
    )
    .all()
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    minAmount: row.min_amount,
    termMonths: row.term_months,
    roiRange: [row.roi_min, row.roi_max],
    risk: row.risk,
  }))
}

export const getMetrics = () => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get()
  const assets = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM positions').get()
  const alertsTriggered = Math.max(300, Math.round(users.count * 0.15))
  return {
    investorsActive: users.count,
    assetsTrackedEur: assets.total,
    alertsTriggered,
  }
}

export const getPortfolioByUserId = (userId) => {
  const rows = db
    .prepare(
      `SELECT p.id as position_id,
              p.amount,
              p.created_at,
              i.id as investment_id,
              i.name,
              i.category,
              i.min_amount,
              i.term_months,
              i.roi_min,
              i.roi_max,
              i.risk
       FROM positions p
       JOIN investments i ON i.id = p.investment_id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`
    )
    .all(userId)

  return rows.map((row) => ({
    id: row.position_id,
    amount: row.amount,
    createdAt: row.created_at,
    investment: {
      id: row.investment_id,
      name: row.name,
      category: row.category,
      minAmount: row.min_amount,
      termMonths: row.term_months,
      roiRange: [row.roi_min, row.roi_max],
      risk: row.risk,
    },
  }))
}

export const getPerformanceByUserId = (userId) => {
  return db
    .prepare('SELECT month, value FROM performance WHERE user_id = ? ORDER BY month')
    .all(userId)
}

export const listUsers = () => {
  return db
    .prepare('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC')
    .all()
}
