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
  Sparkles,
  Database,
  Clock,
  TrendingUp,
  Zap,
  X,
  ChevronRight
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } }
}

function bytesToReadable(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let idx = 0
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}

function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0)
  const steps = [
    {
      title: 'Welcome to Intelli-Migrate!',
      description: 'Your session history appears in the left panel, just like chat history.'
    },
    {
      title: 'Start New Migration',
      description: 'Click New Migration to upload a fresh file and run the 6-agent pipeline.'
    },
    {
      title: 'Track Live Session',
      description: 'Dashboard always shows the active file status, rows/cols, and pipeline progress.'
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

function SessionRow({ session, active }) {
  return (
    <div className={`p-4 rounded-2xl border ${active ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.02] border-white/[0.08]'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white truncate">{session.fileName || 'Untitled file'}</p>
        <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 text-white/50">Step {session.currentStep || 0}/6</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-white/45">
        <span>Size: {bytesToReadable(session.fileSizeBytes)}</span>
        <span>Rows: {session.rows || 0}</span>
        <span>Cols: {session.cols || 0}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const {
    stats,
    currentStep,
    sessionHistory,
    activeSession
  } = useMigration()
  const [searchParams] = useSearchParams()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const progress = Math.round((currentStep / 6) * 100)

  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') setShowOnboarding(true)
  }, [searchParams])

  const totals = useMemo(() => {
    return {
      filesProcessed: sessionHistory.length,
      tablesGenerated: stats.tablesGenerated || 0,
      anomaliesFound: stats.anomaliesFound || 0,
      confidence: stats.confidence || 0
    }
  }, [sessionHistory.length, stats.tablesGenerated, stats.anomaliesFound, stats.confidence])

  return (
    <>
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
        <motion.header variants={fadeInUp}>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
            Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-lg text-white/50 font-medium">
            Your migration sessions and live pipeline status
          </p>
        </motion.header>

        <div className="grid grid-cols-12 gap-5">
          <motion.div variants={fadeInUp} className="col-span-3">
            <MetricCard icon={FileUp} label="Files Processed" value={totals.filesProcessed} color="blue" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-3">
            <MetricCard icon={Table} label="Tables Generated" value={totals.tablesGenerated} color="purple" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-3">
            <MetricCard icon={AlertTriangle} label="Anomalies Found" value={totals.anomaliesFound} color="orange" />
          </motion.div>
          <motion.div variants={fadeInUp} className="col-span-3">
            <MetricCard icon={TrendingUp} label="Mapping Confidence" value={`${totals.confidence}%`} color="green" />
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

              <div className="grid grid-cols-6 gap-3">
                {[
                  { num: 1, name: 'Parse', icon: FileUp },
                  { num: 2, name: 'Map', icon: Sparkles },
                  { num: 3, name: 'Detect', icon: AlertTriangle },
                  { num: 4, name: 'Normalize', icon: Table },
                  { num: 5, name: 'Generate', icon: Database },
                  { num: 6, name: 'Deploy', icon: Zap }
                ].map((step) => {
                  const done = currentStep >= step.num
                  const Icon = step.icon
                  return (
                    <div key={step.num} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-2 ${done ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-white/5 border border-white/10'}`}>
                        <Icon className={`w-5 h-5 ${done ? 'text-white' : 'text-white/30'}`} />
                      </div>
                      <p className={`text-xs font-semibold ${done ? 'text-white' : 'text-white/40'}`}>{step.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="col-span-4">
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] h-full">
              <div className="flex items-center gap-2 mb-5">
                <Clock className="w-4 h-4 text-white/40" />
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Active File Details</h3>
              </div>
              <div className="space-y-3 text-sm">
                <DetailRow label="File" value={activeSession?.fileName || stats.fileName || 'Not selected'} />
                <DetailRow label="Type" value={(activeSession?.fileType || stats.fileType || 'unknown').toUpperCase()} />
                <DetailRow label="Size" value={bytesToReadable(activeSession?.fileSizeBytes || stats.fileSizeBytes)} />
                <DetailRow label="Rows" value={String(activeSession?.rows || stats.rows || 0)} />
                <DetailRow label="Columns" value={String(activeSession?.cols || stats.cols || 0)} />
                <DetailRow label="Current Step" value={`${currentStep}/6`} />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.section variants={fadeInUp}>
          <h2 className="text-xl font-bold text-white mb-4">Session History</h2>
          <div className="space-y-3">
            {sessionHistory.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-white/40">
                No sessions yet. Start your first migration below.
              </div>
            ) : (
              sessionHistory.map((item) => (
                <SessionRow key={item.sessionId} session={item} active={activeSession?.sessionId === item.sessionId} />
              ))
            )}
          </div>
        </motion.section>

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

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-b-0">
      <span className="text-white/45">{label}</span>
      <span className="text-white font-semibold truncate max-w-[65%] text-right">{value}</span>
    </div>
  )
}
