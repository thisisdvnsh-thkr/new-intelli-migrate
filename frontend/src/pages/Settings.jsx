import { useState, useEffect } from 'react'
import { getUserSettings, saveUserSettings, changePassword, deleteAccount } from '../lib/api'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { 
  User, Bell, Shield, Database, Palette, Save, Check,
  Moon, Sun, Globe, Key, Trash2
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    notifications: true,
    darkMode: true,
    autoSave: true,
    defaultDatabase: 'postgresql'
  })

  useEffect(() => {
    // prefill from auth user
    if (user) {
      setSettings(prev => ({ ...prev, name: user.full_name || user.name || prev.name, email: user.email || prev.email }))
    }
    const load = async () => {
      try {
        const res = await getUserSettings()
        if (res?.settings) setSettings(prev => ({ ...prev, ...res.settings }))
      } catch (e) {
        console.warn('Failed to load settings', e)
      }
    }
    load()
  }, [user])

  const handleSave = async () => {
    try {
      await saveUserSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Save settings failed', e)
      alert('Failed to save settings')
    }
  }

  const sections = [
    {
      title: 'Profile',
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Full Name</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({...settings, name: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({...settings, email: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
        </div>
      )
    },
    {
      title: 'Notifications',
      icon: Bell,
      content: (
        <div className="space-y-4">
          <ToggleSetting
            label="Email Notifications"
            description="Receive updates about your migrations"
            checked={settings.notifications}
            onChange={(v) => setSettings({...settings, notifications: v})}
          />
        </div>
      )
    },
    {
      title: 'Appearance',
      icon: Palette,
      content: (
        <div className="space-y-4">
          <ToggleSetting
            label="Dark Mode"
            description="Use dark theme (recommended)"
            checked={settings.darkMode}
            onChange={(v) => setSettings({...settings, darkMode: v})}
            icon={settings.darkMode ? Moon : Sun}
          />
        </div>
      )
    },
    {
      title: 'Database',
      icon: Database,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/50 mb-2">Default Target Database</label>
            <select
              value={settings.defaultDatabase}
              onChange={(e) => setSettings({...settings, defaultDatabase: e.target.value})}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-blue-500/50 transition-all"
            >
              <option value="postgresql">PostgreSQL (Render)</option>
              <option value="mysql">MySQL</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
          <ToggleSetting
            label="Auto-save SQL"
            description="Automatically save generated SQL to downloads"
            checked={settings.autoSave}
            onChange={(v) => setSettings({...settings, autoSave: v})}
          />
        </div>
      )
    },
    {
      title: 'Security',
      icon: Shield,
      content: (
        <div className="space-y-4">
          <button onClick={async () => {
              const oldP = window.prompt('Enter current password')
              if (!oldP) return
              const newP = window.prompt('Enter new password')
              if (!newP) return
              try {
                await changePassword(oldP, newP)
                alert('Password changed successfully')
              } catch (e) {
                console.error(e)
                alert('Failed to change password')
              }
            }} className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all w-full">
            <Key className="w-5 h-5 text-white/50" />
            <span>Change Password</span>
          </button>
          <button onClick={async () => {
              if (!window.confirm('Delete account? This action cannot be undone.')) return
              try {
                await deleteAccount()
                logout()
                alert('Account deleted')
              } catch (e) {
                console.error(e)
                alert('Failed to delete account')
              }
            }} className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 hover:bg-red-500/20 transition-all w-full">
            <Trash2 className="w-5 h-5" />
            <span>Delete Account</span>
          </button>
        </div>
      )
    }
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8"
    >
      {/* Header */}
      <motion.header variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            Settings
          </h1>
          <p className="text-lg text-white/50 font-medium">
            Manage your account and preferences
          </p>
        </div>
        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all duration-300 ${
            saved 
              ? 'bg-green-500 text-white' 
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </motion.button>
      </motion.header>

      {/* Settings Sections */}
      <div className="space-y-6">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            variants={fadeInUp}
            className="rounded-3xl bg-white/[0.02] border border-white/[0.08] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <section.icon className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
            </div>
            <div className="p-6">
              {section.content}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

function ToggleSetting({ label, description, checked, onChange, icon: Icon }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-white/50" />}
        <div>
          <p className="text-white font-medium">{label}</p>
          <p className="text-sm text-white/40">{description}</p>
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full transition-all duration-300 ${
          checked ? 'bg-blue-500' : 'bg-white/10'
        }`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  )
}
