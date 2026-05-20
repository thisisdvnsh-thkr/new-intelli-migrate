import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  UserCircle2, Mail, Database, ShieldCheck, Link2, Save, Check, LogOut, Server, Key, AlertTriangle, ImageUp, Trash2
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getMe, getUserSettings, saveUserSettings } from '../lib/api'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
}

const providerOptions = [
  { value: 'supabase', label: 'Supabase' },
  { value: 'neon', label: 'Neon' },
  { value: 'custom_postgresql', label: 'Custom PostgreSQL' },
  { value: 'custom_mysql', label: 'Custom MySQL' }
]

export default function UserProfile() {
  const navigate = useNavigate()
  const { user, logout, updateUser } = useAuth()
  const [profileEmail, setProfileEmail] = useState(user?.email || '')
  const [settings, setSettings] = useState({
    name: '',
    notifications: true,
    autoSave: true,
    databaseProvider: 'supabase',
    defaultDatabase: 'supabase',
    databaseUrl: '',
    providerApiKey: '',
    providerProjectId: '',
    profilePictureUrl: ''
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const me = await getMe()
        setProfileEmail(me?.email || '')
        if (me) {
          updateUser(me)
        }
        const res = await getUserSettings()
        const incoming = res?.settings || {}
        setSettings((prev) => ({
          ...prev,
          ...incoming,
          name: incoming.name || me?.full_name || me?.name || user?.full_name || user?.name || prev.name,
          profilePictureUrl: incoming.profilePictureUrl || me?.profile_picture_url || prev.profilePictureUrl
        }))
      } catch {
        setSettings((prev) => ({
          ...prev,
          name: user?.full_name || user?.name || prev.name,
          profilePictureUrl: user?.profile_picture_url || prev.profilePictureUrl
        }))
      }
    }
    load()
  }, [user, updateUser])

  const provider = settings.databaseProvider || settings.defaultDatabase || 'supabase'
  const providerLabel = useMemo(() => providerOptions.find((p) => p.value === provider)?.label || provider, [provider])
  const isApiProvider = provider === 'supabase' || provider === 'neon'
  const isCustomProvider = provider === 'custom_postgresql' || provider === 'custom_mysql'

  const saveProfile = async () => {
    if (!settings.name?.trim()) {
      alert('Name is required.')
      return
    }
    if (isApiProvider && (!settings.providerApiKey || !settings.providerProjectId || !settings.databaseUrl)) {
      alert('API key, project ID, and database URL are required for this provider.')
      return
    }
    if (isCustomProvider && !settings.databaseUrl) {
      alert('Connection string is required for custom database providers.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...settings,
        name: settings.name.trim(),
        databaseProvider: provider,
        defaultDatabase: provider
      }
      await saveUserSettings(payload)
      updateUser({
        ...(user || {}),
        full_name: payload.name,
        name: payload.name,
        email: profileEmail || user?.email || '',
        profile_picture_url: payload.profilePictureUrl || ''
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } catch {
      alert('Failed to save profile details.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (file) => {
    if (!file) return
    setAvatarError('')
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please upload an image file.')
      return
    }
    if (file.size > 900000) {
      setAvatarError('Image is too large. Please keep it under 900KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSettings((prev) => ({ ...prev, profilePictureUrl: String(reader.result || '') }))
    }
    reader.onerror = () => setAvatarError('Failed to read image file.')
    reader.readAsDataURL(file)
  }

  const profilePicture = settings.profilePictureUrl || user?.profile_picture_url || ''

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      <motion.header variants={fadeInUp} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">User Profile</h1>
          <p className="text-white/55 text-lg">Account details, database connection, and migration preferences.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveProfile}
            disabled={saving}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold ${
              saved ? 'bg-green-500 text-white' : 'bg-white text-black hover:bg-white/90'
            } ${saving ? 'opacity-60' : ''}`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </motion.header>

      <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserCircle2 className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <p className="text-2xl font-black text-white">{settings.name || user?.full_name || user?.name || 'User'}</p>
            <p className="text-white/45">Intelli-Migrate user account</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.1] text-sm text-white/70 hover:text-white cursor-pointer">
            <ImageUp className="w-4 h-4" />
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarChange(e.target.files?.[0])}
            />
          </label>
          {profilePicture && (
            <button
              onClick={() => setSettings((prev) => ({ ...prev, profilePictureUrl: '' }))}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-200 text-sm hover:bg-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Remove photo
            </button>
          )}
          {avatarError && <p className="text-sm text-red-300">{avatarError}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input
            icon={UserCircle2}
            label="Name"
            value={settings.name}
            onChange={(value) => setSettings((prev) => ({ ...prev, name: value }))}
            required
          />
          <ReadOnlyCard icon={Mail} label="Email" value={profileEmail || user?.email || '-'} />
          <ReadOnlyCard icon={ShieldCheck} label="Notifications" value={settings.notifications ? 'Enabled' : 'Disabled'} />
          <ReadOnlyCard icon={ShieldCheck} label="Auto-save SQL" value={settings.autoSave ? 'Enabled' : 'Disabled'} />
        </div>
      </motion.section>

      <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-300" />
          <h2 className="text-2xl font-bold text-white">Database Connection</h2>
        </div>
        <p className="text-sm text-white/50 mb-5">
          Step 1: Select your destination provider. Step 2: Provide provider-specific credentials safely.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/55 mb-2">Database Provider</label>
            <select
              value={provider}
              onChange={(e) => setSettings((prev) => ({ ...prev, databaseProvider: e.target.value, defaultDatabase: e.target.value }))}
              className="theme-aware-select w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
            >
              {providerOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          {isApiProvider && (
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                icon={Key}
                label={`${providerLabel} API Key`}
                value={settings.providerApiKey || ''}
                onChange={(value) => setSettings((prev) => ({ ...prev, providerApiKey: value }))}
                placeholder="Enter API key"
                required
              />
              <Input
                icon={Server}
                label={`${providerLabel} Project ID`}
                value={settings.providerProjectId || ''}
                onChange={(value) => setSettings((prev) => ({ ...prev, providerProjectId: value }))}
                placeholder="Enter project ID"
                required
              />
              <Input
                icon={Link2}
                label="Direct Database URL"
                value={settings.databaseUrl || ''}
                onChange={(value) => setSettings((prev) => ({ ...prev, databaseUrl: value }))}
                placeholder={provider === 'neon'
                  ? 'postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname'
                  : 'postgresql://postgres:[password]@db.<project>.supabase.co:5432/postgres'}
                required
              />
            </div>
          )}

          {isCustomProvider && (
            <>
              <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/25 p-4 text-yellow-100 text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5" />
                  <p>
                    For custom connections, create a dedicated read/write-only database user for Intelli-Migrate.
                    Do not use an admin root credential.
                  </p>
                </div>
              </div>
              <Input
                icon={Link2}
                label="Connection String"
                value={settings.databaseUrl || ''}
                onChange={(value) => setSettings((prev) => ({ ...prev, databaseUrl: value }))}
                placeholder={provider === 'custom_mysql'
                  ? 'mysql://user:password@host:3306/database'
                  : 'postgresql://user:password@host:5432/database'}
                required
              />
            </>
          )}

          <p className="text-sm text-white/45">
            {isApiProvider
              ? 'API-first providers are safer and cloud-native: scoped keys, HTTPS calls, and faster serverless connectivity.'
              : 'Custom connection strings are supported with restricted service users for safer platform access.'}
          </p>
        </div>
      </motion.section>
    </motion.div>
  )
}

function Input({ icon: Icon, label, value, onChange, required = false, placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm text-white/55 mb-2">
        {label} {required && <span className="text-red-300">*</span>}
      </label>
      <div className="relative">
        <Icon className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50"
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}

function ReadOnlyCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-blue-300" />
        <p className="text-sm text-white/55">{label}</p>
      </div>
      <p className="text-white font-semibold break-all">{value}</p>
    </div>
  )
}
