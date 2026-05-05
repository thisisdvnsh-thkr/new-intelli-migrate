import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, LogOut, Settings as SettingsIcon, HelpCircle, LayoutDashboard, UserCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useMigration } from '../context/MigrationContext'
import BrandLogo from './BrandLogo'

function formatAgo(isoDate) {
  if (!isoDate) return 'now'
  const delta = Math.max(0, Date.now() - new Date(isoDate).getTime())
  const minutes = Math.floor(delta / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default function Sidebar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { sessionHistory, activeSessionId, setActiveSession, resetSession } = useMigration()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-80 bg-black/40 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col z-50">
      <div className="px-6 py-7 border-b border-white/[0.06]">
        <Link to="/" className="mb-5 inline-block">
          <div className="flex flex-col items-start gap-2">
            <BrandLogo />
            <p className="text-xs text-white/40 pl-1">Session Workspace</p>
          </div>
        </Link>

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
        <p className="px-3 text-xs font-semibold text-white/35 uppercase tracking-wider mb-3">Sessions</p>
        {sessionHistory.length === 0 ? (
          <div className="mx-2 mt-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-sm text-white/40">
            No sessions yet. Start a migration to see your history.
          </div>
        ) : (
          <div className="space-y-2">
            {sessionHistory.map((item) => {
              const isActive = activeSessionId === item.sessionId
              return (
                <motion.button
                  key={item.sessionId}
                  onClick={() => {
                    setActiveSession(item.sessionId)
                    navigate('/dashboard')
                  }}
                  whileHover={{ scale: 1.01 }}
                  className={`w-full text-left p-3 rounded-2xl border transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 border-blue-500/30'
                      : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white truncate">{item.fileName || 'Untitled file'}</p>
                    <span className="text-[11px] text-white/35">{formatAgo(item.updatedAt || item.createdAt)}</span>
                  </div>
                  <p className="text-xs text-white/45 mt-1">
                    Step {item.currentStep || 0}/6 • {item.rows || 0} rows • {item.cols || 0} cols
                  </p>
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
          <div className="space-y-3">
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
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
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
