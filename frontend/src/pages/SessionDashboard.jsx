import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileUp, Sparkles, AlertTriangle, Table, Database, Zap, ArrowLeft } from 'lucide-react'
import { getSession } from '../lib/api'
import { useMigration } from '../context/MigrationContext'

const steps = [
  { num: 1, name: 'Parse', route: '/parse-review', icon: FileUp },
  { num: 2, name: 'Map', route: '/schema-map', icon: Sparkles },
  { num: 3, name: 'Detect', route: '/anomalies', icon: AlertTriangle },
  { num: 4, name: 'Normalize', route: '/generate-sql', icon: Table },
  { num: 5, name: 'Generate SQL', route: '/generate-sql', icon: Database },
  { num: 6, name: 'Deploy', route: '/deploy', icon: Zap }
]

export default function SessionDashboard() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setActiveSession, activeSession } = useMigration()
  const [sessionData, setSessionData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) return
    setActiveSession(sessionId)
  }, [sessionId, setActiveSession])

  useEffect(() => {
    const load = async () => {
      if (!sessionId) return
      try {
        const data = await getSession(sessionId)
        setSessionData(data)
        setError('')
      } catch (e) {
        setError(e?.response?.data?.detail || 'Session not found')
      }
    }
    load()
  }, [sessionId])

  const summary = useMemo(() => {
    const mapping = sessionData?.results?.mapping || {}
    const anomalies = sessionData?.results?.anomalies || {}
    const sql = sessionData?.results?.sql || {}
    return {
      tablesGenerated: sql.table_count || sql.tables_created || 0,
      anomaliesFound: anomalies.top_issues?.length || 0,
      confidence: mapping.average_confidence || 0
    }
  }, [sessionData])

  const currentStep = Number(sessionData?.current_step || activeSession?.currentStep || 0)
  const progress = Math.max(0, Math.min(100, Math.round((currentStep / 6) * 100)))

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-red-300">{error}</p>
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/40 mb-2">Session Dashboard</p>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{sessionData?.file_name || activeSession?.fileName || 'Session'}</h1>
          <p className="text-white/55 text-lg">Detailed view for this single migration session only.</p>
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white/80 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <Metric label="Tables Generated" value={summary.tablesGenerated} />
        <Metric label="Anomalies Found" value={summary.anomaliesFound} />
        <Metric label="Confidence" value={`${summary.confidence}%`} />
      </section>

      <section className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Session Pipeline</h2>
          <span className="text-2xl font-black text-white">{progress}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {steps.map((step) => {
            const done = currentStep >= step.num
            const Icon = step.icon
            return (
              <button
                key={step.num}
                onClick={() => {
                  if (sessionId) setActiveSession(sessionId)
                  navigate(step.route)
                }}
                className="text-center group"
              >
                <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-2 border ${
                  done ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent' : 'bg-white/5 border-white/10'
                }`}>
                  <Icon className={`w-5 h-5 ${done ? 'text-white' : 'text-white/30'}`} />
                </div>
                <p className={`text-xs font-semibold ${done ? 'text-white' : 'text-white/40'}`}>{step.name}</p>
              </button>
            )
          })}
        </div>
      </section>
    </motion.div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
      <p className="text-sm text-white/45 mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  )
}
