import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, FileUp, Table, AlertTriangle, TrendingUp, Zap, X, ChevronRight } from 'lucide-react'

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
    { title: 'Welcome to Intelli-Migrate', description: 'Dashboard shows your overall work, while each session opens separately.' },
    { title: 'Open Session-Specific View', description: 'Click any session in sidebar to open its own dedicated session dashboard.' },
    { title: 'Run New Migration', description: 'Use New Migration to upload and process another file.' }
  ]
  const currentStep = steps[step]

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
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
              onClick={() => (step < steps.length - 1 ? setStep((s) => s + 1) : onComplete())}
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

export default function Dashboard() {
  const { user } = useAuth()
  const { sessionHistory } = useMigration()
  const [searchParams] = useSearchParams()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') setShowOnboarding(true)
  }, [searchParams])

  const totals = useMemo(() => {
    const completed = sessionHistory.filter((s) => (s.currentStep || 0) >= 6).length
    const avgConfidence = sessionHistory.length
      ? Math.round(sessionHistory.reduce((acc, s) => acc + (s.mappingConfidence || 0), 0) / sessionHistory.length)
      : 0
    const avgQuality = sessionHistory.length
      ? Math.round(sessionHistory.reduce((acc, s) => acc + (s.qualityScore || 0), 0) / sessionHistory.length)
      : 0
    const totalRows = sessionHistory.reduce((acc, s) => acc + (s.rows || 0), 0)
    const inProgress = sessionHistory.filter((s) => (s.currentStep || 0) > 0 && (s.currentStep || 0) < 6).length
    return {
      filesProcessed: sessionHistory.length,
      totalRows,
      completed,
      inProgress,
      avgConfidence,
      avgQuality
    }
  }, [sessionHistory])

  return (
    <>
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
        <motion.header variants={fadeInUp}>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-lg text-white/50 font-medium">Primary dashboard: overall behavior and total migration activity.</p>
        </motion.header>

        <div className="grid grid-cols-12 gap-5">
          <motion.div variants={fadeInUp} className="col-span-2">
            <MetricCard icon={FileUp} label="Files" value={totals.filesProcessed} color="blue" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-2">
            <MetricCard icon={Table} label="Rows" value={totals.totalRows} color="purple" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-2">
            <MetricCard icon={Zap} label="Completed" value={totals.completed} color="green" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-2">
            <MetricCard icon={AlertTriangle} label="In Progress" value={totals.inProgress} color="orange" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-2">
            <MetricCard icon={TrendingUp} label="Confidence" value={`${totals.avgConfidence}%`} color="blue" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-2">
            <MetricCard icon={TrendingUp} label="Quality" value={`${totals.avgQuality}%`} color="purple" />
          </motion.div>
        </div>

        <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Recent Sessions</h2>
            <p className="text-sm text-white/45">Open any session from sidebar for detailed session dashboard.</p>
          </div>
          {sessionHistory.length === 0 ? (
            <p className="text-white/50">No sessions yet. Start your first migration.</p>
          ) : (
            <div className="space-y-2">
              {sessionHistory.slice(0, 6).map((s) => (
                <Link
                  key={s.sessionId}
                  to={`/session/${s.sessionId}`}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05]"
                >
                  <span className="text-white font-semibold truncate">{s.fileName || 'Untitled file'}</span>
                  <span className="text-sm text-white/45">Step {s.currentStep || 0}/6</span>
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        <motion.div variants={fadeInUp} className="flex justify-end pt-2">
          <Link to="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all">
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
    <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorClassMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-black text-white mb-1">{value}</p>
      <p className="text-xs text-white/40 font-medium uppercase tracking-wide">{label}</p>
    </div>
  )
}
