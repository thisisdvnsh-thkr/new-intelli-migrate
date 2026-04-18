import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { useAuth } from '../context/AuthContext'
import { 
  ArrowRight, FileUp, Table, AlertTriangle, Sparkles, 
  Upload, Database, Clock, TrendingUp, Zap, X, ChevronRight
} from 'lucide-react'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
}

// Onboarding Tour Component
function OnboardingTour({ onComplete }) {
  const [step, setStep] = useState(0)
  
  const steps = [
    {
      title: "Welcome to Intelli-Migrate! 🎉",
      description: "Let's take a quick tour of your new AI-powered migration dashboard.",
      target: null
    },
    {
      title: "Upload Your Data",
      description: "Start by uploading JSON, CSV, or XML files. Our AI will automatically detect the schema.",
      target: "upload-card"
    },
    {
      title: "Track Your Progress",
      description: "The pipeline shows all 6 stages of your data transformation in real-time.",
      target: "pipeline-section"
    },
    {
      title: "Generate & Deploy SQL",
      description: "Once processed, download your SQL or deploy to your managed PostgreSQL!", 
      target: "sql-card"
    }
  ]
  
  const currentStep = steps[step]
  
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete()
    }
  }
  
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        
        {/* Spotlight Effect */}
        {currentStep.target && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, transparent 150px, rgba(0,0,0,0.9) 250px)'
            }}
          />
        )}
        
        {/* Tour Card */}
        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg p-8 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/20 backdrop-blur-2xl shadow-2xl"
        >
          <button 
            onClick={onComplete}
            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Progress */}
          <div className="flex gap-2 mb-6">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-blue-500' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          
          <h3 className="text-2xl font-black text-white mb-3">{currentStep.title}</h3>
          <p className="text-white/60 text-lg mb-8">{currentStep.description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-white/30 text-sm">Step {step + 1} of {steps.length}</span>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-white text-black font-bold rounded-2xl flex items-center gap-2 hover:bg-white/90 hover:scale-105 transition-all duration-300"
            >
              {step < steps.length - 1 ? 'Next' : 'Get Started'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// AI Processing Progress Bar
function AIProgressBar({ progress, label }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-white/50 font-medium">{label}</span>
        <span className="text-white font-bold">{progress}%</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full relative"
        >
          {progress > 0 && progress < 100 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { stats, currentStep } = useMigration()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const progress = Math.round((currentStep / 6) * 100)
  
  useEffect(() => {
    if (searchParams.get('onboarding') === 'true') {
      setShowOnboarding(true)
    }
  }, [searchParams])
  
  return (
    <>
      {showOnboarding && <OnboardingTour onComplete={() => setShowOnboarding(false)} />}
      
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="space-y-8"
      >
        {/* Header */}
        <motion.header variants={fadeInUp} className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-lg text-white/50 font-medium">
              Transform your NoSQL data into clean, normalized SQL databases
            </p>
          </div>
          <Link
            to="/upload"
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-white/10"
          >
            <Zap className="w-5 h-5" />
            New Migration
          </Link>
        </motion.header>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-5">
          {/* Stats Row */}
          <motion.div variants={scaleIn} className="col-span-3">
            <BentoCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileUp className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mb-1">{stats.filesProcessed}</p>
              <p className="text-sm text-white/40 font-medium">Files Processed</p>
            </BentoCard>
          </motion.div>
          
          <motion.div variants={scaleIn} className="col-span-3">
            <BentoCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Table className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mb-1">{stats.tablesGenerated}</p>
              <p className="text-sm text-white/40 font-medium">Tables Generated</p>
            </BentoCard>
          </motion.div>
          
          <motion.div variants={scaleIn} className="col-span-3">
            <BentoCard>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mb-1">{stats.anomaliesFound}</p>
              <p className="text-sm text-white/40 font-medium">Anomalies Found</p>
            </BentoCard>
          </motion.div>
          
          <motion.div variants={scaleIn} className="col-span-3">
            <BentoCard className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mb-1">{stats.confidence}<span className="text-xl">%</span></p>
              <p className="text-sm text-green-400/70 font-medium">AI Confidence</p>
            </BentoCard>
          </motion.div>

          {/* Pipeline Section - Spans 8 columns */}
          <motion.div variants={scaleIn} id="pipeline-section" className="col-span-8">
            <BentoCard className="h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Migration Pipeline</h2>
                  <p className="text-white/40 text-sm">Real-time transformation progress</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">{progress}%</p>
                </div>
              </div>
              
              {/* AI Progress Bar */}
              <AIProgressBar progress={progress} label="Overall Progress" />
              
              {/* Steps */}
              <div className="grid grid-cols-6 gap-3 mt-8">
                {[
                  { num: 1, name: 'Parse', icon: FileUp },
                  { num: 2, name: 'Map', icon: Sparkles },
                  { num: 3, name: 'Detect', icon: AlertTriangle },
                  { num: 4, name: 'Normalize', icon: Table },
                  { num: 5, name: 'Generate', icon: Database },
                  { num: 6, name: 'Deploy', icon: Zap },
                ].map((step) => {
                  const isComplete = currentStep >= step.num
                  const isCurrent = currentStep === step.num - 1
                  const Icon = step.icon
                  
                  return (
                    <motion.div 
                      key={step.num} 
                      className="text-center"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div className={`
                        w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-2 transition-all duration-300
                        ${isComplete 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30' 
                          : isCurrent
                            ? 'bg-blue-500/20 border border-blue-500/50'
                            : 'bg-white/5 border border-white/10'
                        }
                      `}>
                        <Icon className={`w-5 h-5 ${isComplete ? 'text-white' : isCurrent ? 'text-blue-400' : 'text-white/30'}`} />
                      </div>
                      <p className={`text-xs font-semibold ${isComplete ? 'text-white' : 'text-white/40'}`}>
                        {step.name}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </BentoCard>
          </motion.div>

          {/* Recent Activity - Spans 4 columns */}
          <motion.div variants={scaleIn} className="col-span-4">
            <BentoCard className="h-full">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-4 h-4 text-white/40" />
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Recent Activity</h3>
              </div>
              
              <div className="space-y-4">
                {stats.filesProcessed > 0 ? (
                  <>
                    <ActivityItem time="Just now" text="File uploaded and parsed" />
                    {currentStep >= 2 && <ActivityItem time="2m ago" text="Schema mapping completed" />}
                    {currentStep >= 3 && <ActivityItem time="3m ago" text="Anomaly detection finished" />}
                  </>
                ) : (
                  <p className="text-white/30 text-sm text-center py-8">No recent activity</p>
                )}
              </div>
            </BentoCard>
          </motion.div>

          {/* Upload Card */}
          <motion.div variants={scaleIn} id="upload-card" className="col-span-6">
            <Link to="/upload">
              <BentoCard className="group cursor-pointer hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-blue-500/25">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white mb-2">Upload Data</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-4">
                      Drag and drop JSON, CSV, or XML files to start your AI-powered migration
                    </p>
                    <span className="inline-flex items-center gap-2 text-blue-400 font-semibold text-sm group-hover:gap-3 transition-all">
                      Get started <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </BentoCard>
            </Link>
          </motion.div>

          {/* SQL Output Card */}
          <motion.div variants={scaleIn} id="sql-card" className="col-span-6">
            <Link to="/generate-sql">
              <BentoCard className="group cursor-pointer hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/25">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white mb-2">View SQL Output</h3>
                    <p className="text-white/40 text-sm leading-relaxed mb-4">
                      Download your generated DDL/DML scripts or deploy to your managed PostgreSQL
                    </p>
                    <span className="inline-flex items-center gap-2 text-purple-400 font-semibold text-sm group-hover:gap-3 transition-all">
                      View output <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </BentoCard>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </>
  )
}

// Bento Card Component
function BentoCard({ children, className = '' }) {
  return (
    <div className={`
      p-6 rounded-3xl 
      bg-white/[0.02] border border-white/[0.08] 
      backdrop-blur-xl
      hover:bg-white/[0.04] 
      transition-all duration-300
      ${className}
    `}>
      {children}
    </div>
  )
}

// Activity Item
function ActivityItem({ time, text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/70 truncate">{text}</p>
      </div>
      <span className="text-xs text-white/30 flex-shrink-0">{time}</span>
    </div>
  )
}