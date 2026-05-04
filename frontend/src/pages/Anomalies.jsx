import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { detectAnomalies } from '../lib/api'
import { ArrowRight, AlertTriangle, Loader2, Shield, PieChart, CheckCircle2 } from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

function SeverityBar({ label, value, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-sm">
        <span className="text-white/60">{label}</span>
        <span className="text-white">{value}</span>
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
      if (elapsed < 1300) {
        await new Promise((resolve) => setTimeout(resolve, 1300 - elapsed))
      }

      const data = result.data || {}
      const anomalyList = (data.top_issues || data.anomalies || []).map((a) => ({
        type: a.type || a.anomaly_type || 'Issue',
        description: a.description || a.message || 'No details',
        severity: a.severity === 'critical' ? 'high' : a.severity === 'warning' ? 'medium' : 'low',
        field: a.field || a.column
      }))

      setAnomalies(anomalyList)
      updateStats({
        anomaliesFound: anomalyList.length,
        qualityScore: data.quality_score || 100,
        cleanRecords: data.clean_records || data.total_records || 0,
        removedRecords: data.removed_records || 0
      })
      setStepWithSession(3, {
        anomaliesFound: anomalyList.length,
        qualityScore: data.quality_score || 100,
        status: 'analyzed'
      })
      updateSessionMeta(stats.sessionId, {
        anomaliesFound: anomalyList.length,
        qualityScore: data.quality_score || 100
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
      high: Math.round((high / total) * 100),
      medium: Math.round((medium / total) * 100),
      low: Math.round((low / total) * 100)
    }
  }, [anomalies])

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
        <InfoCard title="Quality Score" value={`${Math.round(stats.qualityScore || 100)}%`} />
        <InfoCard title="Clean Records" value={String(stats.cleanRecords || 0)} />
        <InfoCard title="Issues Found" value={String(anomalies.length)} />
      </motion.section>

      <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="w-5 h-5 text-orange-300" />
          <h2 className="text-xl font-bold text-white">Severity Distribution</h2>
        </div>
        {anomalies.length > 0 ? (
          <div className="space-y-3">
            <SeverityBar label="High" value={severityStats.high} color="bg-red-500" />
            <SeverityBar label="Medium" value={severityStats.medium} color="bg-yellow-500" />
            <SeverityBar label="Low" value={severityStats.low} color="bg-blue-500" />
          </div>
        ) : (
          <p className="text-white/40">Run detection to see anomaly distribution.</p>
        )}
      </motion.section>

      {anomalies.length > 0 ? (
        <motion.section variants={fadeInUp} className="space-y-3">
          {anomalies.map((a, idx) => (
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

function InfoCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
      <p className="text-sm text-white/45 mb-2">{title}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  )
}
