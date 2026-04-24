import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { ArrowRight, Database, Download, Copy, Check, Loader2, Code2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_BASE || 'https://new-intelli-migrate.onrender.com'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function GenerateSQL() {
  const navigate = useNavigate()
  const { stats, setStats, setCurrentStep } = useMigration()
  const [sql, setSql] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)
  
  const generate = async () => {
    if (!stats.sessionId) {
      alert('Please complete previous steps first')
      navigate('/upload')
      return
    }
    
    setLoading(true)
    
    try {
      // Step 4: Normalize
      await fetch(API_URL + '/api/normalize/' + stats.sessionId, { method: 'POST' })
      setCurrentStep(4)
      
      // Step 5: Generate SQL
      const response = await fetch(API_URL + '/api/generate-sql/' + stats.sessionId, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Generation failed: ${err}`)
      }
      
      const result = await response.json()
      const data = result.data || result

      setSql(data.preview || data.ddl || data.sql || '')
      setStats(prev => ({
        ...prev,
        tablesGenerated: data.tables_count || data.tables?.length || 0
      }))
      setCurrentStep(5)
      setDone(true)
    } catch (error) {
      console.error('Generation error:', error)
      alert(`SQL generation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const downloadSQL = () => {
    const blob = new Blob([sql], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'migration.sql'
    a.click()
    URL.revokeObjectURL(url)
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
            Generate SQL
          </h1>
          <p className="text-lg text-white/50 font-medium">
            3NF normalized DDL and DML statements ready for deployment
          </p>
        </div>
        {!done && (
          <motion.button 
            onClick={generate} 
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Generate SQL
              </>
            )}
          </motion.button>
        )}
      </motion.header>
      
      {/* SQL Output */}
      {sql ? (
        <motion.div variants={fadeInUp} className="space-y-6">
          <div className="rounded-3xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">migration.sql</span>
                  <span className="text-xs text-white/30 ml-2">{stats.tablesGenerated} tables</span>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button 
                  onClick={copyToClipboard}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-all duration-300"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </motion.button>
                <motion.button 
                  onClick={downloadSQL}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2 hover:bg-emerald-500/20 transition-all duration-300"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
              </div>
            </div>
            
            {/* Code */}
            <div className="relative">
              <pre className="p-6 overflow-x-auto text-sm text-white/70 font-mono max-h-[500px] leading-relaxed bg-black/20">
                <code>{sql}</code>
              </pre>
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0a0b] to-transparent pointer-events-none" />
            </div>
          </div>
          
          <div className="flex justify-end">
            <motion.button 
              onClick={() => navigate('/deploy')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all duration-300"
            >
              Proceed to Deploy
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.section 
          variants={fadeInUp}
          className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <Database className="w-8 h-8 text-emerald-400/50" />
          </div>
          <p className="text-xl font-semibold text-white/40 mb-2">Ready to Generate</p>
          <p className="text-white/30">Click "Generate SQL" to create normalized database scripts</p>
        </motion.section>
      )}
    </motion.div>
  )
}
