import { useMemo, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Settings as SettingsIcon, HelpCircle, LayoutDashboard, UserCircle2, Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useMigration } from '../context/MigrationContext'
import BrandLogo from './BrandLogo'

export default function Sidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { sessionHistory, activeSessionId, setActiveSession, resetSession } = useMigration()
  const [query, setQuery] = useState('')

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sessionHistory
    return sessionHistory.filter((item) => (item.fileName || 'Untitled file').toLowerCase().includes(q))
  }, [query, sessionHistory])

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-80 bg-black/40 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col z-50">
      <div className="px-6 py-7 border-b border-white/[0.06]">
        <div className="mb-5 inline-block">
          <div className="flex flex-col items-start gap-2">
            <BrandLogo />
            <p className="text-xs text-white/40 pl-1">Session Workspace</p>
          </div>
        </div>

        <button
          onClick={() => {
            resetSession()
            navigate('/upload')
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Migration
        </button>
      </div>

      <div className="px-4 py-4 flex items-center gap-2 border-b border-white/[0.06]">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <span className="inline-flex items-center gap-2"><LayoutDashboard className="w-4 h-4" /> Dashboard</span>
        </NavLink>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 text-xs font-semibold text-white/35 uppercase tracking-wider mb-2">Sessions</p>
        <div className="relative px-2 mb-3">
          <Search className="w-3.5 h-3.5 text-white/35 absolute left-5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white/[0.03] border border-white/[0.08] text-white placeholder:text-white/30 focus:outline-none focus:border-white/20"
          />
        </div>

        {filteredSessions.length === 0 ? (
          <div className="mx-2 mt-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs text-white/40">
            No sessions found.
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredSessions.map((item) => {
              const isActive = activeSessionId === item.sessionId
              return (
                <motion.button
                  key={item.sessionId}
                  onClick={() => {
                    setActiveSession(item.sessionId)
                    navigate('/dashboard')
                  }}
                  whileHover={{ scale: 1.01 }}
                  className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]'
                  }`}
                >
                  <p className="text-xs font-semibold text-white truncate">{item.fileName || 'Untitled file'}</p>
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-5 border-t border-white/[0.08] space-y-3">
        <div className="space-y-1.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <SettingsIcon className="w-4 h-4" />
            Settings
          </NavLink>
          <NavLink
            to="/help"
            className={({ isActive }) =>
              `w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <HelpCircle className="w-4 h-4" />
            Help Center
          </NavLink>
        </div>

        {user ? (
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/[0.05] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
              {(user.full_name || user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-semibold text-white truncate">{user.full_name || user.name || 'User'}</p>
            <UserCircle2 className="w-4 h-4 text-white/35 ml-auto" />
          </button>
        ) : (
          <Link
            to="/login"
            className="flex items-center justify-center w-full py-3 text-sm font-bold bg-white text-black rounded-2xl hover:bg-white/90 transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </aside>
  )
}
