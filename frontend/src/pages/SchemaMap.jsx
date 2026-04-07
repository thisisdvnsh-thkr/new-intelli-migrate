import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { ArrowRight, Loader2, Sparkles, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

const API_URL = 'https://new-intelli-migrate.onrender.com'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } }
}

export default function SchemaMap() {
  const navigate = useNavigate()
  const { stats, setStats, setCurrentStep } = useMigration()
  const [mappings, setMappings] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  
  const runMapping = async () => {
    if (!stats.sessionId) {
      alert('Please upload a file first')
      navigate('/upload')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch(API_URL + '/api/map-schema/' + stats.sessionId, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Mapping failed: ${err}`)
      }
      
      const result = await response.json()
      const data = result.data || {}
      
      const mappingList = (data.mappings || []).map(m => ({
        original: m.from,
        mapped: m.to,
        confidence: m.confidence / 100
      }))
      
      setMappings(mappingList)
      setStats(prev => ({
        ...prev,
        confidence: data.average_confidence || 0
      }))
      setCurrentStep(2)
      setDone(true)
    } catch (error) {
      console.error('Mapping error:', error)
      alert(`Schema mapping failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceIcon = (conf) => {
    if (conf > 0.9) return <CheckCircle2 className="w-4 h-4 text-green-400" />
    if (conf > 0.7) return <AlertCircle className="w-4 h-4 text-yellow-400" />
    return <XCircle className="w-4 h-4 text-red-400" />
  }

  const getConfidenceColor = (conf) => {
    if (conf > 0.9) return 'text-green-400'
    if (conf > 0.7) return 'text-yellow-400'
    return 'text-red-400'
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
            Schema Mapping
          </h1>
          <p className="text-lg text-white/50 font-medium">
            NLP-powered column name standardization using sentence transformers
          </p>
        </div>
        {!done && (
          <motion.button 
            onClick={runMapping} 
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Run Mapping
              </>
            )}
          </motion.button>
        )}
      </motion.header>
      
      {/* Results */}
      {mappings.length > 0 ? (
        <motion.section 
          variants={fadeInUp}
          className="rounded-3xl bg-white/[0.02] border border-white/[0.08] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm font-semibold text-white/60">{mappings.length} columns mapped</span>
            </div>
            <span className="text-sm text-white/40">Average confidence: <span className="text-white font-bold">{stats.confidence}%</span></span>
          </div>
          
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Original Field</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">→</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">SQL Column</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-white/40 uppercase tracking-wider">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m, i) => (
                <motion.tr 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 rounded-lg bg-white/5 text-white/60 text-sm font-mono">{m.original}</code>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowRight className="w-4 h-4 text-white/20 mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-mono font-semibold">{m.mapped}</code>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      {getConfidenceIcon(m.confidence)}
                      <span className={`font-bold ${getConfidenceColor(m.confidence)}`}>
                        {Math.round(m.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.section>
      ) : (
        <motion.section 
          variants={fadeInUp}
          className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-purple-400/50" />
          </div>
          <p className="text-xl font-semibold text-white/40 mb-2">Ready to Map</p>
          <p className="text-white/30">Click "Run Mapping" to analyze and standardize column names</p>
        </motion.section>
      )}
      
      {done && (
        <motion.div 
          variants={fadeInUp}
          className="flex justify-end"
        >
          <motion.button 
            onClick={() => navigate('/anomalies')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all duration-300"
          >
            Continue to Anomaly Detection
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}