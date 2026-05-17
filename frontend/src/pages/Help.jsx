import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Book, MessageCircle, ChevronDown, ChevronRight, Upload, Database, AlertTriangle, Sparkles, Cloud, Zap } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

const faqs = [
  {
    question: 'What does confidence mean in schema mapping?',
    answer: 'Confidence is the semantic match score between source and target field names. High confidence means the mapping is highly reliable.'
  },
  {
    question: 'Which data formats can I upload?',
    answer: 'JSON, CSV, and XML are supported. Upload page parses file structure and displays a schema preview.'
  },
  {
    question: 'How do I recover my account password?',
    answer: 'Use Forgot Password on login. The platform sends a time-limited reset link to your registered email.'
  },
  {
    question: 'How can I contact the development team?',
    answer: 'Open Contact Support to view team info and direct GitHub comments/suggestions channel.'
  },
  {
    question: 'Can I use custom PostgreSQL/MySQL?',
    answer: 'Yes. Configure custom connection string in user profile database section and use restricted DB credentials.'
  },
  {
    question: 'Where can I see project report and research?',
    answer: 'Open Documentation from this page. It is prepared for interactive report and research display.'
  }
]

const guides = [
  {
    title: 'Getting Started',
    icon: Zap,
    description: 'Upload, map, detect anomalies, generate SQL, deploy',
    steps: ['Upload file', 'Review preview', 'Run 5-agent pipeline', 'Deploy or download SQL']
  },
  {
    title: 'Schema Mapping',
    icon: Sparkles,
    description: 'Understanding confidence and field mapping',
    steps: ['Run mapping', 'Review confidence bars', 'Confirm mapped fields', 'Continue to anomalies']
  },
  {
    title: 'Anomaly Detection',
    icon: AlertTriangle,
    description: 'Data quality and severity visualization',
    steps: ['Run detector', 'Inspect flagged records', 'Review quality score', 'Continue to SQL']
  },
  {
    title: 'Deployment',
    icon: Cloud,
    description: 'Deploy to your selected provider',
    steps: ['Configure provider in profile', 'Add key/connection', 'Run Deploy', 'Verify tables']
  },
  {
    title: 'Upload & Parse',
    icon: Upload,
    description: 'Visual preview and metadata extraction',
    steps: ['Upload file', 'Watch extraction visual', 'Check rows/cols', 'Continue to mapping']
  },
  {
    title: 'SQL Output',
    icon: Database,
    description: 'Generated DDL + DML scripts',
    steps: ['Generate SQL', 'Copy/download scripts', 'Auto-save support', 'Deploy or import']
  }
]

export default function Help() {
  const location = useLocation()
  const [openFaq, setOpenFaq] = useState(null)
  const [selectedGuide, setSelectedGuide] = useState(null)
  
  useEffect(() => {
    if (!location.hash) return
    const target = document.querySelector(location.hash)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
      <motion.header variants={fadeInUp}>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Help Center</h1>
        <p className="text-lg text-white/50 font-medium">Guides, FAQs, and direct support paths.</p>
      </motion.header>

      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard icon={Book} label="Documentation" to="/documentation" />
        <ActionCard icon={MessageCircle} label="FAQs" to="/help#faqs" onClick={() => {
          const target = document.getElementById('faqs')
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }} />
        <ActionCard icon={HelpCircle} label="Contact Support" to="/contact-support" />
      </motion.div>

      <motion.section variants={fadeInUp} id="guides">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Book className="w-6 h-6 text-blue-400" />
          Quick Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide, i) => (
            <motion.button
              key={guide.title}
              onClick={() => setSelectedGuide(selectedGuide === i ? null : i)}
              whileHover={{ scale: 1.01 }}
              className={`p-6 rounded-3xl text-left transition-all duration-300 ${
                selectedGuide === i
                  ? 'bg-blue-500/10 border-2 border-blue-500/30'
                  : 'bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                  <guide.icon className="w-5 h-5 text-blue-400" />
                </div>
                <ChevronRight className={`w-5 h-5 text-white/30 transition-transform ${selectedGuide === i ? 'rotate-90' : ''}`} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{guide.title}</h3>
              <p className="text-sm text-white/40">{guide.description}</p>
              <AnimatePresence>
                {selectedGuide === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/10"
                  >
                    <ul className="space-y-2">
                      {guide.steps.map((step, idx) => (
                        <li key={step} className="text-sm text-white/60 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center justify-center">{idx + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </motion.section>

      <motion.section variants={fadeInUp} id="faqs">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-purple-400" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={faq.question} className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-semibold text-white">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-white/30 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-white/50 leading-relaxed">{faq.answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  )
}

function ActionCard({ icon: Icon, label, to, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-blue-300" />
      </div>
      <span className="text-lg font-semibold text-white">{label}</span>
    </Link>
  )
}
