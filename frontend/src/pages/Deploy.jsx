import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Cloud, Check, Loader2, ExternalLink, Database, HardDrive, Download } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'
import { deployToEnv, deployToPostgres, getUserSettings } from '../lib/api'
import { useLanguage } from '../context/LanguageContext'

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
  const { t } = useLanguage()
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [result, setResult] = useState(null)
  const [settings, setSettings] = useState({})
  const [error, setError] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('') // added for inline success feedback
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
  const providerLabel = t(providerInfo.label)

  const canDeployDirectly = provider !== 'access' && provider !== 'custom_mysql'
  const savedConnection = String(settings.databaseUrl || '').trim()
  const hasApiCredentials = Boolean(settings.providerApiKey && settings.providerProjectId)
  const requiresApiCredentials = provider === 'supabase' || provider === 'neon'
  const requiresConnectionUrl = provider === 'supabase' || provider === 'neon' || provider === 'custom_postgresql'
  const missingApiCreds = requiresApiCredentials && !hasApiCredentials
  const missingConnection = requiresConnectionUrl && !savedConnection
  const missingCredentialReason = missingApiCreds
    ? t('Add {provider} API key and project ID in your profile before deploying.').replace('{provider}', providerLabel)
    : (missingConnection ? t('Add your database connection string in profile before deploying.') : '')

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
    const effectiveProviderInfo = providerMeta[effectiveProvider] || providerInfo
    const effectiveProviderLabel = t(effectiveProviderInfo.label)
    const effectiveMissingApiCreds = (effectiveProvider === 'supabase' || effectiveProvider === 'neon') &&
      !(effectiveSettings.providerApiKey && effectiveSettings.providerProjectId)
    const effectiveMissingConnection = (effectiveProvider === 'supabase' || effectiveProvider === 'neon' || effectiveProvider === 'custom_postgresql') &&
      !effectiveSavedConnection
    const effectiveCanDeployDirectly = effectiveProvider !== 'access' && effectiveProvider !== 'custom_mysql'
    const effectiveMissingReason = effectiveMissingApiCreds
      ? t('Add {provider} API key and project ID in your profile before deploying.').replace('{provider}', effectiveProviderLabel)
      : (effectiveMissingConnection ? t('Add your database connection string in profile before deploying.') : '')

    if (!stats.sessionId) {
      setError(t('Please complete previous steps first.'))
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
        setError(t('Microsoft Access uses SQL export. Download SQL and import it into Access.'))
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
        setConnectionStatus(t('Database connection established successfully.')) // success feedback
        setStepWithSession(6, { status: 'deployed', provider: effectiveProvider })
        updateSessionMeta(stats.sessionId, { deployed: true, provider: effectiveProvider })
      } else {
        const deployMessage = deployData?.message || (Array.isArray(deployData?.errors) ? deployData.errors.join(', ') : '') || t('Deployment could not be completed.')
        setError(deployMessage)
        setConnectionStatus('') // clear any previous success message
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || t('Deployment failed'))
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

  const tablesCreatedText = t('{count} tables created').replace('{count}', tableCount)
  const recordsInsertedText = result?.records_inserted
    ? `• ${t('{count} records inserted').replace('{count}', result.records_inserted)}`
    : ''

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">{t('Deploy to Database')}</h1>
        <p className="text-lg text-white/50 font-medium">
          {t('Target')}: {providerLabel}
        </p>
      </header>

      <section className={`agent-card text-center ${deployed ? 'bg-green-500/5 border border-green-500/20' : ''}`}>
        {deployed ? (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-green-500/20 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">{t('Deployment Successful')}</h2>
              <p className="text-white/60">
                {tablesCreatedText} {recordsInsertedText}
              </p>
            </div>
            <a
              href={RENDER_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-400 transition-colors"
            >
              {t('Open Database Dashboard')}
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
              <ProviderIcon className="w-10 h-10 text-white/60" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">{providerLabel}</h2>
              <p className="text-white/50">
                {canDeployDirectly
                  ? (savedConnection ? t('Using your saved connection details from profile.') : t('Using server DATABASE_URL or default deployment connection.'))
                  : t('This provider currently uses SQL export instead of direct API deployment.')}
              </p>
            </div>
            {deploying && (
              <div className="max-w-sm mx-auto w-full space-y-2">
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all" style={{ width: `${deployProgress}%` }} />
                </div>
                <p className="text-sm text-white/55">{t('{progress}% deployment sync').replace('{progress}', deployProgress)}</p>
                <div className="space-y-2">
                  <div className="h-3 rounded-full skeleton" />
                  <div className="h-3 rounded-full skeleton w-4/5" />
                </div>
              </div>
            )}

            {canDeployDirectly ? (
              <div className="agent-card-actions justify-center">
                <button
                  onClick={deploy}
                  disabled={deploying}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all disabled:opacity-50"
                >
                  {deploying ? <Loader2 className="w-6 h-6 animate-spin" /> : <Cloud className="w-6 h-6" />}
                  {deploying ? t('Deploying...') : t('Deploy Now')}
                </button>
              </div>
            ) : (
              <div className="agent-card-actions justify-center">
                <a
                  href={`/generate-sql`}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold text-lg rounded-2xl hover:bg-white/90 transition-colors"
                >
                  <Download className="w-6 h-6" />
                  {t('Download SQL for Access')}
                </a>
              </div>
            )}
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-2xl p-4 bg-red-500/10 border border-red-500/30 text-red-300">
          {error}
        </div>
      )}
      {connectionStatus && (
        <div className="rounded-2xl p-4 bg-green-500/10 border border-green-500/30 text-green-300">
          {connectionStatus}
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard label={t('Provider')} value={providerLabel} />
        <InfoCard label={t('Connection')} value={savedConnection ? t('Custom URL configured') : t('Server env fallback')} />
        <InfoCard label={t('Session')} value={stats.sessionId || t('None')} />
      </section>

      {showCredentialModal && (
        <div className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0d0d10] border border-white/10 p-6">
            <h3 className="text-xl font-black text-white mb-2">{t('Database credentials required')}</h3>
            <p className="text-white/65 mb-5">
              {error || missingCredentialReason || t('Please add your database connection details in profile before deploying this session.')}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCredentialModal(false)}
                className="px-4 py-2 rounded-xl border border-white/15 text-white/80 hover:text-white hover:bg-white/5"
              >
                {t('Not now')}
              </button>
              <button
                onClick={() => {
                  setShowCredentialModal(false)
                  navigate('/profile')
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold"
              >
                {t('Add it right now')}
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
    <div className="p-6 rounded-3xl glass-surface transition-transform duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]">
      <p className="text-sm text-white/40 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  )
}
