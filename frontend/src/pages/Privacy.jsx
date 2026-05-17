export default function Privacy() {
  const sections = [
    {
      title: '1. Account Data',
      text: 'We process account identifiers such as email, display name, authentication metadata, and security events needed to operate sign-in, password recovery, and account protection workflows.'
    },
    {
      title: '2. Migration Metadata',
      text: 'We store migration-session metadata including file names, row/column counts, mapping confidence, anomaly summaries, and deployment outcomes to provide history, dashboards, and troubleshooting.'
    },
    {
      title: '3. Uploaded File Processing',
      text: 'Uploaded files are parsed to infer schema and generate migration outputs. Avoid uploading highly sensitive data unless your compliance framework and security controls explicitly allow it.'
    },
    {
      title: '4. Database Connection Inputs',
      text: 'When you provide API keys, project IDs, or connection strings, those values are used for migration operations. You should always use restricted credentials and rotate them periodically.'
    },
    {
      title: '5. Notifications and Email',
      text: 'If notifications are enabled, registration/login/migration/security emails may be sent through configured SMTP/email providers. Delivery depends on third-party mail routing behavior.'
    },
    {
      title: '6. Third-Party Infrastructure',
      text: 'Cloudflare may process edge delivery logs, and Render or equivalent platforms may process runtime logs and operational metrics. Connected databases process SQL commands under your provided credentials.'
    },
    {
      title: '7. Retention and Cleanup',
      text: 'Session artifacts and generated files may be retained for operational continuity and diagnostics unless deleted. You can remove sessions and request account deletion through platform controls.'
    },
    {
      title: '8. Access and Security Controls',
      text: 'We recommend enabling strong passwords, restricting team credential sharing, and using destination-database users with least privilege. Account owners are responsible for endpoint and credential security.'
    },
    {
      title: '9. User Rights and Controls',
      text: 'You can update profile/settings, change password, disable notifications, and delete your account. These controls affect future processing but may not retroactively remove already-processed logs.'
    },
    {
      title: '10. Policy Updates',
      text: 'This policy may be updated for security, legal, or infrastructure reasons. Continued use after updates indicates acceptance of the current policy.'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-5">
        <h1 className="text-4xl font-black">Privacy Policy</h1>
        <p className="text-white/60 text-sm">Effective date: 2026-01-01</p>
        {sections.map((s) => (
          <section key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-base font-bold mb-2">{s.title}</h2>
            <p className="text-white/70 text-xs leading-6">{s.text}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
