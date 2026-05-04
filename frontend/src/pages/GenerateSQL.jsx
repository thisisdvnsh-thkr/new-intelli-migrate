import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { normalizeData, generateSQL as generateSQLApi } from '../lib/api'
import { ArrowRight, Database, Download, Copy, Check, Loader2, Code2, BarChart3 } from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export default function GenerateSQL() {
  const navigate = useNavigate()
  const { stats, updateStats, setStepWithSession, updateSessionMeta } = useMigration()
  const [sql, setSql] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('Ready')
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState({ tableCount: 0, recordCount: 0, ddlLines: 0, dmlLines: 0 })

  const sqlStats = useMemo(() => {
    const lines = sql.split('\n').length
    const createCount = (sql.match(/CREATE TABLE/gi) || []).length
    const insertCount = (sql.match(/INSERT INTO/gi) || []).length
    return { lines, createCount, insertCount }
  }, [sql])

  const generate = async () => {
    if (!stats.sessionId) {
      navigate('/upload')
      return
    }
    setLoading(true)
    const start = Date.now()
    try {
      setPhase('Normalizing data to 3NF...')
      await normalizeData(stats.sessionId)
      setStepWithSession(4, { status: 'normalized' })

      setPhase('Generating DDL and DML scripts...')
      const result = await generateSQLApi(stats.sessionId, 'postgresql')
      const data = result.data || {}
      const preview = data.preview || ''

      const elapsed = Date.now() - start
      if (elapsed < 1300) {
        await new Promise((resolve) => setTimeout(resolve, 1300 - elapsed))
      }

      setSql(preview)
      setSummary({
        tableCount: data.table_count || 0,
        recordCount: data.record_count || 0,
        ddlLines: data.ddl_lines || 0,
        dmlLines: data.dml_lines || 0
      })
      updateStats({ tablesGenerated: data.table_count || 0 })
      setStepWithSession(5, { status: 'sql_ready', tablesGenerated: data.table_count || 0 })
      updateSessionMeta(stats.sessionId, { tablesGenerated: data.table_count || 0 })
      setDone(true)
      setPhase('SQL generation complete')
    } catch (error) {
      alert(`SQL generation failed: ${error?.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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
    <motion.div initial="hidden" animate="visible" className="space-y-8">
      <motion.header variants={fadeInUp} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">SQL Generation</h1>
          <p className="text-lg text-white/50 font-medium">Agent 4 + 5 normalize data and generate production-ready SQL.</p>
        </div>
        {!done && (
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
            {loading ? phase : 'Generate SQL'}
          </button>
        )}
      </motion.header>

      <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-emerald-300" />
          <h2 className="text-xl font-bold text-white">Agent Visualization</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          <Stat label="Tables" value={String(summary.tableCount || sqlStats.createCount)} />
          <Stat label="Records" value={String(summary.recordCount)} />
          <Stat label="DDL Lines" value={String(summary.ddlLines)} />
          <Stat label="DML Lines" value={String(summary.dmlLines || sqlStats.insertCount)} />
        </div>
      </motion.section>

      {sql ? (
        <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Code2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-white">migration.sql</span>
              <span className="text-xs text-white/40">{sqlStats.lines} lines</span>
            </div>
            <div className="flex gap-2">
              <button onClick={copyToClipboard} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-all">
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={downloadSQL} className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2 hover:bg-emerald-500/20 transition-all">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
          <pre className="p-6 overflow-x-auto text-sm text-white/70 font-mono max-h-[500px] leading-relaxed bg-black/20">
            <code>{sql}</code>
          </pre>
        </motion.section>
      ) : (
        <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-16 text-center">
          <Database className="w-10 h-10 text-emerald-400/50 mx-auto mb-4" />
          <p className="text-white/40">Generate SQL to view scripts and interactive summary.</p>
        </motion.section>
      )}

      {done && (
        <motion.div variants={fadeInUp} className="flex justify-end">
          <button
            onClick={() => navigate('/deploy')}
            className="flex items-center gap-3 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all"
          >
            Proceed to Deploy
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
      <p className="text-xs text-white/45 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">{value}</p>
    </div>
  )
}
