import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle, Book, MessageCircle, Mail, ChevronDown, ChevronRight, Upload, Database, AlertTriangle, Sparkles, Cloud, Zap, Users, ExternalLink
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

const supportEmail = 'thisisdvnsh.thkr@gmail.com'
const projectRepo = 'https://github.com/thisisdvnsh-thkr/new-intelli-migrate'

const teamMembers = [
  { name: 'Devansh', role: 'Agent 5: SQL Generator + Integration' },
  { name: 'Arpit', role: 'Agent 1: Parser Engine + Frontend' },
  { name: 'Prashant', role: 'Agent 2: NLP Schema Mapper' },
  { name: 'Mohd Suhail', role: 'Agent 3: Anomaly Detector' },
  { name: 'Priyanshu', role: 'Agent 4: Normalizer' }
]

const faqs = [
  {
    question: 'What does confidence mean in schema mapping?',
    answer: 'Confidence is the AI score for how strongly a source field matches a standardized SQL field. High confidence means semantic certainty; lower scores should be reviewed.'
  },
  {
    question: 'Which data formats can I upload?',
    answer: 'JSON, CSV, and XML are supported. The platform parses the file and previews rows, columns, and schema details before mapping.'
  },
  {
    question: 'Can I deploy directly to every database?',
    answer: 'Direct deploy currently supports PostgreSQL providers (Render, Supabase, Neon, Railway, generic Postgres). For Microsoft Access, download SQL and import manually.'
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
    description: 'Understanding interactive confidence and field mapping',
    steps: ['Run mapping', 'Review confidence bars', 'Confirm mapped fields', 'Move to anomaly scan']
  },
  {
    title: 'Anomaly Detection',
    icon: AlertTriangle,
    description: 'Data quality and severity visualization',
    steps: ['Run detector', 'Review severity distribution', 'Inspect flagged records', 'Continue to SQL generation']
  },
  {
    title: 'Deployment',
    icon: Cloud,
    description: 'Deploy to chosen database provider',
    steps: ['Configure provider in Settings', 'Add DB URL/API key', 'Run Deploy', 'Verify tables in dashboard']
  },
  {
    title: 'Upload & Preview',
    icon: Upload,
    description: 'Visual preview and metadata',
    steps: ['Upload file', 'Inspect rows/cols/size', 'Check detected columns', 'Continue to mapping']
  },
  {
    title: 'SQL Output',
    icon: Database,
    description: 'Generated DDL + DML scripts',
    steps: ['Generate SQL', 'Review stats', 'Copy/download script', 'Deploy or import manually']
  }
]

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null)
  const [selectedGuide, setSelectedGuide] = useState(null)

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
      <motion.header variants={fadeInUp}>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Help Center</h1>
        <p className="text-lg text-white/50 font-medium">Guides, FAQs, and Team Intelli-Migrate support.</p>
      </motion.header>

      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard icon={Book} label="Documentation" href="#guides" />
        <ActionCard icon={MessageCircle} label="FAQs" href="#faqs" />
        <ActionCard icon={Mail} label="Contact Support" href={`mailto:${supportEmail}`} />
      </motion.div>

      <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-300" />
          <h2 className="text-2xl font-bold text-white">Team Intelli-Migrate</h2>
        </div>
        <img
          src="/team-photo.png"
          alt="Team Intelli-Migrate group photo"
          className="w-full max-w-4xl rounded-2xl border border-white/10 mb-6"
        />
        <div className="grid md:grid-cols-2 gap-3">
          {teamMembers.map((member) => (
            <div key={member.name} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08]">
              <p className="text-white font-semibold">{member.name}</p>
              <p className="text-sm text-white/45">{member.role}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={projectRepo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Project Repository
          </a>
          <a href={`mailto:${supportEmail}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors">
            <Mail className="w-4 h-4" />
            {supportEmail}
          </a>
        </div>
      </motion.section>

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

function ActionCard({ icon: Icon, label, href }) {
  return (
    <a
      href={href}
      className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-blue-300" />
      </div>
      <span className="text-lg font-semibold text-white">{label}</span>
    </a>
  )
}
