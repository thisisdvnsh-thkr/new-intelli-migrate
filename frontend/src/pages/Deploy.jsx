import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { Cloud, Check, Loader2, ExternalLink, Sparkles, Shield, Database, Zap } from 'lucide-react'
import { deployToPostgres } from '../lib/api'

const RENDER_DASHBOARD_URL = import.meta.env.VITE_RENDER_DASHBOARD_URL || 'https://dashboard.render.com/databases'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function Deploy() {
  const { stats, setCurrentStep } = useMigration()
  const [deploying, setDeploying] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [result, setResult] = useState(null)

  const deploy = async () => {
    if (!stats.sessionId) {
      alert('Please complete previous steps first')
      return
    }

    setDeploying(true)

    try {
      // Use backend deploy which targets the configured Postgres (DATABASE_URL must be set on server)
      const response = await deployToPostgres(stats.sessionId, '')
      setResult(response)
      setDeployed(true)
      setCurrentStep(6)
    } catch (error) {
      console.error('Deploy error:', error)
      alert(`Deployment failed: ${error.message}`)
    } finally {
      setDeploying(false)
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
      <motion.header variants={fadeInUp}>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
          Deploy to Cloud
        </h1>
        <p className="text-lg text-white/50 font-medium">
          Deploy your migrated schema to your configured PostgreSQL instance
        </p>
      </motion.header>
      
      {/* Deploy Card */}
      <motion.section 
        variants={fadeInUp}
        className={`rounded-3xl p-12 md:p-16 text-center transition-all duration-500 ${
          deployed 
            ? 'bg-green-500/5 border border-green-500/20' 
            : 'bg-white/[0.02] border border-white/[0.08]'
        }`}
      >
        {deployed ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="w-24 h-24 rounded-3xl bg-green-500/20 flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <Check className="w-12 h-12 text-green-400" strokeWidth={2} />
              </motion.div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-3">Deployment Successful!</h2>
              <p className="text-xl text-white/50">
                {result && result.tables_created ? result.tables_created.length : 0} tables created in your database
              </p>
              {result && result.message && (
                <p className="text-sm text-white/40 mt-2">{result.message}</p>
              )}
            </div>
            <motion.a
              href={RENDER_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300"
            >
              Open Database Dashboard
              <ExternalLink className="w-5 h-5" />
            </motion.a>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <motion.div 
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto"
              animate={{ 
                boxShadow: ['0 0 20px rgba(59, 130, 246, 0.2)', '0 0 40px rgba(147, 51, 234, 0.3)', '0 0 20px rgba(59, 130, 246, 0.2)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Cloud className="w-12 h-12 text-white/50" strokeWidth={1.5} />
            </motion.div>
            <div>
              <h2 className="text-3xl font-black text-white mb-3">Ready to Deploy</h2>
              <p className="text-xl text-white/50">
                Your SQL schema will be deployed to your configured PostgreSQL instance
              </p>
            </div>
            <motion.button
              onClick={deploy}
              disabled={deploying}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50"
            >
              {deploying ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Deploy Now
                </>
              )}
            </motion.button>
          </div>
        )}
      </motion.section>
      
      {/* Info Cards */}
      <motion.div 
        variants={fadeInUp}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          { icon: Database, label: 'Database', value: 'PostgreSQL 15', color: 'blue' },
          { icon: Shield, label: 'SSL', value: 'Enabled', color: 'green' },
          { icon: Zap, label: 'Region', value: 'Auto-detected', color: 'purple' },
        ].map((item, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.02 }}
            className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 flex items-center justify-center mb-4`}>
              <item.icon className={`w-5 h-5 text-${item.color}-400`} />
            </div>
            <p className="text-sm text-white/40 mb-1">{item.label}</p>
            <p className="text-lg font-bold text-white">{item.value}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
