import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, HelpCircle, LayoutDashboard, UserCircle2, Search, PanelLeftClose } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useMigration } from '../context/MigrationContext'
import BrandLogo from './BrandLogo'
import { getSession, getUserSettings } from '../lib/api'

export default function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const { sessionHistory, activeSessionId, setActiveSession, removeSession } = useMigration()
  const [query, setQuery] = useState('')
  const [sessionNotice, setSessionNotice] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState('')

  useEffect(() => {
    let active = true
    if (!user) return undefined
    const load = async () => {
      try {
        const res = await getUserSettings()
        if (!active) return
        setProfilePictureUrl(res?.settings?.profilePictureUrl || '')
      } catch {
        if (active) setProfilePictureUrl('')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user?.id])

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sessionHistory
    return sessionHistory.filter((item) => (item.fileName || 'Untitled file').toLowerCase().includes(q))
  }, [query, sessionHistory])

  const navItems = [
    { to: '/dashboard', label: t('dashboard'), icon: LayoutDashboard }
  ]

  const optionClass = ({ isActive }) =>
    `w-full flex items-center ${isOpen ? 'gap-2 px-3' : 'justify-center px-0'} py-2.5 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-blue-500/12 border border-blue-500/35 text-white shadow-[0_0_18px_rgba(59,130,246,0.22)]'
        : 'text-white/65 border border-transparent hover:text-white hover:bg-white/5'
    }`

  const avatar = profilePictureUrl ? (
    <img src={profilePictureUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
  ) : (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
      {(user?.full_name || user?.name || 'U').charAt(0).toUpperCase()}
    </div>
  )
  const MotionButton = motion.button

  return (
    <aside className={`fixed left-0 top-0 bottom-0 ${isOpen ? 'w-80' : 'w-20'} bg-black/40 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col z-50 transition-all duration-300`}>
      <div className={`border-b border-white/[0.06] ${isOpen ? 'px-6 py-5' : 'px-3 py-4'} space-y-4`}>
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen ? (
            <>
              <BrandLogo />
              <button
                onClick={onToggle}
                className="rounded-xl bg-white/[0.03] border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.06] flex items-center justify-center w-9 h-9"
                title={t('close_sidebar')}
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onToggle}
              className="relative group w-full flex items-center justify-center px-2 py-2 rounded-xl bg-white/[0.03] border border-white/[0.1] text-white/75 hover:text-white hover:bg-white/[0.06]"
              title={t('open_sidebar')}
            >
              <BrandLogo size={32} showText={false} />
              <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-black text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {t('open_sidebar')}
              </span>
            </button>
          )}
        </div>

        {isOpen && <p className="text-xs text-white/40 pl-1">{t('session_workspace')}</p>}
      </div>

      <div className={`${isOpen ? 'px-4 py-4' : 'px-2 py-4'} border-b border-white/[0.06] space-y-2`}>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={optionClass} title={!isOpen ? item.label : undefined}>
            <item.icon className="w-4 h-4" />
            {isOpen && item.label}
          </NavLink>
        ))}
      </div>

      {isOpen && (
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">{t('sessions')}</p>
          <div className="relative px-2 mb-3">
            <Search className="w-3.5 h-3.5 text-white/35 absolute left-5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_sessions')}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
          </div>

          {filteredSessions.length === 0 ? (
            <div className="mx-2 mt-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-sm text-white/40">
              {t('no_sessions')}
            </div>
          ) : (
            <div className="space-y-1.5">
              {sessionNotice && (
                <div className="mx-2 mb-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/25 text-xs text-yellow-200">
                  {sessionNotice}
                </div>
              )}
              {filteredSessions.map((item) => {
                const isActive = activeSessionId === item.sessionId
                return (
                  <MotionButton
                    key={item.sessionId}
                    onClick={async () => {
                      const targetSessionId = item.sessionId
                      if (!targetSessionId) {
                        removeSession(item.sessionId)
                        setSessionNotice('Removed an invalid local session entry.')
                        return
                      }
                      try {
                        await getSession(targetSessionId)
                        setSessionNotice('')
                        setActiveSession(targetSessionId)
                        navigate(`/session/${targetSessionId}`)
                      } catch {
                        removeSession(targetSessionId)
                        setSessionNotice('This session is no longer available on server, so it was removed.')
                        navigate('/dashboard')
                      }
                    }}
                    whileHover={{ scale: 1.01 }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      isActive
                        ? 'bg-blue-500/10 border-blue-500/30 text-white'
                        : 'bg-white/[0.02] border-white/[0.08] text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <p className="font-semibold truncate">{item.fileName || 'Untitled file'}</p>
                  </MotionButton>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className={`border-t border-white/[0.08] ${isOpen ? 'px-4 py-5' : 'px-2 py-4'} space-y-2`}>
        <NavLink to="/settings" className={optionClass} title={!isOpen ? t('settings') : undefined}>
          <SettingsIcon className="w-4 h-4" />
          {isOpen && t('settings')}
        </NavLink>
        <NavLink to="/help" className={optionClass} title={!isOpen ? t('help_center') : undefined}>
          <HelpCircle className="w-4 h-4" />
          {isOpen && t('help_center')}
        </NavLink>

        {user ? (
          <button
            onClick={() => navigate('/profile')}
            className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl border border-transparent hover:bg-white/[0.05] transition-colors`}
            title={!isOpen ? t('profile') : undefined}
          >
            {isOpen ? avatar : (
              profilePictureUrl
                ? <img src={profilePictureUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                : <UserCircle2 className="w-5 h-5 text-white/70" />
            )}
            {isOpen && (
              <>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-white truncate">{user.full_name || user.name || t('profile')}</p>
                  <p className="text-xs text-white/40">Intelli-Migrate</p>
                </div>
              </>
            )}
          </button>
        ) : (
          <Link to="/login" className={`flex items-center justify-center w-full py-2.5 text-sm font-bold bg-white text-black rounded-xl hover:bg-white/90 transition-colors ${isOpen ? '' : 'px-0'}`}>
            {isOpen ? 'Sign In' : <UserCircle2 className="w-5 h-5" />}
          </Link>
        )}
      </div>
    </aside>
  )
}
