import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMe, setAuthToken } from '../lib/api'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [status, setStatus] = useState('Processing sign in...')
  const [error, setError] = useState('')

  useEffect(() => {
    const finalizeLogin = async () => {
      const token = searchParams.get('token')
      const oauthError = searchParams.get('oauth_error')

      if (oauthError) {
        setError(decodeURIComponent(oauthError))
        setStatus('OAuth login failed')
        return
      }

      if (!token) {
        setError('Missing OAuth token')
        setStatus('OAuth login failed')
        return
      }

      try {
        setAuthToken(token)
        const me = await getMe()
        login(me, token)
        setStatus('Login successful! Redirecting...')
        setTimeout(() => navigate('/dashboard'), 700)
      } catch (e) {
        setError('Failed to complete OAuth login')
        setStatus('OAuth login failed')
      }
    }

    finalizeLogin()
  }, [searchParams, navigate, login])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/[0.03] border border-white/10 text-center">
        {error ? (
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        ) : status.includes('successful') ? (
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
        ) : (
          <Loader2 className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
        )}
        <h1 className="text-2xl font-bold text-white mb-2">OAuth Sign In</h1>
        <p className="text-white/60">{status}</p>
        {error && (
          <button
            onClick={() => navigate('/login')}
            className="mt-6 px-5 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-colors"
          >
            Back to Login
          </button>
        )}
      </div>
    </div>
  )
}
