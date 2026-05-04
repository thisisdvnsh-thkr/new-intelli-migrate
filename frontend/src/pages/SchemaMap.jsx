import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { mapSchema } from '../lib/api'
import { ArrowRight, Sparkles, CheckCircle2, AlertCircle, XCircle, Info, Loader2 } from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export default function SchemaMap() {
  const navigate = useNavigate()
  const { stats, updateStats, setStepWithSession, updateSessionMeta } = useMigration()
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showConfidenceInfo, setShowConfidenceInfo] = useState(false)
  const [phase, setPhase] = useState('Ready to map')

  const runMapping = async () => {
    if (!stats.sessionId) {
      navigate('/upload')
      return
    }
    setLoading(true)
    setPhase('Analyzing column semantics...')

    const start = Date.now()
    try {
      const result = await mapSchema(stats.sessionId)
      setPhase('Scoring confidence and building mappings...')
      const elapsed = Date.now() - start
      if (elapsed < 1400) {
        await new Promise((resolve) => setTimeout(resolve, 1400 - elapsed))
      }

      const data = result.data || {}
      const mappingList = (data.mappings || []).map((m) => ({
        original: m.from,
        mapped: m.to,
        confidence: (m.confidence || 0) / 100
      }))

      setMappings(mappingList)
      updateStats({ confidence: data.average_confidence || 0 })
      setStepWithSession(2, {
        mappingConfidence: data.average_confidence || 0,
        status: 'mapped'
      })
      updateSessionMeta(stats.sessionId, {
        mappedCount: mappingList.length,
        mappingConfidence: data.average_confidence || 0
      })
      setDone(true)
      setPhase('Mapping completed')
    } catch (error) {
      alert(`Schema mapping failed: ${error?.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const confidenceBadge = (conf) => {
    if (conf > 0.9) return { icon: CheckCircle2, text: 'text-green-400', label: 'High' }
    if (conf > 0.7) return { icon: AlertCircle, text: 'text-yellow-400', label: 'Medium' }
    return { icon: XCircle, text: 'text-red-400', label: 'Low' }
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-8">
      <motion.header variants={fadeInUp} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Schema Mapping</h1>
          <p className="text-lg text-white/50 font-medium">Agent 2 maps source fields to SQL-friendly column names.</p>
        </div>
        {!done && (
          <button
            onClick={runMapping}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? phase : 'Run Mapping'}
          </button>
        )}
      </motion.header>

      <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Confidence Visualizer</h2>
            <p className="text-sm text-white/45">How sure Agent 2 is about each field mapping.</p>
          </div>
          <button
            onClick={() => setShowConfidenceInfo((v) => !v)}
            className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"
          >
            <Info className="w-4 h-4" />
            What is confidence?
          </button>
        </div>

        {showConfidenceInfo && (
          <div className="mt-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-100">
            Confidence is the model score (0–100%) for how strongly a source field matches a standardized SQL column.
            High confidence usually means semantic match (e.g. <code>cust_name → customer_name</code>), while lower
            confidence suggests you should review manually.
          </div>
        )}

        {mappings.length > 0 && (
          <div className="mt-6 space-y-3">
            {mappings.slice(0, 12).map((m) => (
              <div key={`${m.original}-${m.mapped}`} className="grid grid-cols-[1fr_auto] gap-4 items-center">
                <div>
                  <p className="text-sm text-white mb-1">{m.original} → <span className="text-blue-300">{m.mapped}</span></p>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round(m.confidence * 100)}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full ${m.confidence > 0.9 ? 'bg-green-500' : m.confidence > 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    />
                  </div>
                </div>
                <span className="text-sm font-bold text-white">{Math.round(m.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {mappings.length > 0 ? (
        <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
            <span className="text-sm text-white/60">{mappings.length} fields mapped</span>
            <span className="text-sm text-white/40">Average confidence: <span className="text-white font-bold">{stats.confidence}%</span></span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left px-6 py-3 text-xs text-white/40 uppercase tracking-wider">Original</th>
                <th className="text-left px-6 py-3 text-xs text-white/40 uppercase tracking-wider">Mapped</th>
                <th className="text-right px-6 py-3 text-xs text-white/40 uppercase tracking-wider">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => {
                const badge = confidenceBadge(m.confidence)
                const BadgeIcon = badge.icon
                return (
                  <tr key={`${m.original}-${m.mapped}`} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-6 py-3"><code className="text-white/70">{m.original}</code></td>
                    <td className="px-6 py-3"><code className="text-blue-300">{m.mapped}</code></td>
                    <td className="px-6 py-3 text-right">
                      <span className={`inline-flex items-center gap-2 ${badge.text}`}>
                        <BadgeIcon className="w-4 h-4" />
                        {Math.round(m.confidence * 100)}% ({badge.label})
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.section>
      ) : (
        <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-16 text-center">
          <Sparkles className="w-10 h-10 text-purple-400/60 mx-auto mb-4" />
          <p className="text-white/40">Run schema mapping to see interactive confidence insights.</p>
        </motion.section>
      )}

      {done && (
        <motion.div variants={fadeInUp} className="flex justify-end">
          <button
            onClick={() => navigate('/anomalies')}
            className="flex items-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all"
          >
            Continue to Anomaly Detection
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
