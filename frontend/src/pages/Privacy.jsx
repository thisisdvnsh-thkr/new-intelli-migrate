export default function Privacy() {
  const sections = [
    {
      title: 'Data We Process',
      text: 'We process account data (name, email, auth events), migration metadata (file names, row/column counts), and user settings (database preferences, notification options).'
    },
    {
      title: 'Uploaded Files',
      text: 'Uploaded files are processed to generate schema and SQL outputs. Avoid uploading sensitive data unless you have proper compliance approval.'
    },
    {
      title: 'Third-Party Services',
      text: 'Cloudflare may handle static delivery logs; Render may handle backend logs/runtime metrics; connected databases process SQL commands under your credentials.'
    },
    {
      title: 'Credential Handling',
      text: 'Database/API credentials are intended for service operation. Use scoped keys and rotate credentials regularly. Never share credentials publicly.'
    },
    {
      title: 'Email Notifications',
      text: 'If enabled, platform sends account and migration notifications to your registered email. You can disable notification preference in your account settings.'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-black">Privacy Policy</h1>
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
