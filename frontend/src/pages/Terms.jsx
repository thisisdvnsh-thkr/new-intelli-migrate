export default function Terms() {
  const sections = [
    {
      title: 'Platform Usage',
      text: 'Intelli-Migrate provides data parsing, schema mapping, anomaly analysis, normalization, SQL generation, and deployment tooling. You are responsible for ensuring you have legal rights to upload and process your data.'
    },
    {
      title: 'Cloud Infrastructure',
      text: 'Frontend is served via Cloudflare Pages and backend may run on Render. Service uptime and performance on free tiers can vary by provider policy.'
    },
    {
      title: 'Database Connections',
      text: 'When connecting Supabase/Neon/custom databases, use limited-scope credentials. Prefer dedicated service users with only the permissions required for migration tasks.'
    },
    {
      title: 'Security Responsibilities',
      text: 'Keep your API keys, database URLs, and account credentials secure. Do not share reset links or authentication tokens.'
    },
    {
      title: 'Acceptable Use',
      text: 'Do not upload unlawful data, malware, or content violating third-party rights. Abuse and attacks against infrastructure are prohibited.'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-black">Terms & Conditions</h1>
        <p className="text-white/60">Effective date: 2026-01-01</p>
        {sections.map((s) => (
          <section key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-bold mb-2">{s.title}</h2>
            <p className="text-white/70">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
