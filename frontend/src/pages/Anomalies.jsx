import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { ArrowRight, AlertTriangle, Loader2, CheckCircle2, Shield, AlertCircle, XCircle } from 'lucide-react'

const API_URL = 'https://new-intelli-migrate.onrender.com'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function Anomalies() {
  const navigate = useNavigate()
  const { stats, setStats, setCurrentStep } = useMigration()
  const [anomalies, setAnomalies] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  
  const runDetection = async () => {
    if (!stats.sessionId) {
      alert('Please complete previous steps first')
      navigate('/upload')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(API_URL + '/api/detect-anomalies/' + stats.sessionId, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Detection failed: ${err}`)
      }
      
      const result = await response.json()
      const data = result.data || {}
      
      // Backend returns top_issues, not anomalies array
      const anomalyList = (data.top_issues || data.anomalies || []).map(a => ({
        type: a.type || a.anomaly_type,
        description: a.description || a.message,
        severity: a.severity === 'critical' ? 'high' : (a.severity === 'warning' ? 'medium' : 'low'),
        field: a.field || a.column
      }))
      
      setAnomalies(anomalyList)
      setStats(prev => ({
        ...prev,
        anomaliesFound: anomalyList.length,
        qualityScore: data.quality_score || 100,
        cleanRecords: data.clean_records || data.total_records,
        removedRecords: data.removed_records || 0
      }))
      setCurrentStep(3)
      setDone(true)
    } catch (error) {
      console.error('Detection error:', error)
      alert(`Anomaly detection failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'high':
        return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: XCircle }
      case 'medium':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: AlertCircle }
      default:
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: AlertTriangle }
    }
  }
  
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8"
    >
      {/* Header */}
      <motion.header variants={fadeInUp} className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            Anomaly Detection
          </h1>
          <p className="text-lg text-white/50 font-medium">
            ML-powered data quality analysis using IsolationForest
          </p>
        </div>
        {!done && (
          <motion.button 
            onClick={runDetection} 
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Run Detection
              </>
            )}
          </motion.button>
        )}
      </motion.header>
      
      {/* Results */}
      {done && (
        <motion.section variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
            <p className="text-sm text-white/40 mb-2">Quality Score</p>
            <p className={`text-4xl font-black ${stats.qualityScore >= 80 ? 'text-green-400' : stats.qualityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
              {stats.qualityScore?.toFixed(0) || 100}%
            </p>
          </div>
          <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
            <p className="text-sm text-white/40 mb-2">Clean Records</p>
            <p className="text-4xl font-black text-white">{stats.cleanRecords || 0}</p>
          </div>
          <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
            <p className="text-sm text-white/40 mb-2">Issues Found</p>
            <p className="text-4xl font-black text-orange-400">{anomalies.length}</p>
          </div>
        </motion.section>
      )}
      
      {anomalies.length > 0 ? (
        <motion.section variants={fadeInUp} className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-sm font-semibold text-white/60">{anomalies.length} issues found</span>
          </div>
          
          {anomalies.map((a, i) => {
            const style = getSeverityStyle(a.severity)
            const Icon = style.icon
            
            return (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-3xl p-6 border ${style.bg} ${style.border} hover:scale-[1.01] transition-transform duration-300`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-2xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${style.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-lg font-bold text-white">{a.type}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${style.bg} ${style.text}`}>
                        {a.severity}
                      </span>
                    </div>
                    <p className="text-white/50">{a.description}</p>
                    {a.field && (
                      <p className="text-sm text-white/30 mt-2">
                        Field: <code className="px-2 py-0.5 rounded bg-white/5 font-mono">{a.field}</code>
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.section>
      ) : done ? (
        <motion.section 
          variants={fadeInUp}
          className="rounded-3xl bg-green-500/5 border border-green-500/20 p-16 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-2">No Anomalies Detected</p>
          <p className="text-white/40">Your data is clean and ready for migration</p>
        </motion.section>
      ) : (
        <motion.section 
          variants={fadeInUp}
          className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-orange-400/50" />
          </div>
          <p className="text-xl font-semibold text-white/40 mb-2">Ready to Scan</p>
          <p className="text-white/30">Click "Run Detection" to scan for data quality issues</p>
        </motion.section>
      )}
      
      {done && (
        <motion.div 
          variants={fadeInUp}
          className="flex justify-end"
        >
          <motion.button 
            onClick={() => navigate('/generate-sql')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all duration-300"
          >
            Continue to SQL Generation
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}