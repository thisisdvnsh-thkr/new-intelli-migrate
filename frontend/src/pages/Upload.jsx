import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMigration } from '../context/MigrationContext'
import { Upload as UploadIcon, File, X, Loader2, Check, ArrowRight, ShoppingCart, Heart, Wallet } from 'lucide-react'

const API_URL = 'https://new-intelli-migrate.onrender.com'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function Upload() {
  const navigate = useNavigate()
  const { setStats, setCurrentStep } = useMigration()
  const [file, setFile] = useState(null)
  const [domain, setDomain] = useState('ecommerce')
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else {
      setDragActive(false)
    }
  }, [])
  
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }, [])
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }
  
  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('domain', domain)
      
      const response = await fetch(API_URL + '/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      setStats(prev => ({
        ...prev,
        filesProcessed: prev.filesProcessed + 1,
        sessionId: data.session_id,
        recordsProcessed: data.data?.record_count || 0
      }))
      setCurrentStep(1)
      setSuccess(true)
      setTimeout(() => navigate('/schema-map'), 1500)
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const domains = [
    { id: 'ecommerce', label: 'E-Commerce', desc: 'Orders, products, customers', icon: ShoppingCart, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'healthcare', label: 'Healthcare', desc: 'Patient records, treatments', icon: Heart, gradient: 'from-pink-500 to-rose-500' },
    { id: 'finance', label: 'Finance', desc: 'Transactions, accounts', icon: Wallet, gradient: 'from-green-500 to-emerald-500' },
  ]
  
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-10"
    >
      {/* Header */}
      <motion.header variants={fadeInUp}>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
          Upload Data
        </h1>
        <p className="text-lg text-white/50 font-medium">
          Import your JSON, CSV, or XML files to begin the AI-powered migration
        </p>
      </motion.header>
      
      {/* Domain Selection */}
      <motion.section variants={fadeInUp} className="space-y-4">
        <label className="block text-sm font-semibold text-white/40 uppercase tracking-wider">
          Select Domain
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {domains.map((d) => {
            const Icon = d.icon
            const isSelected = domain === d.id
            return (
              <motion.button
                key={d.id}
                onClick={() => setDomain(d.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative p-6 rounded-3xl text-left transition-all duration-300 group
                  ${isSelected 
                    ? 'bg-white/[0.08] border-2 border-blue-500/50' 
                    : 'bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.05]'
                  }
                `}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${d.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-lg font-bold text-white mb-1">{d.label}</p>
                <p className="text-sm text-white/40">{d.desc}</p>
                {isSelected && (
                  <motion.div 
                    layoutId="domain-indicator"
                    className="absolute top-4 right-4 w-3 h-3 rounded-full bg-blue-500"
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.section>
      
      {/* Drop Zone */}
      <motion.section
        variants={fadeInUp}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative rounded-3xl p-12 md:p-16 text-center transition-all duration-300 cursor-pointer
          ${dragActive 
            ? 'bg-blue-500/10 border-2 border-dashed border-blue-500' 
            : file 
              ? 'bg-green-500/5 border-2 border-dashed border-green-500/50'
              : 'bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
          }
        `}
      >
        <input
          type="file"
          accept=".json,.csv,.xml"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        
        {file ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-green-500/20 flex items-center justify-center mb-6">
              <File className="w-10 h-10 text-green-400" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-white mb-2">{file.name}</p>
            <p className="text-white/40 mb-6">{(file.size / 1024).toFixed(1)} KB</p>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null) }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-300"
            >
              <X className="w-4 h-4" />
              Remove
            </button>
          </motion.div>
        ) : (
          <label htmlFor="file-upload" className="cursor-pointer block">
            <motion.div 
              className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <UploadIcon className="w-10 h-10 text-white/30" strokeWidth={1.5} />
            </motion.div>
            <p className="text-2xl font-bold text-white mb-2">
              Drag and drop your file here
            </p>
            <p className="text-white/40 mb-8">or click to browse your computer</p>
            <div className="flex justify-center gap-3">
              {['JSON', 'CSV', 'XML'].map(fmt => (
                <span key={fmt} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/50 font-medium">
                  {fmt}
                </span>
              ))}
            </div>
          </label>
        )}
      </motion.section>
      
      {/* Upload Button */}
      <motion.div variants={fadeInUp}>
        <motion.button
          onClick={handleUpload}
          disabled={!file || uploading}
          whileHover={file && !uploading ? { scale: 1.02 } : {}}
          whileTap={file && !uploading ? { scale: 0.98 } : {}}
          className={`
            w-full py-5 rounded-3xl text-lg font-bold flex items-center justify-center gap-3 transition-all duration-300
            ${success
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
              : file && !uploading
                ? 'bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10'
                : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'
            }
          `}
        >
          {success ? (
            <>
              <Check className="w-6 h-6" />
              Upload Complete — Redirecting...
            </>
          ) : uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Processing with AI...
            </>
          ) : (
            <>
              Upload & Parse
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}