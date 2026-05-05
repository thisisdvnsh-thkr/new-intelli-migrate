import { useMemo, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload as UploadIcon, File, X, ArrowRight, CheckCircle2, Eye, Search } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'
import { uploadFile } from '../lib/api'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

function CircularProgress({ progress }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dash = circumference - (progress / 100) * circumference
  return (
    <div className="relative w-28 h-28">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="url(#grad)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dash}
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
        {progress}%
      </div>
    </div>
  )
}

function ExtractionVisualizer({ progress }) {
  const rows = [
    '{ "customer_id": "C102", "order_value": 1489, "city": "Delhi" }',
    '{ "cust_name": "Aarav", "mail_id": "aarav@mail.com", "status": "active" }',
    '{ "txn_id": "TX-9002", "payment_mode": "UPI", "amount": 399 }',
    '{ "region": "West", "sku_code": "SKU-88", "qty": 5 }',
    '{ "created_at": "2026-05-04", "is_refunded": false }'
  ]
  const x = Math.max(0, Math.min(78, Math.round(progress * 0.78)))
  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-2xl border border-white/10 bg-black/40 p-4 overflow-hidden">
      <div className="space-y-2 font-mono text-[12px] text-green-300/85">
        {rows.map((line) => (
          <div key={line} className="truncate">{line}</div>
        ))}
      </div>

      <motion.div
        className="absolute top-3 h-[calc(100%-24px)] w-24 rounded-xl border border-blue-300/50 bg-blue-400/10 backdrop-blur-sm"
        animate={{ left: `${x}%` }}
        transition={{ ease: 'linear', duration: 0.4 }}
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-500/25 border border-blue-300/50 flex items-center justify-center">
          <Search className="w-4 h-4 text-blue-200" />
        </div>
      </motion.div>
    </div>
  )
}

export default function Upload() {
  const navigate = useNavigate()
  const { addOrActivateSession, setStepWithSession, updateStats, updateSessionMeta, stats } = useMigration()
  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [simulatedProgress, setSimulatedProgress] = useState(0)
  const [uploadResponse, setUploadResponse] = useState(null)
  const [error, setError] = useState('')

  const previewColumns = useMemo(() => uploadResponse?.data?.columns || [], [uploadResponse])
  const rowCount = uploadResponse?.data?.record_count || 0
  const fileSizeMb = file ? file.size / (1024 * 1024) : 0
  const visualProgress = Math.max(uploadProgress, simulatedProgress)

  useEffect(() => {
    if (!uploading) {
      setSimulatedProgress(0)
      return
    }
    const speed = fileSizeMb > 15 ? 450 : fileSizeMb > 5 ? 300 : 180
    const timer = setInterval(() => {
      setSimulatedProgress((prev) => Math.min(95, prev + 1))
    }, speed)
    return () => clearInterval(timer)
  }, [uploading, fileSizeMb])

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else setDragActive(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setUploadResponse(null)
      setError('')
    }
  }, [])

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadResponse(null)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    setError('')

    try {
      const data = await uploadFile(file, (percent) => {
        setUploadProgress(Math.min(99, percent))
      })

      setUploadProgress(100)
      setSimulatedProgress(100)
      setUploadResponse(data)

      const columns = data?.data?.columns || []
      const records = data?.data?.record_count || 0
      const fileType = data?.data?.file_type || file.name.split('.').pop()
      const sessionId = data?.session_id

      addOrActivateSession({
        sessionId,
        fileName: file.name,
        fileSizeBytes: file.size,
        rows: records,
        cols: columns.length,
        fileType,
        currentStep: 1,
        status: 'uploaded'
      })

      updateStats({
        sessionId,
        recordsProcessed: records,
        fileName: file.name,
        fileType,
        fileSizeBytes: file.size,
        rows: records,
        cols: columns.length
      })
      setStepWithSession(1, { rows: records, cols: columns.length, status: 'uploaded' })
      updateSessionMeta(sessionId, { schemaPreview: columns.slice(0, 12) })
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-8">
      <motion.header variants={fadeInUp}>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Upload Data</h1>
        <p className="text-lg text-white/50 font-medium">
          Upload JSON, CSV, or XML and preview extracted structure instantly.
        </p>
      </motion.header>

      <motion.section
        variants={fadeInUp}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`rounded-3xl p-10 md:p-14 transition-all duration-300 ${
          dragActive
            ? 'bg-blue-500/10 border-2 border-dashed border-blue-500'
            : file
              ? 'bg-green-500/5 border-2 border-dashed border-green-500/40'
              : 'bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
        }`}
      >
        <input type="file" accept=".json,.csv,.xml" onChange={handleFileChange} className="hidden" id="file-upload" />

        {!uploading && !uploadResponse && (
          <div className="text-center">
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                <UploadIcon className="w-12 h-12 text-white/30" strokeWidth={1.5} />
              </div>
              <p className="text-3xl font-black text-white mb-2">Drag & drop your file here</p>
              <p className="text-white/40 mb-8">or click to browse your computer</p>
            </label>
            {file && (
              <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                <File className="w-4 h-4 text-white/50" />
                <span className="text-sm text-white">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-white/40 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="space-y-6 flex flex-col items-center">
            <CircularProgress progress={visualProgress} />
            <p className="text-white font-semibold">Parsing and profiling your file...</p>
            <ExtractionVisualizer progress={visualProgress} />
            <p className="text-sm text-white/45">Live extraction visual adapts with file size and parsing progress.</p>
          </div>
        )}

        {uploadResponse && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-400 mx-auto" />
            <p className="text-2xl font-black text-white">Upload successful</p>
            <p className="text-white/50">Preview loaded below. Continue to schema mapping.</p>
          </div>
        )}

        <div className="flex justify-center mt-9">
          {file && !uploadResponse && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-10 py-4 bg-white text-black text-lg font-black rounded-2xl hover:bg-white/90 transition-colors disabled:opacity-60"
            >
              Upload & Parse
            </button>
          )}
        </div>
      </motion.section>

      {error && (
        <motion.div variants={fadeInUp} className="rounded-2xl p-4 bg-red-500/10 border border-red-500/30 text-red-300">
          {error}
        </motion.div>
      )}

      {uploadResponse && (
        <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">File Preview</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <PreviewStat label="File Name" value={file?.name || stats.fileName || '-'} />
            <PreviewStat label="File Size" value={file ? `${(file.size / 1024).toFixed(1)} KB` : '-'} />
            <PreviewStat label="Rows" value={String(rowCount)} />
            <PreviewStat label="Columns" value={String(previewColumns.length)} />
          </div>
          <div>
            <p className="text-sm text-white/50 mb-2">Detected Columns</p>
            <div className="flex flex-wrap gap-2">
              {previewColumns.slice(0, 20).map((col) => (
                <span key={col} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                  {col}
                </span>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      <motion.div variants={fadeInUp} className="flex justify-end gap-3">
        {uploadResponse && (
          <button
            onClick={() => navigate('/schema-map')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-colors"
          >
            Continue to Schema Mapping
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}

function PreviewStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
      <p className="text-xs text-white/45 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white break-all">{value}</p>
    </div>
  )
}
