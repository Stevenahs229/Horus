import { useEffect, useState } from 'react'
import Topbar from '../components/Topbar'
import { api } from '../lib/api'

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const DashboardWallet = () => {
  const [wallet, setWallet] = useState(null)
  const [status, setStatus] = useState('loading')
  const [depositAmount, setDepositAmount] = useState(500)
  const [depositMethod, setDepositMethod] = useState('bank_transfer')
  const [withdrawAmount, setWithdrawAmount] = useState(250)
  const [withdrawDestination, setWithdrawDestination] = useState('bank_account')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('info')

  const loadWallet = async () => {
    setStatus('loading')
    try {
      const data = await api.wallet()
      setWallet(data)
      setStatus('ready')
    } catch (error) {
      setStatus('error')
    }
  }

  useEffect(() => {
    loadWallet()
  }, [])

  const handleDeposit = async () => {
    setMessage('')
    try {
      const data = await api.walletDeposit({
        amount: Number(depositAmount),
        method: depositMethod,
      })
      setWallet((prev) =>
        prev ? { ...prev, balance: data.balance } : { balance: data.balance }
      )
      setMessage('Deposit completed.')
      setMessageTone('success')
      await loadWallet()
    } catch (error) {
      setMessage('Deposit failed.')
      setMessageTone('error')
    }
  }

  const handleWithdraw = async () => {
    setMessage('')
    try {
      const data = await api.walletWithdraw({
        amount: Number(withdrawAmount),
        destination: withdrawDestination,
      })
      setWallet((prev) =>
        prev ? { ...prev, balance: data.balance } : { balance: data.balance }
      )
      setMessage('Withdrawal completed.')
      setMessageTone('success')
      await loadWallet()
    } catch (error) {
      const messageText =
        error.message === 'insufficient_funds'
          ? 'Insufficient wallet balance.'
          : 'Withdrawal failed.'
      setMessage(messageText)
      setMessageTone('error')
    }
  }

  if (status === 'error') {
    return (
      <div className="glass p-6">
        <p className="text-sm text-rose-200">
          Unable to load wallet. Please refresh.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <Topbar
        title="Wallet"
        subtitle="Simulated deposits and withdrawals for portfolio funding."
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Balance
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {wallet ? currencyFormatter.format(wallet.balance) : '...'}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Last updated:{' '}
            {wallet?.updatedAt
              ? new Date(wallet.updatedAt).toLocaleString('fr-FR')
              : '...'}
          </p>
          {message && (
            <p
              className={`mt-4 text-sm ${
                messageTone === 'success'
                  ? 'text-emerald-200'
                  : messageTone === 'error'
                    ? 'text-rose-200'
                    : 'text-slate-300'
              }`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="card grid gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Add funds
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <input
                type="number"
                min="50"
                value={depositAmount}
                onChange={(event) => setDepositAmount(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
              />
              <select
                value={depositMethod}
                onChange={(event) => setDepositMethod(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
              >
                <option value="bank_transfer">Bank transfer</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile money</option>
              </select>
              <button
                onClick={handleDeposit}
                className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-900"
              >
                Deposit
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Withdraw
            </p>
            <div className="mt-4 grid gap-3 text-sm text-slate-300">
              <input
                type="number"
                min="50"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
              />
              <select
                value={withdrawDestination}
                onChange={(event) => setWithdrawDestination(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
              >
                <option value="bank_account">Bank account</option>
                <option value="mobile_money">Mobile money</option>
                <option value="crypto_wallet">Crypto wallet</option>
              </select>
              <button
                onClick={handleWithdraw}
                className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-white">Recent transactions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3">Type</th>
                <th className="py-3">Method</th>
                <th className="py-3">Amount</th>
                <th className="py-3">Status</th>
                <th className="py-3">Date</th>
              </tr>
            </thead>
            <tbody>
                {wallet?.transactions?.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5">
                  <td className="py-3 text-white">{tx.type}</td>
                  <td className="py-3">{tx.method}</td>
                  <td className="py-3">
                    {currencyFormatter.format(tx.amount)}
                  </td>
                  <td className="py-3">{tx.status}</td>
                  <td className="py-3">
                    {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {!wallet?.transactions?.length && status === 'ready' && (
                <tr>
                  <td className="py-3 text-slate-400" colSpan={5}>
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DashboardWallet
