import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import BrandLogo from './BrandLogo'

export default function LoggedInFooter() {
  const { setTheme } = useAuth()
  const { language, setLanguage, languageOptions, t } = useLanguage()
  const [darkMode, setDarkMode] = useState(() => !document.documentElement.classList.contains('theme-light'))

  useEffect(() => {
    setTheme(darkMode)
  }, [darkMode, setTheme])

  return (
    <section className="mt-16 rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} textSize="text-lg" />
          <span className="text-sm text-white/45">{t('Workspace controls')}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-sm text-white/70 hover:text-white"
          >
            {t('Dark Mode')}
            <span className={`w-10 h-5 rounded-full transition-colors ${darkMode ? 'bg-green-400/70' : 'bg-white/10'}`}>
              <span className={`block w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-1'} mt-0.5`} />
            </span>
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-sm text-white/70">
            {t('Language')}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="theme-aware-select px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none"
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 text-sm text-white/60">
        <div className="space-y-2">
          <p className="text-white font-semibold">{t('Product')}</p>
          <Link to="/dashboard" className="block hover:text-white">{t('Dashboard')}</Link>
          <Link to="/upload" className="block hover:text-white">{t('Upload')}</Link>
          <Link to="/generate-sql" className="block hover:text-white">{t('SQL Generator')}</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">{t('Platform')}</p>
          <Link to="/schema-map" className="block hover:text-white">{t('Schema Map')}</Link>
          <Link to="/anomalies" className="block hover:text-white">{t('Anomalies')}</Link>
          <Link to="/deploy" className="block hover:text-white">{t('Deploy')}</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">{t('Resources')}</p>
          <Link to="/documentation" className="block hover:text-white">{t('Documentation')}</Link>
          <Link to="/help" className="block hover:text-white">{t('Help Center')}</Link>
          <Link to="/contact-support" className="block hover:text-white">{t('Contact Support')}</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">{t('Company')}</p>
          <Link to="/terms" className="block hover:text-white">{t('Terms')}</Link>
          <Link to="/privacy" className="block hover:text-white">{t('Privacy')}</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">{t('Account')}</p>
          <Link to="/profile" className="block hover:text-white">{t('Profile')}</Link>
          <Link to="/settings" className="block hover:text-white">{t('Settings')}</Link>
        </div>
      </div>
    </section>
  )
}
