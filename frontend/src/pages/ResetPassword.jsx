import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { resetPassword } from '../lib/api'
import BrandLogo from '../components/BrandLogo'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const token = searchParams.get('token') || ''

  const submit = async (e) => {
    e.preventDefault()
    if (!token) {
      setError('Reset token is missing.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword(token, password)
      navigate('/login')
    } catch (err) {
      setError(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Password reset failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/[0.03] border border-white/10">
        <div className="flex justify-center mb-8"><BrandLogo /></div>
        <h1 className="text-2xl font-black text-white mb-2">Reset password</h1>
        <p className="text-white/55">Set a new secure password for your account.</p>
        <ul className="mt-3 mb-6 space-y-1 text-sm text-white/45">
          <li>Use at least 8 characters.</li>
          <li>Mix letters, numbers, and symbols.</li>
          <li>Avoid reusing an old password.</li>
        </ul>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">{error}</div>}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
              placeholder="New password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
              placeholder="Confirm password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button disabled={loading} className="w-full py-3 rounded-xl bg-white text-black font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? 'Updating...' : <>Reset password <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
        <p className="mt-6 text-sm text-white/50">Back to <Link className="text-blue-300" to="/login">Login</Link></p>
      </div>
    </div>
  )
}
