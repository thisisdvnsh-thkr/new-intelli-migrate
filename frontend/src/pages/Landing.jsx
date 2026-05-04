import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sparkles, Database, Shield, Zap, ArrowRight,
  ChevronDown, Star, Users
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'bg-black/70 backdrop-blur-2xl border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="group">
          <BrandLogo />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-white/60 hover:text-white font-medium transition-colors">Features</a>
          <a href="#how-it-works" className="text-white/60 hover:text-white font-medium transition-colors">How it Works</a>
        </div>
        
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-white/80 hover:text-white font-semibold transition-colors">
            Sign In
          </Link>
          <Link 
            to="/signup" 
            className="px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-white/90 hover:scale-105 transition-all duration-300"
          >
            Get Started
          </Link>
        </div>

        <Link to="/login" className="text-white/80 hover:text-white font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </motion.nav>
  )
}

function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-blue-500/25 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-16 right-0 w-[32rem] h-[32rem] bg-purple-500/25 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12)_0%,transparent_55%)]" />

      <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
          <motion.div variants={fadeInUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white/80">Production-grade AI migration platform</span>
            </div>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-black text-white tracking-tight leading-[0.9]">
            Move NoSQL data
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              into SQL-ready systems
            </span>
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-white/55 max-w-3xl mx-auto font-medium">
            Intelli-Migrate runs a 5-agent pipeline for parsing, schema mapping, anomaly checks, normalization, and SQL generation with a guided live session experience.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to="/signup"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-2xl shadow-white/20"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid sm:grid-cols-3 gap-4 pt-12">
            {[
              { label: 'AI Agents', value: '5' },
              { label: 'Normalization', value: '3NF' },
              { label: 'Confidence Mapping', value: '91%' }
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                <div className="text-3xl font-black text-white">{item.value}</div>
                <div className="text-white/60 font-medium">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown className="w-8 h-8 text-white/30" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    {
      icon: Workflow,
      title: 'Session-first workspace',
      description: 'A migration history lets users reopen prior file sessions instantly.',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      icon: Bot,
      title: '5-agent orchestration',
      description: 'Specialized agents collaborate through the full migration chain with progress-aware UX.',
      gradient: 'from-violet-500 to-fuchsia-600'
    },
    {
      icon: ShieldCheck,
      title: 'Reliable validation',
      description: 'Anomaly checks and schema confidence scoring reduce production migration risk.',
      gradient: 'from-emerald-500 to-green-600'
    },
    {
      icon: LineChart,
      title: 'Visual pipeline analytics',
      description: 'Interactive cards show row/column counts, file metadata, and live stage transitions.',
      gradient: 'from-orange-500 to-rose-600'
    }
  ]

  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-20">
          <motion.p variants={fadeInUp} className="text-blue-400 font-semibold mb-4">FEATURES</motion.p>
          <motion.h2 variants={fadeInUp} className="text-5xl md:text-6xl font-black text-white tracking-tight">
            Built for real migrations
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="grid md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-500"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/55 text-lg leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { step: '01', title: 'Upload and preview', description: 'Drop JSON, CSV, or XML, review instant metadata and inferred structure.' },
    { step: '02', title: 'Run AI pipeline', description: 'Agents map schema, detect anomalies, normalize to 3NF, and generate SQL.' },
    { step: '03', title: 'Deploy to target DB', description: 'Send SQL to your configured database provider from the deploy stage.' }
  ]

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
          <motion.p variants={fadeInUp} className="text-purple-400 font-semibold mb-4">HOW IT WORKS</motion.p>
          <motion.h2 variants={fadeInUp} className="text-5xl md:text-6xl font-black text-white tracking-tight">
            Three precise stages
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-6">
          {steps.map((item) => (
            <motion.div
              key={item.step}
              variants={fadeInUp}
              whileHover={{ x: 8 }}
              className="group flex gap-6 p-7 rounded-3xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.05] transition-all duration-500"
            >
              <div className="text-5xl font-black text-white/15 group-hover:text-blue-500/35 transition-colors">{item.step}</div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/55 text-lg">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  return (
    <footer className="py-14 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5">
        <BrandLogo textSize="text-lg" />
        <div className="flex items-center gap-6 text-white/50">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="https://github.com" className="hover:text-white transition-colors">GitHub</a>
        </div>
        <p className="text-white/30 text-sm">© 2024 Intelli-Migrate</p>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Footer />
    </div>
  )
}
