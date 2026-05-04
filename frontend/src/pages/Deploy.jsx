import { useEffect, useMemo, useState } from 'react'
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
  railway: { label: 'Railway Postgres', icon: Cloud },
  access: { label: 'Microsoft Access (SQL export)', icon: HardDrive }
}

export default function Deploy() {
  const { stats, setStepWithSession, updateSessionMeta } = useMigration()
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [result, setResult] = useState(null)
  const [settings, setSettings] = useState({})
  const [error, setError] = useState('')

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

  const canDeployDirectly = provider !== 'access'
  const savedConnection = settings.databaseUrl || ''

  const deploy = async () => {
    if (!stats.sessionId) {
      setError('Please complete previous steps first.')
      return
    }
    setDeploying(true)
    setError('')
    try {
      let response
      if (!canDeployDirectly) {
        setError('Microsoft Access uses SQL export. Download SQL and import it into Access.')
        return
      }
      if (savedConnection) {
        response = await deployToPostgres(stats.sessionId, {
          database_url: savedConnection,
          db_password: settings.dbPassword || null
        })
      } else {
        response = await deployToEnv(stats.sessionId, { db_password: settings.dbPassword || null })
      }
      setResult(response?.data || response)
      setDeployed(Boolean((response?.data || response)?.success))
      setStepWithSession(6, { status: 'deployed', provider })
      updateSessionMeta(stats.sessionId, { deployed: true, provider })
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Deployment failed')
    } finally {
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
                  ? (savedConnection ? 'Using your saved connection string from Settings.' : 'Using server DATABASE_URL or default deployment connection.')
                  : 'Access connection uses SQL export instead of direct API deployment.'}
              </p>
            </div>

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
