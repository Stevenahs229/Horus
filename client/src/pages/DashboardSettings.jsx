import { useState } from 'react'
import QRCode from 'qrcode'
import Topbar from '../components/Topbar'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

const DashboardSettings = () => {
  const { user, refreshUser } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [setupSecret, setSetupSecret] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [twoFactorStatus, setTwoFactorStatus] = useState('idle')
  const [twoFactorMessage, setTwoFactorMessage] = useState('')
  const messageClass =
    twoFactorStatus === 'success' ? 'text-emerald-200' : 'text-rose-200'

  const handleSetupTwoFactor = async () => {
    setTwoFactorStatus('loading')
    setTwoFactorMessage('')
    try {
      const data = await api.setupTwoFactor()
      const qrImage = await QRCode.toDataURL(data.otpauthUrl)
      setSetupSecret(data.secret)
      setQrCode(qrImage)
      setTwoFactorStatus('ready')
    } catch (error) {
      setTwoFactorMessage('Unable to start 2FA setup.')
      setTwoFactorStatus('error')
    }
  }

  const handleConfirmTwoFactor = async () => {
    setTwoFactorStatus('loading')
    setTwoFactorMessage('')
    try {
      await api.confirmTwoFactor({ token: twoFactorCode })
      setSetupSecret('')
      setQrCode('')
      setTwoFactorCode('')
      await refreshUser()
      setTwoFactorStatus('success')
      setTwoFactorMessage('Two-factor authentication enabled.')
    } catch (error) {
      setTwoFactorStatus('error')
      setTwoFactorMessage('Invalid verification code.')
    }
  }

  const handleDisableTwoFactor = async () => {
    setTwoFactorStatus('loading')
    setTwoFactorMessage('')
    try {
      await api.disableTwoFactor({ token: twoFactorCode })
      setSetupSecret('')
      setQrCode('')
      setTwoFactorCode('')
      await refreshUser()
      setTwoFactorStatus('success')
      setTwoFactorMessage('Two-factor authentication disabled.')
    } catch (error) {
      setTwoFactorStatus('error')
      setTwoFactorMessage('Invalid verification code.')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Topbar
        title="Settings"
        subtitle="Customize alerts, security, and account access."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white">Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Manage your credentials and profile details.
          </p>
          <div className="mt-6 grid gap-3 text-sm text-slate-300">
            <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              Email: <span className="text-white">{user?.email}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              Role: <span className="text-white">{user?.role}</span>
            </div>
          </div>
        </div>

        <div className="glass p-6">
          <h2 className="text-lg font-semibold text-white">Preferences</h2>
          <div className="mt-4 grid gap-4 text-sm text-slate-300">
            <label className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              <span>Personalized notifications</span>
              <input
                type="checkbox"
                checked={notifications}
                onChange={() => setNotifications((prev) => !prev)}
                className="h-4 w-4 accent-cyan-400"
              />
            </label>
            <div className="rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
              <div className="flex items-center justify-between">
                <span>Two-factor authentication</span>
                <span className="text-xs text-slate-400">
                  {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {!user?.twoFactorEnabled && !setupSecret && (
                  <button
                    onClick={handleSetupTwoFactor}
                    className="rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-900"
                    disabled={twoFactorStatus === 'loading'}
                  >
                    {twoFactorStatus === 'loading'
                      ? 'Preparing...'
                      : 'Enable 2FA'}
                  </button>
                )}
                {!user?.twoFactorEnabled && setupSecret && (
                  <>
                    <div className="grid gap-3 text-xs text-slate-400">
                      <p>Scan the QR code with your authenticator app.</p>
                      {qrCode && (
                        <img
                          src={qrCode}
                          alt="2FA QR code"
                          className="h-32 w-32 rounded-lg border border-white/10 bg-white p-2"
                        />
                      )}
                      <p>Manual key: {setupSecret}</p>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={twoFactorCode}
                      onChange={(event) => setTwoFactorCode(event.target.value)}
                      placeholder="Enter verification code"
                      className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
                    />
                    <button
                      onClick={handleConfirmTwoFactor}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80"
                      disabled={twoFactorStatus === 'loading'}
                    >
                      Confirm 2FA
                    </button>
                  </>
                )}
                {user?.twoFactorEnabled && (
                  <>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={twoFactorCode}
                      onChange={(event) => setTwoFactorCode(event.target.value)}
                      placeholder="Enter code to disable"
                      className="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-white"
                    />
                    <button
                      onClick={handleDisableTwoFactor}
                      className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80"
                      disabled={twoFactorStatus === 'loading'}
                    >
                      Disable 2FA
                    </button>
                  </>
                )}
                {twoFactorMessage && (
                  <p className={`text-xs ${messageClass}`}>{twoFactorMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardSettings
