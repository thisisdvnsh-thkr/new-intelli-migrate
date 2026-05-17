import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowRight } from 'lucide-react'
import { forgotPassword } from '../lib/api'
import BrandLogo from '../components/BrandLogo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.detail || 'Could not send reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/[0.03] border border-white/10">
        <div className="flex justify-center mb-8"><BrandLogo /></div>
        <h1 className="text-2xl font-black text-white mb-2">Forgot password</h1>
        <p className="text-white/55 mb-6">Enter your account email to receive a secure reset link.</p>
        <form onSubmit={submit} className="space-y-4">
          {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">{error}</div>}
          {done && <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/25 text-green-300 text-sm">Reset link sent if this email exists.</div>}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white"
              placeholder="Email address"
            />
          </div>
          <button disabled={loading} className="w-full py-3 rounded-xl bg-white text-black font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? 'Sending...' : <>Send reset link <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
        <p className="mt-6 text-sm text-white/50">Back to <Link className="text-blue-300" to="/login">Login</Link></p>
      </div>
    </div>
  )
}
