import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, AlertTriangle, Loader2, Shield, PieChart, CheckCircle2 } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'
import { detectAnomalies } from '../lib/api'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

function normalizeSeverity(issue) {
  const value = String(issue?.severity || '').toLowerCase()
  const details = `${issue?.type || ''} ${issue?.description || ''}`.toLowerCase()
  if (value.includes('critical') || value.includes('high')) return 'high'
  if (value.includes('medium') || value.includes('warning')) return 'medium'
  if (details.includes('outlier') || details.includes('invalid') || details.includes('duplicate')) return 'high'
  if (details.includes('missing') || details.includes('empty') || details.includes('null')) return 'medium'
  return 'low'
}

function qualityMeta(score) {
  const safe = Number(score || 0)
  if (safe >= 85) return { label: 'Excellent', tone: 'text-emerald-300' }
  if (safe >= 65) return { label: 'Good', tone: 'text-lime-300' }
  if (safe >= 45) return { label: 'Moderate', tone: 'text-amber-300' }
  return { label: 'Needs attention', tone: 'text-rose-300' }
}

function SeverityBar({ label, value, color, count }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="text-white/60">{label}</span>
        <span className="text-white">{count} • {value}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.6 }} className={`h-full ${color}`} />
      </div>
    </div>
  )
}

export default function Anomalies() {
  const navigate = useNavigate()
  const { stats, updateStats, setStepWithSession, updateSessionMeta } = useMigration()
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [phase, setPhase] = useState('Ready')
  const [showAllIssues, setShowAllIssues] = useState(false)

  const runDetection = async () => {
    if (!stats.sessionId) {
      navigate('/upload')
      return
    }

    setLoading(true)
    setPhase('Scanning outliers...')
    const start = Date.now()

    try {
      const result = await detectAnomalies(stats.sessionId)
      setPhase('Classifying anomaly severity...')
      const elapsed = Date.now() - start
      if (elapsed < 5000) {
        await new Promise((resolve) => setTimeout(resolve, 5000 - elapsed))
      }

      const data = result.data || {}
      const anomalyList = (data.top_issues || data.anomalies || []).map((a) => ({
        type: a.type || a.anomaly_type || 'Issue',
        description: a.description || a.message || 'No details',
        severity: normalizeSeverity(a),
        field: a.field || a.column
      }))

      const qualityScore = Number(data.quality_score ?? 0)
      const cleanRecords = Number(data.clean_records ?? data.total_records ?? 0)

      setAnomalies(anomalyList)
      updateStats({
        anomaliesFound: anomalyList.length,
        qualityScore,
        cleanRecords,
        removedRecords: Number(data.removed_records ?? 0)
      })
      setStepWithSession(3, {
        anomaliesFound: anomalyList.length,
        qualityScore,
        status: 'analyzed'
      })
      updateSessionMeta(stats.sessionId, {
        anomaliesFound: anomalyList.length,
        qualityScore
      })
      setDone(true)
      setPhase('Analysis complete')
    } catch (error) {
      alert(`Anomaly detection failed: ${error?.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const severityStats = useMemo(() => {
    const total = anomalies.length || 1
    const high = anomalies.filter((a) => a.severity === 'high').length
    const medium = anomalies.filter((a) => a.severity === 'medium').length
    const low = anomalies.filter((a) => a.severity === 'low').length
    return {
      highCount: high,
      mediumCount: medium,
      lowCount: low,
      high: Math.round((high / total) * 100),
      medium: Math.round((medium / total) * 100),
      low: Math.round((low / total) * 100)
    }
  }, [anomalies])

  const qualityScore = done ? Number(stats.qualityScore ?? 0) : 0
  const quality = qualityMeta(qualityScore)
  const visibleIssues = showAllIssues ? anomalies : anomalies.slice(0, 10)

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-8">
      <motion.header variants={fadeInUp} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Anomaly Detection</h1>
          <p className="text-lg text-white/50 font-medium">Agent 3 checks quality issues, outliers, and missing values.</p>
        </div>
        {!done && (
          <button
            onClick={runDetection}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {loading ? phase : 'Run Detection'}
          </button>
        )}
      </motion.header>

      <motion.section variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard title="Quality Score" value={`${Math.round(qualityScore)}%`} subtitle={quality.label} tone={quality.tone} />
        <InfoCard title="Clean Records" value={String(done ? (stats.cleanRecords || 0) : 0)} />
        <InfoCard title="Issues Found" value={String(done ? anomalies.length : 0)} />
      </motion.section>

      <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-2">
          <PieChart className="w-5 h-5 text-orange-300" />
          <h2 className="text-xl font-bold text-white">Severity Distribution</h2>
        </div>
        <p className="text-sm text-white/45 mb-4">
          Quality score reflects the percentage of records passing anomaly checks after validation and cleanup.
        </p>
        {anomalies.length > 0 ? (
          <div className="space-y-3">
            <SeverityBar label="High" value={severityStats.high} count={severityStats.highCount} color="bg-red-500" />
            <SeverityBar label="Medium" value={severityStats.medium} count={severityStats.mediumCount} color="bg-yellow-500" />
            <SeverityBar label="Low" value={severityStats.low} count={severityStats.lowCount} color="bg-blue-500" />
          </div>
        ) : (
          <p className="text-white/40">Run detection to see anomaly distribution.</p>
        )}
      </motion.section>

      {anomalies.length > 0 ? (
        <motion.section variants={fadeInUp} className="space-y-3">
          {visibleIssues.map((a, idx) => (
            <div key={`${a.type}-${idx}`} className="rounded-2xl p-4 border border-white/[0.08] bg-white/[0.02]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-white">{a.type}</p>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  a.severity === 'high' ? 'bg-red-500/20 text-red-300' : a.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {a.severity}
                </span>
              </div>
              <p className="text-sm text-white/55 mt-1">{a.description}</p>
              {a.field && <p className="text-xs text-white/35 mt-2">Field: {a.field}</p>}
            </div>
          ))}

          {anomalies.length > 10 && (
            <div className="pt-2">
              <button
                onClick={() => setShowAllIssues((v) => !v)}
                className="px-3 py-1.5 rounded-xl border border-orange-400/40 bg-orange-500/10 text-orange-200 text-sm font-semibold animate-pulse hover:animate-none"
              >
                {showAllIssues ? 'Show top 10' : 'More issues ✨'}
              </button>
            </div>
          )}
        </motion.section>
      ) : done ? (
        <motion.section variants={fadeInUp} className="rounded-3xl bg-green-500/5 border border-green-500/20 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-white">No anomalies detected. Data quality looks good.</p>
        </motion.section>
      ) : (
        <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-orange-300/70 mx-auto mb-4" />
          <p className="text-white/40">Run anomaly detection to generate interactive quality insights.</p>
        </motion.section>
      )}

      {done && (
        <motion.div variants={fadeInUp} className="flex justify-end">
          <button
            onClick={() => navigate('/generate-sql')}
            className="flex items-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all"
          >
            Continue to SQL Generation
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

function InfoCard({ title, value, subtitle, tone = 'text-white' }) {
  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
      <p className="text-sm text-white/45 mb-2">{title}</p>
      <p className={`text-3xl font-black ${tone}`}>{value}</p>
      {subtitle && <p className="text-xs text-white/45 mt-1">{subtitle}</p>}
    </div>
  )
}
