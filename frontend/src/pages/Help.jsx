import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HelpCircle, Book, MessageCircle, Mail, ChevronDown, ChevronRight,
  Upload, Database, AlertTriangle, Sparkles, Cloud, Zap, ExternalLink
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

const faqs = [
  {
    question: "What file formats are supported?",
    answer: "Intelli-Migrate supports JSON, CSV, and XML file formats. Our AI parser automatically detects the schema and handles nested structures, arrays, and complex data types."
  },
  {
    question: "How does the NLP schema mapping work?",
    answer: "We use sentence-transformers (all-MiniLM-L6-v2) to convert your messy column names into semantic embeddings. These are then matched against standard SQL column names with 95%+ accuracy."
  },
  {
    question: "What is anomaly detection?",
    answer: "Our IsolationForest ML model scans your data for outliers, missing values, invalid formats, and data quality issues. It flags problems before migration so you can fix them."
  },
  {
    question: "What is 3NF normalization?",
    answer: "Third Normal Form (3NF) is a database design principle that eliminates redundancy. Our AI automatically decomposes your flat data into properly normalized tables with foreign key relationships."
  },
  {
    question: "How do I deploy to Render Postgres?",
    answer: "After generating SQL, click 'Deploy'. The backend will push DDL/DML to your managed PostgreSQL (Render). Ensure your Render DATABASE_URL is configured in the backend."
  },
  {
    question: "Is my data secure?",
    answer: "Yes! Your data is processed securely on the server. We use SSL for transfers, tokens for auth, and you can delete your session data at any time."
  }
]

const guides = [
  {
    title: "Getting Started",
    icon: Zap,
    description: "Learn the basics of Intelli-Migrate",
    steps: ["Upload your data file", "Select your domain", "Run through the 6-step pipeline", "Deploy to your database"]
  },
  {
    title: "File Upload",
    icon: Upload,
    description: "How to prepare and upload your data",
    steps: ["Support for JSON, CSV, XML", "Max file size: 100MB", "Nested structures are auto-flattened", "Select the right domain for best results"]
  },
  {
    title: "Schema Mapping",
    icon: Sparkles,
    description: "Understanding AI-powered column mapping",
    steps: ["NLP maps messy names to SQL standards", "Review mappings with confidence scores", "Edit any incorrect mappings", "Proceed when satisfied"]
  },
  {
    title: "Anomaly Detection",
    icon: AlertTriangle,
    description: "Catching data quality issues",
    steps: ["ML scans for outliers", "Flags missing/invalid data", "Shows severity levels", "Fix issues before migration"]
  },
  {
    title: "SQL Generation",
    icon: Database,
    description: "Creating normalized database scripts",
    steps: ["Auto-generates DDL statements", "Creates proper table relationships", "Includes INSERT statements", "Download or copy SQL"]
  },
  {
    title: "Cloud Deployment",
    icon: Cloud,
    description: "Deploying to managed PostgreSQL",
    steps: ["Connect your managed Postgres (Render)", "Tables created automatically by backend", "Data inserted in batches", "View in your database dashboard"]
  }
]

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null)
  const [selectedGuide, setSelectedGuide] = useState(null)

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
          Help Center
        </h1>
        <p className="text-lg text-white/50 font-medium">
          Guides, FAQs, and support resources
        </p>
      </motion.header>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Book, label: "Documentation", href: "#guides", color: "blue" },
          { icon: MessageCircle, label: "FAQs", href: "#faqs", color: "purple" },
          { icon: Mail, label: "Contact Support", href: "mailto:support@intelli-migrate.com", color: "green" }
        ].map((item, i) => (
          <motion.a
            key={i}
            href={item.href}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-6 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] transition-all duration-300 flex items-center gap-4`}
          >
            <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center`}>
              <item.icon className={`w-6 h-6 text-${item.color}-400`} />
            </div>
            <span className="text-lg font-semibold text-white">{item.label}</span>
          </motion.a>
        ))}
      </motion.div>

      {/* Guides */}
      <motion.section variants={fadeInUp} id="guides">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Book className="w-6 h-6 text-blue-400" />
          Quick Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide, i) => (
            <motion.button
              key={i}
              onClick={() => setSelectedGuide(selectedGuide === i ? null : i)}
              whileHover={{ scale: 1.01 }}
              className={`p-6 rounded-3xl text-left transition-all duration-300 ${
                selectedGuide === i 
                  ? 'bg-blue-500/10 border-2 border-blue-500/30' 
                  : 'bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
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
                      {guide.steps.map((step, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-400 font-bold">
                            {j + 1}
                          </div>
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

      {/* FAQs */}
      <motion.section variants={fadeInUp} id="faqs">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <HelpCircle className="w-6 h-6 text-purple-400" />
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="rounded-2xl bg-white/[0.02] border border-white/[0.08] overflow-hidden"
            >
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
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Contact */}
      <motion.section variants={fadeInUp} className="rounded-3xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Still need help?</h2>
        <p className="text-white/50 mb-6">Our support team is here to assist you</p>
        <a
          href="mailto:support@intelli-migrate.com"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-all"
        >
          <Mail className="w-5 h-5" />
          Contact Support
        </a>
      </motion.section>
    </motion.div>
  )
}
