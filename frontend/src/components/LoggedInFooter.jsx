import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BrandLogo from './BrandLogo'

export default function LoggedInFooter() {
  const { setTheme } = useAuth()
  const [darkMode, setDarkMode] = useState(() => !document.documentElement.classList.contains('theme-light'))
  const [language, setLanguage] = useState(() => localStorage.getItem('intelli-language') || 'English')

  useEffect(() => {
    setTheme(darkMode)
  }, [darkMode, setTheme])

  useEffect(() => {
    localStorage.setItem('intelli-language', language)
  }, [language])

  return (
    <section className="mt-16 rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} textSize="text-lg" />
          <span className="text-sm text-white/45">Workspace controls</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-sm text-white/70 hover:text-white"
          >
            Dark Mode
            <span className={`w-10 h-5 rounded-full transition-colors ${darkMode ? 'bg-green-400/70' : 'bg-white/10'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'} mt-0.5`} />
            </span>
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-sm text-white/70">
            Language
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="theme-aware-select px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 text-sm text-white/60">
        <div className="space-y-2">
          <p className="text-white font-semibold">Product</p>
          <Link to="/dashboard" className="block hover:text-white">Dashboard</Link>
          <Link to="/upload" className="block hover:text-white">New Migration</Link>
          <Link to="/generate-sql" className="block hover:text-white">SQL Generator</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">Platform</p>
          <Link to="/schema-map" className="block hover:text-white">Schema Map</Link>
          <Link to="/anomalies" className="block hover:text-white">Anomalies</Link>
          <Link to="/deploy" className="block hover:text-white">Deploy</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">Resources</p>
          <Link to="/documentation" className="block hover:text-white">Documentation</Link>
          <Link to="/help" className="block hover:text-white">Help Center</Link>
          <Link to="/contact-support" className="block hover:text-white">Contact Support</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">Company</p>
          <Link to="/terms" className="block hover:text-white">Terms</Link>
          <Link to="/privacy" className="block hover:text-white">Privacy</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">Account</p>
          <Link to="/profile" className="block hover:text-white">Profile</Link>
          <Link to="/settings" className="block hover:text-white">Settings</Link>
        </div>
      </div>
    </section>
  )
}
