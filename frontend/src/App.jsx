import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { MigrationProvider } from './context/MigrationContext'
import { AnimatePresence, motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import SchemaMap from './pages/SchemaMap'
import Anomalies from './pages/Anomalies'
import GenerateSQL from './pages/GenerateSQL'
import Deploy from './pages/Deploy'
import Login from './pages/Login'
import Signup from './pages/Signup'
import OAuthCallback from './pages/OAuthCallback'
import Landing from './pages/Landing'
import Settings from './pages/Settings'
import Help from './pages/Help'
import { checkHealth } from './lib/api'
import BrandLogo from './components/BrandLogo'

// Backend Wake-up Loading Screen
function BackendLoader({ onReady }) {
  const [status, setStatus] = useState('connecting')
  const [dots, setDots] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(dotInterval)
  }, [])

  useEffect(() => {
    const wakeBackend = async () => {
      try {
        setStatus('connecting')
        await checkHealth()
        setStatus('ready')
        setTimeout(() => onReady(), 500)
      } catch (error) {
        if (attempt < 3) {
          setStatus('waking')
          setTimeout(() => setAttempt(a => a + 1), 5000)
        } else {
          setStatus('error')
        }
      }
    }
    wakeBackend()
  }, [attempt, onReady])

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500"
            />
            <div className="absolute inset-2 flex items-center justify-center">
              <BrandLogo size={72} showText={false} interactive={false} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Intelli-Migrate</h1>
          <p className="text-gray-400">AI-Powered Data Migration</p>
        </motion.div>

        {/* Status Messages */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {status === 'connecting' && (
            <div className="flex items-center justify-center gap-3 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Connecting to server{dots}</span>
            </div>
          )}
          {status === 'waking' && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3 text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span>Waking up AI agents{dots}</span>
              </div>
              <p className="text-gray-500 text-sm">Free tier servers sleep after inactivity</p>
              <div className="w-48 mx-auto bg-gray-800 rounded-full h-1.5 mt-4">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              </div>
            </div>
          )}
          {status === 'ready' && (
            <div className="flex items-center justify-center gap-3 text-green-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>All systems ready!</span>
            </div>
          )}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-red-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Connection failed</span>
              </div>
              <button
                onClick={() => setAttempt(0)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Retry Connection
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

// Page transition wrapper
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

// Layout with sidebar for dashboard pages
function DashboardLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0b]">
      <Sidebar />
      <main className="flex-1 ml-80 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  )
}

// Full-width layout for public pages
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-black">
      <PageTransition>{children}</PageTransition>
    </div>
  )
}

function AppRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><Signup /></PublicLayout>} />
        <Route path="/oauth-callback" element={<PublicLayout><OAuthCallback /></PublicLayout>} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
        <Route path="/upload" element={<DashboardLayout><Upload /></DashboardLayout>} />
        <Route path="/schema-map" element={<DashboardLayout><SchemaMap /></DashboardLayout>} />
        <Route path="/anomalies" element={<DashboardLayout><Anomalies /></DashboardLayout>} />
        <Route path="/generate-sql" element={<DashboardLayout><GenerateSQL /></DashboardLayout>} />
        <Route path="/deploy" element={<DashboardLayout><Deploy /></DashboardLayout>} />
        <Route path="/settings" element={<DashboardLayout><Settings /></DashboardLayout>} />
        <Route path="/help" element={<DashboardLayout><Help /></DashboardLayout>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const [backendReady, setBackendReady] = useState(false)
  const publicPaths = ['/', '/login', '/signup', '/oauth-callback']
  const [skipLoader] = useState(() => publicPaths.includes(window.location.pathname))

  // Show loader only for dashboard routes
  if (!backendReady && !skipLoader) {
    return <BackendLoader onReady={() => setBackendReady(true)} />
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <MigrationProvider>
          <AppRoutes />
        </MigrationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
