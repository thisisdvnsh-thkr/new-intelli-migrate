import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, ArrowRight, ChevronDown, Workflow, Bot, ShieldCheck, LineChart, DatabaseZap, Cpu, Rocket, HelpCircle
} from 'lucide-react'
import BrandLogo from '../components/BrandLogo'

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

        <div className="hidden lg:flex items-center gap-7">
          <a href="#features" className="text-white/70 hover:text-white font-medium transition-colors">Features</a>
          <a href="#how-it-works" className="text-white/70 hover:text-white font-medium transition-colors">How it Works</a>
          <a href="#use-cases" className="text-white/70 hover:text-white font-medium transition-colors">Use Cases</a>
          <a href="#architecture" className="text-white/70 hover:text-white font-medium transition-colors">Architecture</a>
          <a href="#faqs" className="text-white/70 hover:text-white font-medium transition-colors">FAQs</a>
          <a href="#support" className="text-white/70 hover:text-white font-medium transition-colors">Support</a>
        </div>

        <Link
          to="/login"
          className="px-5 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-white/90 hover:scale-105 transition-all duration-300"
        >
          Sign In
        </Link>
      </div>
    </motion.nav>
  )
}

function LiveBackdrop() {
  const bars = Array.from({ length: 22 }, (_, i) => i)
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.22)_0%,transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.2)_0%,transparent_40%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:100%_38px] opacity-30" />
      <div className="absolute -left-10 top-1/3 flex gap-2 opacity-40">
        {bars.map((i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-gradient-to-b from-blue-400 to-purple-500"
            style={{ height: 30 + (i % 6) * 16 }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -7, 0] }}
            transition={{ duration: 1.7 + (i % 5) * 0.25, repeat: Infinity }}
          />
        ))}
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <LiveBackdrop />
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

          <motion.div variants={fadeInUp} className="grid sm:grid-cols-4 gap-4 pt-12">
            {[
              { label: 'AI Agents', value: '5' },
              { label: 'Normalization', value: '3NF' },
              { label: 'Confidence Mapping', value: '91%' },
              { label: 'Supported Inputs', value: 'JSON/CSV/XML' }
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

function UseCases() {
  const cards = [
    { icon: DatabaseZap, title: 'E-commerce migration', text: 'Move orders, users, inventory from nested NoSQL docs to clean SQL tables.' },
    { icon: Cpu, title: 'SaaS analytics pipelines', text: 'Normalize event streams and usage logs for BI dashboards and reporting.' },
    { icon: Rocket, title: 'Production cutover prep', text: 'Detect anomalies early and generate deployment-ready SQL scripts.' }
  ]

  return (
    <section id="use-cases" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-12 text-center">Use Cases</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((card) => (
            <div key={card.title} className="p-6 rounded-3xl bg-white/[0.03] border border-white/10">
              <card.icon className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
              <p className="text-white/55">{card.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Architecture() {
  return (
    <section id="architecture" className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-10 text-center">Architecture Snapshot</h2>
        <div className="grid md:grid-cols-5 gap-3">
          {['Parser', 'Mapper', 'Anomaly', 'Normalizer', 'SQL Generator'].map((item, index) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-xs text-white/35 mb-1">Agent {index + 1}</p>
              <p className="font-bold text-white">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function QuickFaq() {
  const faqs = [
    'What does schema confidence mean?',
    'Can I deploy to Supabase/Render/Neon?',
    'Will sessions remain visible in sidebar history?'
  ]
  return (
    <section id="faqs" className="py-20">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-10 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-white/85 font-semibold">
              {faq}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer id="support" className="py-14 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5">
        <BrandLogo textSize="text-lg" />
        <div className="flex items-center gap-6 text-white/50">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
          <a href="mailto:thisisdvnsh.thkr@gmail.com" className="hover:text-white transition-colors inline-flex items-center gap-1">
            <HelpCircle className="w-4 h-4" />
            Support
          </a>
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
      <UseCases />
      <Architecture />
      <QuickFaq />
      <Footer />
    </div>
  )
}
