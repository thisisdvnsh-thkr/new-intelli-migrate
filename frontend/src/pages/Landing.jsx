import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import HeroFluidView from '../components/HeroFluidView';
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Sparkles, ArrowRight, ChevronDown, Workflow, Bot, ShieldCheck, LineChart,
  DatabaseZap, Cpu, Rocket, HelpCircle, MessageCircle
} from 'lucide-react'
import BrandLogo from '../components/BrandLogo'
import GlassCard from '../components/ui/GlassCard'
import Noise from '../components/ui/Noise'
import Aurora from '../components/ui/Aurora'

// Lazy-load 3D scenes so the LCP isn't blocked
const HeroScene = lazy(() => import('../components/three/HeroScene'))
const SectionScene = lazy(() => import('../components/three/SectionScene'))

const fadeInUp = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
}
const stagger = { visible: { transition: { staggerChildren: 0.08 } } }

function openSupportChat() {
  window.dispatchEvent(new Event('open-support-chat'))
}

/* ---------------- NAVBAR ---------------- */
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
        scrolled ? 'border-b border-white/10' : ''
      }`}
    >
      <div
        className={`mx-auto max-w-7xl mt-3 rounded-full px-6 py-3 flex items-center justify-between transition-all
        ${scrolled ? 'glass-card' : 'bg-transparent'}`}
      >
        <Link to="/" className="group"><BrandLogo /></Link>

        <div className="hidden lg:flex items-center gap-7">
          {[
            ['Features', '#features'],
            ['How it Works', '#how-it-works'],
            ['Use Cases', '#use-cases'],
            ['Architecture', '#architecture'],
            ['FAQs', '#faqs']
          ].map(([label, href]) => (
            <a key={href} href={href} className="text-white/70 hover:text-white text-sm font-medium transition-colors">
              {label}
            </a>
          ))}
          <a href="javascript:void(0)" onClick={() => { if (window.toggleIntelliChat) window.toggleIntelliChat(); }} className="text-white/70 hover:text-white text-sm font-medium inline-flex items-center gap-1">
            <MessageCircle className="w-4 h-4" /> Support
          </a>
        </div>

        <Link to="/login" className="btn-glass !py-2 !px-5 text-sm">Sign In</Link>
      </div>
    </motion.nav>
  )
}

/* ---------------- HERO ---------------- */
function Hero() {
  const mouse = useRef({ x: 0, y: 0 })
  const containerRef = useRef(null)

  useEffect(() => {
    const onMove = (e) => {
      const w = window.innerWidth
      const h = window.innerHeight
      mouse.current.x = (e.clientX / w) * 2 - 1
      mouse.current.y = (e.clientY / h) * 2 - 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const textOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden pt-28 pb-24">
      {/* 3D layer */}
      <div className="absolute inset-0">
        <Suspense fallback={<div className="absolute inset-0 bg-black" />}>
          <HeroScene mouse={mouse} />
        </Suspense>
      </div>

      {/* Soft top/bottom fades so it blends with following sections */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent z-10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent z-10" />

      {/* Foreground content */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-20 max-w-6xl mx-auto px-6 text-center"
      >
        <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
          <motion.div variants={fadeInUp} className="flex justify-center">
            <div className="ring-conic inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm">
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span className="text-white/85 font-medium">Production-grade AI migration platform</span>
            </div>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-balance text-[clamp(2.6rem,7vw,6.5rem)] font-black text-white tracking-tight leading-[0.95]"
          >
            Move NoSQL data
            <br />
            <span className="gradient-text">into SQL-ready systems</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-pretty text-lg md:text-2xl text-white/65 max-w-3xl mx-auto font-medium"
          >
            Intelli-Migrate runs a 5-agent pipeline for parsing, schema mapping, anomaly checks,
            normalization, and SQL generation with a guided live session experience.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/signup" className="btn-glass group">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works" className="btn-glass-outline group">
              See how it works
              <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </a>
          </motion.div>

          <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-14 max-w-4xl mx-auto">
            {[
              { label: 'AI Agents', value: '5' },
              { label: 'Normalization', value: '3NF' },
              { label: 'Confidence Mapping', value: '91%' },
              { label: 'Supported Inputs', value: 'JSON/CSV/XML' }
            ].map((item) => (
              <div key={item.label} className="ring-conic glass-card rounded-2xl p-4">
                <div className="text-3xl font-black gradient-text">{item.value}</div>
                <div className="text-white/65 font-medium text-sm">{item.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeInUp} className="flex justify-center pt-4">
            <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <ChevronDown className="w-7 h-7 text-white/40" />
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ---------------- FEATURES ---------------- */
function Features() {
  const features = [
    { icon: Workflow, title: 'Session-first workspace', description: 'A migration history lets users reopen prior file sessions instantly.', gradient: 'from-cyan-400 to-blue-600' },
    { icon: Bot, title: '5-agent orchestration', description: 'Specialized agents collaborate through the full migration chain with progress-aware UX.', gradient: 'from-violet-400 to-fuchsia-600' },
    { icon: ShieldCheck, title: 'Reliable validation', description: 'Anomaly checks and schema confidence scoring reduce production migration risk.', gradient: 'from-emerald-400 to-green-600' },
    { icon: LineChart, title: 'Visual pipeline analytics', description: 'Interactive cards show row/column counts, file metadata, and live stage transitions.', gradient: 'from-orange-400 to-rose-600' }
  ]

  return (
    <section id="features" className="relative py-32">
      <Aurora />
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="text-center mb-20">
          <motion.p variants={fadeInUp} className="text-blue-300 font-semibold tracking-widest text-sm mb-4">FEATURES</motion.p>
          <motion.h2 variants={fadeInUp} className="text-5xl md:text-6xl font-black text-white tracking-tight">
            Built for <span className="gradient-text">real migrations</span>
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={stagger} className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeInUp}>
              <GlassCard className="p-8 h-full">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-6 shadow-lg shadow-black/30`}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-white/65 text-lg leading-relaxed">{f.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ---------------- HOW IT WORKS ---------------- */
function HowItWorks() {
  const steps = [
    { step: '01', title: 'Upload and preview', description: 'Drop JSON, CSV, or XML, review instant metadata and inferred structure.' },
    { step: '02', title: 'Run AI pipeline', description: 'Agents map schema, detect anomalies, normalize to 3NF, and generate SQL.' },
    { step: '03', title: 'Deploy to target DB', description: 'Send SQL to your configured database provider from the deploy stage.' }
  ]

  return (
    <section id="how-it-works" className="relative py-32">
      <div className="absolute inset-0 mask-fade-b opacity-60">
        <Suspense fallback={null}>
          <SectionScene shape="torus" tint="#a78bfa" />
        </Suspense>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-16">
          <motion.p variants={fadeInUp} className="text-purple-300 font-semibold tracking-widest text-sm mb-4">HOW IT WORKS</motion.p>
          <motion.h2 variants={fadeInUp} className="text-5xl md:text-6xl font-black text-white tracking-tight">
            Three <span className="gradient-text">precise stages</span>
          </motion.h2>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-5">
          {steps.map((item) => (
            <motion.div key={item.step} variants={fadeInUp}>
              <GlassCard className="p-7" tiltStrength={5}>
                <div className="flex gap-6 items-start">
                  <div className="text-5xl font-black text-white/20">{item.step}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-white/65 text-lg">{item.description}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ---------------- USE CASES ---------------- */
function UseCases() {
  const cards = [
    { icon: DatabaseZap, title: 'E-commerce migration', text: 'Move orders, users, inventory from nested NoSQL docs to clean SQL tables.' },
    { icon: Cpu, title: 'SaaS analytics pipelines', text: 'Normalize event streams and usage logs for BI dashboards and reporting.' },
    { icon: Rocket, title: 'Production cutover prep', text: 'Detect anomalies early and generate deployment-ready SQL scripts.' }
  ]

  return (
    <section id="use-cases" className="relative py-24">
      <Aurora />
      <div className="relative max-w-6xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-14 text-center">
          <span className="gradient-text">Use Cases</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <GlassCard key={c.title} className="p-7">
              <c.icon className="w-9 h-9 text-blue-300 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{c.title}</h3>
              <p className="text-white/65">{c.text}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- ARCHITECTURE ---------------- */
function Architecture() {
  const agents = [
    {
      title: 'Intelligent Payload Parser',
      description:
        'Engineered for deep-parsing complex multi-format unstructured payloads (JSON, CSV, XML) into safe, intermediate data trees with zero data corruption.'
    },
    {
      title: 'Semantic Schema Mapper',
      description:
        'Utilizes semantic NLP token analysis to map source fields directly to relational database columns with high structural parity confidence scores.'
    },
    {
      title: 'Real-time Anomaly Guardian',
      description:
        'Monitors runtime data streams to instantly isolate structural outliers, malformed database types, and schema configuration drift prior to commit cycles.'
    },
    {
      title: 'Relational Structure Normalizer',
      description:
        'Executes continuous schema optimization rules and entity resolution matches to protect integrity constraints across target relational tables.'
    },
    {
      title: 'Automated SQL Architect',
      description:
        'Outputs production‑grade, optimized DDL and DML data scripts equipped with end‑to‑end lineage maps and comprehensive tracking audit trails.'
    }
  ]
  return (
    <section id="architecture" className="relative py-28">
      <div className="absolute inset-0 mask-fade-b opacity-50">
        <Suspense fallback={null}>
          <SectionScene shape="ico" tint="#ec4899" />
        </Suspense>
      </div>
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-12 text-center">
          <span className="gradient-text">Architecture Snapshot</span>
        </h2>
        <div className="grid md:grid-cols-5 gap-4">
          {agents.map((item, idx) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
            >
              <GlassCard className="p-5 text-center" tiltStrength={6}>
                <p className="text-xs text-white/40 mb-1 tracking-widest">AGENT {idx + 1}</p>
                <p className="font-bold text-white">{item.title}</p>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- FAQ ---------------- */
function QuickFaq() {
  const faqs = [
    { q: 'What does schema confidence mean?', a: 'Confidence is the match certainty for field mapping. Higher confidence means stronger semantic alignment from source to target SQL field.' },
    { q: 'Can I deploy to Supabase/Render/Neon?', a: 'Yes. You can configure provider details in profile database connection and deploy from the final pipeline stage.' },
    { q: 'Will sessions remain visible in sidebar history?', a: 'Yes. Each uploaded file creates a session entry that can be reselected for quick context restore.' },
    { q: 'How does forgot password work?', a: 'Use the forgot password link on login. A secure reset link is emailed and expires automatically.' },
    { q: 'Can I use custom PostgreSQL/MySQL?', a: 'Yes, with custom connection strings. We recommend dedicated restricted DB users for platform access.' },
    { q: 'Does Intelli-Migrate support large files?', a: 'It supports large files, but free-tier backend constraints can reduce performance. Use chunking and streaming-friendly infrastructure for best results.' },
    { q: 'Do I receive migration notifications?', a: 'If notifications are enabled in profile settings, you receive account and migration event emails.' },
    { q: 'What if support bot cannot answer?', a: 'Support chat provides a GitHub issues redirect so you can submit comments and suggestions directly to the team.' }
  ]
  const [open, setOpen] = useState(null)

  return (
    <section id="faqs" className="relative py-28">
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-12 text-center">
          Frequently Asked <span className="gradient-text">Questions</span>
        </h2>
        <div className="space-y-3">
          {faqs.map((item, idx) => (
            <GlassCard key={item.q} className="overflow-hidden" tiltStrength={2}>
              <button
                onClick={() => setOpen(open === idx ? null : idx)}
                className="w-full text-left px-6 py-5 text-white font-semibold flex items-center justify-between"
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-white/60 transition-transform duration-300 ${open === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {open === idx && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="px-6 pb-5 text-white/70"
                  >
                    {item.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------------- CTA ---------------- */
function FinalCTA() {
  return (
    <section className="relative py-32">
      <Aurora />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <GlassCard className="p-12 md:p-16" tiltStrength={4}>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Ready to <span className="gradient-text">migrate intelligently?</span>
          </h2>
          <p className="text-white/65 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Spin up a session, drop a messy dataset, and watch the 5 agents do the work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn-glass group">
              Create free account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-glass-outline">Sign in</Link>
          </div>
        </GlassCard>
      </div>
    </section>
  )
}

/* ---------------- FOOTER ---------------- */
function Footer() {
  return (
    <footer id="support" className="relative py-14 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-5">
        <BrandLogo textSize="text-lg" />
        <div className="flex items-center gap-6 text-white/55 text-sm">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
          <a href="javascript:void(0)" onClick={() => { if (window.toggleIntelliChat) window.toggleIntelliChat(); }} className="hover:text-white transition-colors inline-flex items-center gap-1">
            <HelpCircle className="w-4 h-4" /> Support
          </a>
        </div>
        <p className="text-white/35 text-sm">© 2026 Intelli-Migrate</p>
      </div>
    </footer>
  )
}

/* ---------------- PAGE ---------------- */
export default function Landing() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      <Noise opacity={0.05} />
      <Navbar />
      <HeroFluidView />
      <Features />
      <HowItWorks />
      <UseCases />
      <Architecture />
      <QuickFaq />
      <FinalCTA />
      <Footer />
    </div>
  )
}
