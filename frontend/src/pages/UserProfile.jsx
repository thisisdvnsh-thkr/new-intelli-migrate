import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { UserCircle2, Mail, CalendarDays, Database, ShieldCheck, Link2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getUserSettings } from '../lib/api'

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } }
}

export default function UserProfile() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getUserSettings()
        setSettings(res?.settings || {})
      } catch {
        setSettings({})
      }
    }
    load()
  }, [])

  const providerLabel = useMemo(() => {
    const provider = settings?.databaseProvider || settings?.defaultDatabase || 'postgresql'
    const map = {
      postgresql: 'PostgreSQL',
      render: 'Render Postgres',
      supabase: 'Supabase',
      neon: 'Neon',
      railway: 'Railway',
      access: 'Microsoft Access'
    }
    return map[provider] || provider
  }, [settings])

  return (
    <motion.div initial="hidden" animate="visible" className="space-y-6">
      <motion.header variants={fadeInUp}>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">User Profile</h1>
        <p className="text-white/55 text-lg">Your account details and active database preferences.</p>
      </motion.header>

      <motion.section variants={fadeInUp} className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <UserCircle2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{user?.full_name || user?.name || 'User'}</p>
            <p className="text-white/45">Intelli-Migrate user account</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <ProfileCard icon={Mail} label="Email" value={user?.email || '-'} />
          <ProfileCard icon={CalendarDays} label="Date of Birth" value={settings?.date_of_birth || 'Not provided'} />
          <ProfileCard icon={Database} label="Database Provider" value={providerLabel} />
          <ProfileCard icon={Link2} label="Database URL / API key" value={settings?.databaseUrl ? 'Configured' : 'Not configured'} />
          <ProfileCard icon={ShieldCheck} label="Notifications" value={settings?.notifications ? 'Enabled' : 'Disabled'} />
          <ProfileCard icon={ShieldCheck} label="Auto-save SQL" value={settings?.autoSave ? 'Enabled' : 'Disabled'} />
        </div>
      </motion.section>
    </motion.div>
  )
}

function ProfileCard({ icon: Icon, label, value }) {
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
