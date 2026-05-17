import { useEffect, useState } from 'react'
import { FileSearch, Table2 } from 'lucide-react'
import { useMigration } from '../context/MigrationContext'
import { getSession } from '../lib/api'

export default function ParseReview() {
  const { stats } = useMigration()
  const [sessionData, setSessionData] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!stats.sessionId) return
      try {
        const data = await getSession(stats.sessionId)
        setSessionData(data)
      } catch {
        setSessionData(null)
      }
    }
    load()
  }, [stats.sessionId])

  const parsing = sessionData?.results?.parsing || {}
  const schema = parsing.schema || {}

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Parse Review</h1>
        <p className="text-white/55 text-lg">See what Agent 1 extracted from your uploaded file.</p>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <Card label="File" value={sessionData?.file_name || stats.fileName || '-'} />
        <Card label="Type" value={(stats.fileType || parsing.file_type || '-').toString().toUpperCase()} />
        <Card label="Records" value={String(parsing.record_count || stats.rows || 0)} />
      </section>

      <section className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Table2 className="w-5 h-5 text-blue-300" />
          <h2 className="text-xl font-bold text-white">Extracted Schema</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {Object.keys(schema).length === 0 ? (
            <p className="text-white/50">Schema preview is not available yet.</p>
          ) : (
            Object.entries(schema).map(([name, meta]) => (
              <div key={name} className="rounded-xl bg-white/[0.02] border border-white/[0.08] p-3">
                <p className="text-white font-semibold">{name}</p>
                <p className="text-sm text-white/50">Type: {meta?.data_type || 'string'}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-2">
          <FileSearch className="w-5 h-5 text-purple-300" />
          <h2 className="text-xl font-bold text-white">Parse Notes</h2>
        </div>
        <p className="text-white/60">
          Agent 1 converts raw input into structured records and inferred schema, then passes normalized keys to mapping.
        </p>
      </section>
    </div>
  )
}

function Card({ label, value }) {
  return (
    <div className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-5">
      <p className="text-sm text-white/45 mb-1">{label}</p>
      <p className="text-xl font-bold text-white break-all">{value}</p>
    </div>
  )
}
