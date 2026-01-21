import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

const dbPath =
  process.env.DB_PATH || path.join(process.cwd(), 'data', 'neliaxa.sqlite')

fs.mkdirSync(path.dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

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

  CREATE TABLE IF NOT EXISTS wallet_accounts (
    user_id INTEGER PRIMARY KEY,
    balance INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS wallet_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`)

const addColumnIfMissing = (table, column, definition) => {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((entry) => entry.name)
  if (!columns.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

addColumnIfMissing('users', 'two_factor_enabled', 'INTEGER NOT NULL DEFAULT 0')
addColumnIfMissing('users', 'two_factor_secret', 'TEXT')

const findUserByEmail = db.prepare(
  `SELECT id,
          email,
          password_hash,
          role,
          created_at,
          two_factor_enabled,
          two_factor_secret
   FROM users WHERE email = ?`
)
const findUserById = db.prepare(
  `SELECT id,
          email,
          role,
          created_at,
          two_factor_enabled,
          two_factor_secret
   FROM users WHERE id = ?`
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

const updateUserRole = db.prepare('UPDATE users SET role = ? WHERE id = ?')
const setTwoFactorSecret = db.prepare(
  'UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0 WHERE id = ?'
)
const enableTwoFactor = db.prepare(
  'UPDATE users SET two_factor_enabled = 1 WHERE id = ?'
)
const disableTwoFactor = db.prepare(
  'UPDATE users SET two_factor_secret = NULL, two_factor_enabled = 0 WHERE id = ?'
)

const updateInvestment = db.prepare(
  `UPDATE investments
   SET name = ?,
       category = ?,
       min_amount = ?,
       term_months = ?,
       roi_min = ?,
       roi_max = ?,
       risk = ?
   WHERE id = ?`
)
const deleteInvestment = db.prepare('DELETE FROM investments WHERE id = ?')
const getInvestmentById = db.prepare(
  'SELECT id, name, category, min_amount, term_months, roi_min, roi_max, risk FROM investments WHERE id = ?'
)
const countPositionsForInvestment = db.prepare(
  'SELECT COUNT(*) as count FROM positions WHERE investment_id = ?'
)

const getWalletAccount = db.prepare(
  'SELECT user_id, balance, updated_at FROM wallet_accounts WHERE user_id = ?'
)
const insertWalletAccount = db.prepare(
  'INSERT INTO wallet_accounts (user_id, balance, updated_at) VALUES (?, ?, ?)'
)
const updateWalletAccount = db.prepare(
  'UPDATE wallet_accounts SET balance = ?, updated_at = ? WHERE user_id = ?'
)
const insertWalletTransaction = db.prepare(
  `INSERT INTO wallet_transactions
   (user_id, amount, type, method, status, created_at)
   VALUES (?, ?, ?, ?, ?, ?)`
)
const listWalletTransactionsStmt = db.prepare(
  `SELECT id, amount, type, method, status, created_at
   FROM wallet_transactions
   WHERE user_id = ?
   ORDER BY created_at DESC
   LIMIT ?`
)
const listWalletsStmt = db.prepare(
  `SELECT u.id,
          u.email,
          u.role,
          w.balance,
          w.updated_at
   FROM wallet_accounts w
   JOIN users u ON u.id = w.user_id
   ORDER BY w.balance DESC`
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

const ensureWalletAccount = (userId, initialBalance = 0) => {
  const account = getWalletAccount.get(userId)
  if (account) return account
  const now = new Date().toISOString()
  insertWalletAccount.run(userId, initialBalance, now)
  return getWalletAccount.get(userId)
}

const seedWalletTransactions = (userId) => {
  ensureWalletAccount(userId)
  const count = db
    .prepare('SELECT COUNT(*) as count FROM wallet_transactions WHERE user_id = ?')
    .get(userId)
  if (count.count > 0) return
  const now = new Date().toISOString()
  insertWalletTransaction.run(userId, 5000, 'deposit', 'bank_transfer', 'completed', now)
  insertWalletTransaction.run(userId, 1200, 'deposit', 'card', 'completed', now)
  updateWalletAccount.run(6200, now, userId)
}

const ensureUser = (email, password, role) => {
  const existing = findUserByEmail.get(email)
  if (existing) {
    return existing
  }
  const hash = bcrypt.hashSync(password, 10)
  const createdAt = new Date().toISOString()
  insertUser.run(email, hash, role, createdAt)
  const user = findUserByEmail.get(email)
  ensureWalletAccount(user.id)
  return user
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

  ensureWalletAccount(demo.id)
  ensureWalletAccount(admin.id)

  seedPositions(demo.id)
  seedPositions(admin.id)
  seedPerformance(demo.id)
  seedPerformance(admin.id)
  seedWalletTransactions(demo.id)
  seedWalletTransactions(admin.id)
}

export const getUserByEmail = (email) => findUserByEmail.get(email)
export const getUserById = (id) => findUserById.get(id)

export const createUser = (email, password, role = 'user') => {
  const hash = bcrypt.hashSync(password, 10)
  const createdAt = new Date().toISOString()
  const info = insertUser.run(email, hash, role, createdAt)
  const user = findUserById.get(info.lastInsertRowid)
  ensureWalletAccount(user.id)
  return user
}

const mapInvestmentRow = (row) => ({
  id: row.id,
  name: row.name,
  category: row.category,
  minAmount: row.min_amount,
  termMonths: row.term_months,
  roiRange: [row.roi_min, row.roi_max],
  risk: row.risk,
})

export const getInvestments = () => {
  const rows = db
    .prepare(
      `SELECT id, name, category, min_amount, term_months, roi_min, roi_max, risk
       FROM investments ORDER BY name`
    )
    .all()
  return rows.map(mapInvestmentRow)
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
    .prepare(
      'SELECT id, email, role, created_at, two_factor_enabled FROM users ORDER BY created_at DESC'
    )
    .all()
}

export const updateUserRoleById = (id, role) => {
  const result = updateUserRole.run(role, id)
  if (result.changes === 0) {
    return null
  }
  return findUserById.get(id)
}

export const setTwoFactorSecretForUser = (id, secret) => {
  setTwoFactorSecret.run(secret, id)
  return findUserById.get(id)
}

export const enableTwoFactorForUser = (id) => {
  enableTwoFactor.run(id)
  return findUserById.get(id)
}

export const disableTwoFactorForUser = (id) => {
  disableTwoFactor.run(id)
  return findUserById.get(id)
}

export const createInvestment = (payload) => {
  insertInvestment.run(
    payload.id,
    payload.name,
    payload.category,
    payload.minAmount,
    payload.termMonths,
    payload.roiRange[0],
    payload.roiRange[1],
    payload.risk
  )
  const row = getInvestmentById.get(payload.id)
  return row ? mapInvestmentRow(row) : null
}

export const updateInvestmentById = (id, payload) => {
  const result = updateInvestment.run(
    payload.name,
    payload.category,
    payload.minAmount,
    payload.termMonths,
    payload.roiRange[0],
    payload.roiRange[1],
    payload.risk,
    id
  )
  if (result.changes === 0) {
    return null
  }
  const row = getInvestmentById.get(id)
  return row ? mapInvestmentRow(row) : null
}

export const deleteInvestmentById = (id) => {
  const count = countPositionsForInvestment.get(id)
  if (count.count > 0) {
    return { deleted: false, reason: 'positions_exist' }
  }
  const result = deleteInvestment.run(id)
  return { deleted: result.changes > 0 }
}

export const getWalletByUserId = (userId, limit = 12) => {
  ensureWalletAccount(userId)
  const account = getWalletAccount.get(userId)
  const transactions = listWalletTransactionsStmt
    .all(userId, limit)
    .map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      type: tx.type,
      method: tx.method,
      status: tx.status,
      createdAt: tx.created_at,
    }))
  return {
    balance: account.balance,
    updatedAt: account.updated_at,
    transactions,
  }
}

export const createWalletTransactionForUser = ({
  userId,
  amount,
  type,
  method,
  status = 'completed',
}) => {
  ensureWalletAccount(userId)
  const account = getWalletAccount.get(userId)
  const newBalance =
    type === 'deposit' ? account.balance + amount : account.balance - amount
  const now = new Date().toISOString()
  const transaction = db.transaction(() => {
    insertWalletTransaction.run(userId, amount, type, method, status, now)
    updateWalletAccount.run(newBalance, now, userId)
    return getWalletAccount.get(userId)
  })()
  return {
    balance: transaction.balance,
    updatedAt: transaction.updated_at,
  }
}

export const listWallets = () => {
  return listWalletsStmt.all()
}
