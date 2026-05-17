import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cloud, Check, Loader2, ExternalLink, Database, HardDrive, Download } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'
import { deployToEnv, deployToPostgres, getUserSettings } from '../lib/api'

const RENDER_DASHBOARD_URL = import.meta.env.VITE_RENDER_DASHBOARD_URL || 'https://dashboard.render.com/databases'

const providerMeta = {
  postgresql: { label: 'PostgreSQL', icon: Database },
  render: { label: 'Render Postgres', icon: Cloud },
  supabase: { label: 'Supabase Postgres', icon: Cloud },
  neon: { label: 'Neon Postgres', icon: Cloud },
  custom_postgresql: { label: 'Custom PostgreSQL', icon: Database },
  custom_mysql: { label: 'Custom MySQL', icon: Database },
  railway: { label: 'Railway Postgres', icon: Cloud },
  access: { label: 'Microsoft Access (SQL export)', icon: HardDrive }
}

export default function Deploy() {
  const navigate = useNavigate()
  const { stats, setStepWithSession, updateSessionMeta } = useMigration()
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [result, setResult] = useState(null)
  const [settings, setSettings] = useState({})
  const [error, setError] = useState('')
  const [deployProgress, setDeployProgress] = useState(0)
  const [showCredentialModal, setShowCredentialModal] = useState(false)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await getUserSettings()
        setSettings(res?.settings || {})
      } catch {
        setSettings({})
      }
    }
    loadSettings()
  }, [])

  const provider = settings.databaseProvider || settings.defaultDatabase || 'postgresql'
  const providerInfo = providerMeta[provider] || providerMeta.postgresql
  const ProviderIcon = providerInfo.icon

  const canDeployDirectly = provider !== 'access' && provider !== 'custom_mysql'
  const savedConnection = String(settings.databaseUrl || '').trim()
  const hasApiCredentials = Boolean(settings.providerApiKey && settings.providerProjectId)
  const requiresApiCredentials = provider === 'supabase' || provider === 'neon'
  const requiresConnectionUrl = provider === 'supabase' || provider === 'neon' || provider === 'custom_postgresql'
  const missingApiCreds = requiresApiCredentials && !hasApiCredentials
  const missingConnection = requiresConnectionUrl && !savedConnection
  const missingCredentialReason = missingApiCreds
    ? `Add ${providerInfo.label} API key and project ID in your profile before deploying.`
    : (missingConnection ? 'Add your database connection string in profile before deploying.' : '')

  const deploy = async () => {
    let effectiveSettings = settings
    try {
      const fresh = await getUserSettings()
      effectiveSettings = fresh?.settings || settings
      setSettings(effectiveSettings)
    } catch {
      effectiveSettings = settings
    }

    const effectiveProvider = effectiveSettings.databaseProvider || effectiveSettings.defaultDatabase || 'postgresql'
    const effectiveSavedConnection = String(effectiveSettings.databaseUrl || '').trim()
    const effectiveMissingApiCreds = (effectiveProvider === 'supabase' || effectiveProvider === 'neon') &&
      !(effectiveSettings.providerApiKey && effectiveSettings.providerProjectId)
    const effectiveMissingConnection = (effectiveProvider === 'supabase' || effectiveProvider === 'neon' || effectiveProvider === 'custom_postgresql') &&
      !effectiveSavedConnection
    const effectiveCanDeployDirectly = effectiveProvider !== 'access' && effectiveProvider !== 'custom_mysql'
    const effectiveMissingReason = effectiveMissingApiCreds
      ? `Add ${(providerMeta[effectiveProvider] || providerInfo).label} API key and project ID in your profile before deploying.`
      : (effectiveMissingConnection ? 'Add your database connection string in profile before deploying.' : '')

    if (!stats.sessionId) {
      setError('Please complete previous steps first.')
      return
    }
    if (effectiveMissingReason) {
      setError(effectiveMissingReason)
      setShowCredentialModal(true)
      return
    }
    setDeploying(true)
    setDeployProgress(0)
    setError('')
    const start = Date.now()
    const progressTimer = setInterval(() => {
      setDeployProgress((prev) => Math.min(96, prev + 2))
    }, 140)
    try {
      let response
      if (!effectiveCanDeployDirectly) {
        setError('Microsoft Access uses SQL export. Download SQL and import it into Access.')
        return
      }
      if (effectiveSavedConnection) {
        response = await deployToPostgres(stats.sessionId, {
          database_url: effectiveSavedConnection,
          db_password: effectiveSettings.dbPassword || null,
          provider_api_key: effectiveSettings.providerApiKey || null,
          provider_project_id: effectiveSettings.providerProjectId || null
        })
      } else {
        response = await deployToEnv(stats.sessionId, {
          db_password: effectiveSettings.dbPassword || null,
          provider_api_key: effectiveSettings.providerApiKey || null,
          provider_project_id: effectiveSettings.providerProjectId || null
        })
      }
      const elapsed = Date.now() - start
      if (elapsed < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 5000 - elapsed))
      }
      setDeployProgress(100)
      const deployData = response?.data || response
      setResult(deployData)
      const success = Boolean(deployData?.success)
      setDeployed(success)
      if (success) {
        setStepWithSession(6, { status: 'deployed', provider: effectiveProvider })
        updateSessionMeta(stats.sessionId, { deployed: true, provider: effectiveProvider })
      } else {
        const deployMessage = deployData?.message || (Array.isArray(deployData?.errors) ? deployData.errors.join(', ') : '') || 'Deployment could not be completed.'
        setError(deployMessage)
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Deployment failed')
    } finally {
      clearInterval(progressTimer)
      setDeploying(false)
    }
  }

  const tableCount = useMemo(() => {
    if (!result) return 0
    const tables = result.tables_created
    if (Array.isArray(tables)) return tables.length
    if (typeof tables === 'number') return tables
    return 0
  }, [result])

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Deploy to Database</h1>
        <p className="text-lg text-white/50 font-medium">
          Target: {providerInfo.label}
        </p>
      </header>

      <section className={`rounded-3xl p-10 md:p-14 text-center ${deployed ? 'bg-green-500/5 border border-green-500/20' : 'bg-white/[0.02] border border-white/[0.08]'}`}>
        {deployed ? (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">Deployment Successful</h2>
              <p className="text-white/60">
                {tableCount} tables created {result?.records_inserted ? `• ${result.records_inserted} records inserted` : ''}
              </p>
            </div>
            <a
              href={RENDER_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-400 transition-colors"
            >
              Open Database Dashboard
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
              <ProviderIcon className="w-10 h-10 text-white/60" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">{providerInfo.label}</h2>
              <p className="text-white/50">
                {canDeployDirectly
                  ? (savedConnection ? 'Using your saved connection details from profile.' : 'Using server DATABASE_URL or default deployment connection.')
                  : 'This provider currently uses SQL export instead of direct API deployment.'}
              </p>
            </div>
            {deploying && (
              <div className="max-w-sm mx-auto w-full space-y-2">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all" style={{ width: `${deployProgress}%` }} />
                </div>
                <p className="text-sm text-white/55">{deployProgress}% deployment sync</p>
              </div>
            )}

            {canDeployDirectly ? (
              <button
                onClick={deploy}
                disabled={deploying}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-50"
              >
                {deploying ? <Loader2 className="w-6 h-6 animate-spin" /> : <Cloud className="w-6 h-6" />}
                {deploying ? 'Deploying...' : 'Deploy Now'}
              </button>
            ) : (
              <a
                href={`/generate-sql`}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold text-lg rounded-2xl hover:bg-white/90 transition-colors"
              >
                <Download className="w-6 h-6" />
                Download SQL for Access
              </a>
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/30 text-red-300">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard label="Provider" value={providerInfo.label} />
        <InfoCard label="Connection" value={savedConnection ? 'Custom URL configured' : 'Server env fallback'} />
        <InfoCard label="Session" value={stats.sessionId || 'None'} />
      </section>

      {showCredentialModal && (
        <div className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0d0d10] border border-white/10 p-6">
            <h3 className="text-xl font-black text-white mb-2">Database credentials required</h3>
            <p className="text-white/65 mb-5">
              {error || missingCredentialReason || 'Please add your database connection details in profile before deploying this session.'}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCredentialModal(false)}
                className="px-4 py-2 rounded-xl border border-white/15 text-white/80 hover:text-white hover:bg-white/5"
              >
                Not now
              </button>
              <button
                onClick={() => {
                  setShowCredentialModal(false)
                  navigate('/profile')
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold"
              >
                Add it right now
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
      <p className="text-sm text-white/40 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  )
}
