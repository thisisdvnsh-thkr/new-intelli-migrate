import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { useAuth } from '../context/AuthContext'
import {
  ArrowRight,
  FileUp,
  Table,
  AlertTriangle,
  TrendingUp,
  Zap,
  X,
  ChevronRight,
  MessageCircle
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
}

function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0)
  const steps = [
    {
      title: 'Welcome to Intelli-Migrate',
      description: 'Sessions appear in sidebar like compact chat history.'
    },
    {
      title: 'Start a New Migration',
      description: 'Use New Migration to upload your next file and run full pipeline.'
    },
    {
      title: 'Track End-to-End Progress',
      description: 'Dashboard shows overall behavior and selected session performance.'
    }
  ]

  const currentStep = steps[step]
  const handleNext = () => {
    if (step < steps.length - 1) setStep((s) => s + 1)
    else onComplete()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg p-8 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/20 backdrop-blur-2xl"
        >
          <button onClick={onComplete} className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <h3 className="text-2xl font-black text-white mb-3">{currentStep.title}</h3>
          <p className="text-white/60 mb-6">{currentStep.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-sm">Step {step + 1} of {steps.length}</span>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-white text-black font-bold rounded-2xl flex items-center gap-2 hover:bg-white/90 transition-all"
            >
              {step < steps.length - 1 ? 'Next' : 'Done'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const pipelineRoutes = [
  { num: 1, name: 'Parse', route: '/parse-review', icon: FileUp },
  { num: 2, name: 'Map', route: '/schema-map', icon: Spark },
  { num: 3, name: 'Detect', route: '/anomalies', icon: AlertTriangle },
  { num: 4, name: 'Normalize', route: '/generate-sql', icon: Table },
  { num: 5, name: 'Generate SQL', route: '/generate-sql', icon: Table },
  { num: 6, name: 'Deploy', route: '/deploy', icon: Zap }
]

function Spark(props) {
  return <TrendingUp {...props} />
}

export default function Dashboard() {
  const { user } = useAuth()
  const { stats, currentStep, sessionHistory, activeSession } = useMigration()
  const [searchParams] = useSearchParams()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const progress = Math.round((currentStep / 6) * 100)

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') setShowOnboarding(true)
  }, [searchParams])

  const totals = useMemo(() => {
    const completed = sessionHistory.filter((s) => (s.currentStep || 0) >= 6).length
    const avgConfidence = sessionHistory.length
      ? Math.round(sessionHistory.reduce((acc, s) => acc + (s.mappingConfidence || 0), 0) / sessionHistory.length)
      : 0
    const totalRows = sessionHistory.reduce((acc, s) => acc + (s.rows || 0), 0)
    return {
      filesProcessed: sessionHistory.length,
      tablesGenerated: stats.tablesGenerated || 0,
      anomaliesFound: stats.anomaliesFound || 0,
      confidence: stats.confidence || avgConfidence,
      completed,
      totalRows
    }
  }, [sessionHistory, stats.tablesGenerated, stats.anomaliesFound, stats.confidence])

  const selectedSessionMetrics = useMemo(() => ({
    tablesGenerated: activeSession?.tablesGenerated || 0,
    anomaliesFound: activeSession?.anomaliesFound || 0,
    confidence: activeSession?.mappingConfidence || 0
  }), [activeSession])

  return (
    <>
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
        <motion.header variants={fadeInUp} className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-lg text-white/50 font-medium">
              Overall platform behavior and selected session intelligence.
            </p>
          </div>
          <button
            onClick={() => window.dispatchEvent(new Event('open-support-chat'))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.12] text-white/80 hover:text-white hover:bg-white/[0.06]"
          >
            <MessageCircle className="w-4 h-4" />
            Support
          </button>
        </motion.header>

        <div className="grid grid-cols-12 gap-5">
          <motion.div variants={fadeInUp} className="col-span-3">
            <MetricCard icon={FileUp} label="Files Processed" value={totals.filesProcessed} color="blue" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-3">
            <MetricCard icon={Table} label="Rows Processed" value={totals.totalRows} color="purple" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-3">
            <MetricCard icon={Zap} label="Completed Sessions" value={totals.completed} color="green" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-3">
            <MetricCard icon={TrendingUp} label="Avg Confidence" value={`${totals.confidence}%`} color="orange" />
          </motion.div>

          <motion.div variants={fadeInUp} className="col-span-8">
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-white">Live Migration Pipeline</h2>
                  <p className="text-sm text-white/40">
                    {activeSession?.fileName || stats.fileName || 'No active file selected'}
                  </p>
                </div>
                <p className="text-2xl font-black text-white">{progress}%</p>
              </div>

              <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-6">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {pipelineRoutes.map((step) => {
                  const done = currentStep >= step.num
                  const Icon = step.icon
                  return (
                    <Link key={step.num} to={step.route} className="text-center group">
                      <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-2 border transition-colors ${
                        done
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 border-transparent'
                          : 'bg-white/5 border-white/10 group-hover:bg-white/10'
                      }`}>
                        <Icon className={`w-5 h-5 ${done ? 'text-white' : 'text-white/30'}`} />
                      </div>
                      <p className={`text-xs font-semibold ${done ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`}>{step.name}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="col-span-4">
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] h-full">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Selected Session</h3>
              <p className="text-base text-white font-semibold truncate mb-5">
                {activeSession?.fileName || stats.fileName || 'No session selected'}
              </p>
              <div className="grid grid-cols-1 gap-3">
                <SmallCard label="Tables Generated" value={selectedSessionMetrics.tablesGenerated} />
                <SmallCard label="Anomalies Found" value={selectedSessionMetrics.anomaliesFound} />
                <SmallCard label="Confidence" value={`${selectedSessionMetrics.confidence}%`} />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div variants={fadeInUp} className="flex justify-end pt-2">
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all"
          >
            New Migration
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </motion.div>
    </>
  )
}

function MetricCard({ icon: Icon, label, value, color }) {
  const colorClassMap = {
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-orange-500/10 text-orange-400',
    green: 'bg-green-500/10 text-green-400'
  }
  return (
    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${colorClassMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-black text-white mb-1">{value}</p>
      <p className="text-sm text-white/40 font-medium">{label}</p>
    </div>
  )
}

function SmallCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
      <p className="text-xs text-white/45 mb-1">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}
