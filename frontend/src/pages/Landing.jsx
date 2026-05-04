import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Sparkles, Database, Shield, Zap, ArrowRight,
  ChevronDown, Star, Users
} from 'lucide-react'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
}

// Glassmorphic Navbar
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-black/60 backdrop-blur-2xl border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
            <Database className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">Intelli-Migrate</span>
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
      </div>
    </motion.nav>
  )
}

// Hero Section
function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-white/80">AI-Powered Data Migration</span>
            </div>
          </motion.div>
          
          {/* Main Headline */}
          <motion.h1 
            variants={fadeInUp}
            className="text-6xl md:text-8xl font-black text-white tracking-tight leading-[0.9]"
          >
            Transform NoSQL
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              to SQL Magic
            </span>
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p 
            variants={fadeInUp}
            className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto font-medium"
          >
            5 AI agents work together to parse, map, detect anomalies, normalize, 
            and generate production-ready SQL in seconds.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link 
              to="/signup"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-2xl shadow-white/20"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-8 pt-12"
          >
            {[
              { icon: Users, value: '5', label: 'AI Agents' },
              { icon: Database, value: '3NF', label: 'Normalization' },
              { icon: Star, value: '91%', label: 'Mapping Accuracy' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 text-white/60">
                <stat.icon className="w-5 h-5" />
                <span className="text-2xl font-bold text-white">{stat.value}</span>
                <span className="font-medium">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-8 h-8 text-white/30" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// Features Section
function Features() {
  const features = [
    {
      icon: Zap,
      title: 'Intelligent Parsing',
      description: 'Auto-detect JSON, XML, CSV with nested structure handling and schema drift detection.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Sparkles,
      title: 'NLP Schema Mapping',
      description: 'Sentence transformers (all-MiniLM-L6-v2) map messy column names to standardized SQL schemas.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Anomaly Detection',
      description: 'IsolationForest ML detects data quality issues, outliers, and invalid formats.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: Database,
      title: '3NF Normalization',
      description: 'Automatic table decomposition with foreign key relationships and constraint generation.',
      gradient: 'from-purple-500 to-pink-500'
    },
  ]
  
  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.p variants={fadeInUp} className="text-blue-400 font-semibold mb-4">FEATURES</motion.p>
          <motion.h2 variants={fadeInUp} className="text-5xl md:text-6xl font-black text-white tracking-tight">
            5 AI Agents.<br />One Platform.
          </motion.h2>
        </motion.div>
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="grid md:grid-cols-2 gap-6"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={scaleIn}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl hover:bg-white/[0.06] transition-all duration-500"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/50 text-lg leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorks() {
  const steps = [
    { step: '01', title: 'Upload Your Data', description: 'Drag & drop JSON, CSV, or XML files. Our parser handles nested structures automatically.' },
    { step: '02', title: 'AI Analyzes Schema', description: 'NLP maps columns, ML detects anomalies, and algorithms normalize to 3NF.' },
    { step: '03', title: 'Review & Export', description: 'Preview generated SQL, fix any issues, and deploy to your managed PostgreSQL.' },
  ]
  
  return (
    <section id="how-it-works" className="py-32 relative">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.p variants={fadeInUp} className="text-purple-400 font-semibold mb-4">HOW IT WORKS</motion.p>
          <motion.h2 variants={fadeInUp} className="text-5xl md:text-6xl font-black text-white tracking-tight">
            Three Simple Steps
          </motion.h2>
        </motion.div>
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-8"
        >
          {steps.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              whileHover={{ x: 10 }}
              className="group flex gap-8 p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500"
            >
              <div className="text-6xl font-black text-white/10 group-hover:text-blue-500/30 transition-colors">
                {item.step}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/50 text-lg">{item.description}</p>
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
    <footer className="py-16 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-white">Intelli-Migrate</span>
          </div>
          
          <div className="flex items-center gap-8 text-white/50">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="https://github.com" className="hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
          
          <p className="text-white/30 text-sm">© 2024 Intelli-Migrate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// Main Landing Page Component
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
