import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, Info, Loader2 } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'
import { mapSchema } from '../lib/api'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

function toConfidence(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n)) return 0
  if (n > 1) return Math.max(0, Math.min(1, n / 100))
  return Math.max(0, Math.min(1, n))
}

function confidenceMeta(confidence) {
  if (confidence >= 0.9) return { label: 'High', tone: 'text-emerald-300', bar: 'from-emerald-400 to-green-500' }
  if (confidence >= 0.75) return { label: 'Medium', tone: 'text-amber-300', bar: 'from-amber-400 to-yellow-500' }
  return { label: 'Low', tone: 'text-rose-300', bar: 'from-rose-400 to-red-500' }
}

export default function SchemaMap() {
  const navigate = useNavigate()
  const { stats, updateStats, setStepWithSession, updateSessionMeta } = useMigration()
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showConfidenceInfo, setShowConfidenceInfo] = useState(false)
  const [showAllFields, setShowAllFields] = useState(false)
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
      if (elapsed < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 5000 - elapsed))
      }

      const data = result.data || {}
      const mappingList = (data.mappings || []).map((m) => ({
        original: m.from,
        mapped: m.to,
        confidence: toConfidence(m.confidence)
      }))

      setMappings(mappingList)
      updateStats({ confidence: Number(data.average_confidence || 0) })
      setStepWithSession(2, {
        mappingConfidence: Number(data.average_confidence || 0),
        status: 'mapped'
      })
      updateSessionMeta(stats.sessionId, {
        mappedCount: mappingList.length,
        mappingConfidence: Number(data.average_confidence || 0)
      })
      setDone(true)
      setPhase('Mapping completed')
    } catch (error) {
      alert(`Schema mapping failed: ${error?.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const averageConfidence = useMemo(() => {
    if (!mappings.length) return Number(stats.confidence || 0)
    return Number((mappings.reduce((sum, item) => sum + item.confidence, 0) * 100) / mappings.length)
  }, [mappings, stats.confidence])

  const visibleMappings = useMemo(() => (
    showAllFields ? mappings : mappings.slice(0, 10)
  ), [mappings, showAllFields])

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
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Confidence Visualizer</h2>
            <p className="text-sm text-white/45">Top 10 mappings are shown first for quick review.</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase tracking-wider">Average confidence</p>
            <p className={`text-2xl font-black ${confidenceMeta(toConfidence(averageConfidence)).tone}`}>{averageConfidence.toFixed(1)}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setShowConfidenceInfo((v) => !v)}
            className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200"
          >
            <Info className="w-4 h-4" />
            What is confidence?
          </button>
          {mappings.length > 10 && (
            <button
              onClick={() => setShowAllFields((v) => !v)}
              className="px-3 py-1.5 rounded-xl border border-blue-400/40 bg-blue-500/10 text-blue-200 text-sm font-semibold animate-pulse hover:animate-none"
            >
              {showAllFields ? 'Show top 10' : 'More fields ✨'}
            </button>
          )}
        </div>

        {showConfidenceInfo && (
          <div className="mt-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-100">
            Confidence is the model score (0–100%) for how strongly a source field matches a standardized SQL column.
            Higher values usually mean stronger semantic match.
          </div>
        )}

        {visibleMappings.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-10 gap-1">
              {visibleMappings.map((m, idx) => (
                <div key={`${m.original}-${idx}`} className="h-16 rounded-md bg-white/5 flex items-end p-1">
                  <div
                    className={`w-full rounded-sm bg-gradient-to-t ${confidenceMeta(m.confidence).bar}`}
                    style={{ height: `${Math.max(8, Math.round(m.confidence * 100))}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {visibleMappings.map((m, idx) => {
                const meta = confidenceMeta(m.confidence)
                return (
                  <div key={`${m.original}-${m.mapped}-${idx}`} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <p className="text-sm text-white">
                        <span className="font-semibold">{m.original}</span>
                        <span className="text-white/40"> → </span>
                        <span className="text-blue-300 font-semibold">{m.mapped}</span>
                      </p>
                      <p className={`text-sm font-bold ${meta.tone}`}>{(m.confidence * 100).toFixed(1)}% ({meta.label})</p>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round(m.confidence * 100)}%` }}
                        transition={{ duration: 0.45 }}
                        className={`h-full bg-gradient-to-r ${meta.bar}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </motion.section>

      {visibleMappings.length === 0 && (
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
