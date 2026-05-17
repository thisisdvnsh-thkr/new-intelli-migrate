import { useEffect, useMemo, useState } from 'react'
import { getUserSettings, saveUserSettings, changePassword, deleteAccount } from '../lib/api'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  Bell, Shield, Palette, Save, Check, Moon, Sun, Key, Trash2
} from 'lucide-react'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function Settings() {
  const { logout, setTheme } = useAuth()
  const defaultDarkMode = useMemo(() => !document.documentElement.classList.contains('theme-light'), [])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: defaultDarkMode,
    autoSave: true
  })
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getUserSettings()
        if (res?.settings) {
          setSettings((prev) => ({ ...prev, ...res.settings }))
        }
      } catch {
        // keep defaults
      }
    }
    load()
  }, [])

  useEffect(() => {
    setTheme(settings.darkMode)
  }, [settings.darkMode, setTheme])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveUserSettings(settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } catch {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const submitPasswordChange = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      alert('Please fill current and new password.')
      return
    }
    if (passwordForm.newPassword.length < 8) {
      alert('New password must be at least 8 characters.')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password do not match.')
      return
    }

    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      alert('Password changed successfully.')
    } catch (e) {
      alert(e?.response?.data?.detail || 'Failed to change password')
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
      <motion.header variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">Settings</h1>
          <p className="text-lg text-white/50 font-medium">Appearance, notifications, auto-save, and security controls.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 font-bold rounded-2xl transition-all ${
            saved ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-white/90'
          } ${saving ? 'opacity-60' : ''}`}
        >
          {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </button>
      </motion.header>

      <Section icon={Palette} title="Appearance">
        <ToggleSetting
          label="Dark Mode"
          description="Toggle between dark and light appearance"
          checked={settings.darkMode}
          onChange={(v) => setSettings({ ...settings, darkMode: v })}
          icon={settings.darkMode ? Moon : Sun}
        />
      </Section>

      <Section icon={Bell} title="Preferences">
        <ToggleSetting
          label="Email Notifications"
          description="Receive updates about registration, login, and migration status"
          checked={settings.notifications}
          onChange={(v) => setSettings({ ...settings, notifications: v })}
        />
        <ToggleSetting
          label="Auto-save SQL"
          description="Automatically save generated SQL to local browser storage"
          checked={settings.autoSave}
          onChange={(v) => setSettings({ ...settings, autoSave: v })}
        />
      </Section>

      <Section icon={Shield} title="Security">
        <div className="grid md:grid-cols-3 gap-4">
          <Input
            label="Current Password"
            type="password"
            icon={Key}
            value={passwordForm.oldPassword}
            onChange={(value) => setPasswordForm({ ...passwordForm, oldPassword: value })}
          />
          <Input
            label="New Password"
            type="password"
            icon={Key}
            value={passwordForm.newPassword}
            onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
          />
          <Input
            label="Confirm Password"
            type="password"
            icon={Key}
            value={passwordForm.confirmPassword}
            onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
          />
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={submitPasswordChange}
            className="px-5 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-colors"
          >
            Change Password
          </button>
          <button
            onClick={async () => {
              if (!window.confirm('Delete account permanently?')) return
              try {
                await deleteAccount()
                logout()
                alert('Account deleted.')
              } catch {
                alert('Failed to delete account.')
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/25 text-red-300 rounded-xl hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </Section>

    </motion.div>
  )
}

function Section({ icon: Icon, title, children }) {
  return (
    <motion.div variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.08] flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </motion.div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '', icon: Icon }) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/50 mb-2">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />}
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50`}
        />
      </div>
    </div>
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
        className={`w-12 h-7 rounded-full transition-all duration-300 ${checked ? 'bg-blue-500' : 'bg-white/10'}`}
      >
        <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
