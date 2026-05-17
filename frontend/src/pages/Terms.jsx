export default function Terms() {
  const sections = [
    {
      title: '1. Service Scope',
      text: 'Intelli-Migrate provides AI-assisted parsing, schema mapping, anomaly detection, normalization, SQL generation, and deployment workflows for data migration use-cases. Platform behavior depends on input data quality and configured destination databases.'
    },
    {
      title: '2. Eligibility and Account',
      text: 'You must provide accurate registration details and keep credentials secure. You are responsible for all activity performed under your account and for restricting team access when sharing environments.'
    },
    {
      title: '3. Data Ownership',
      text: 'You retain ownership of uploaded data and generated SQL outputs. By using the service, you confirm you have lawful rights and permissions to process, transform, and migrate that data.'
    },
    {
      title: '4. Cloud and Hosting Dependencies',
      text: 'Frontend delivery may run through Cloudflare Pages and backend workloads may run on Render or equivalent providers. Availability, cold starts, and performance may vary depending on provider tier and regional conditions.'
    },
    {
      title: '5. Database Credentials and Access',
      text: 'You must use limited-scope credentials where possible. For custom PostgreSQL/MySQL, use dedicated migration users with minimum permissions. For API-first providers such as Supabase/Neon, prefer scoped API keys.'
    },
    {
      title: '6. Security Responsibilities',
      text: 'Never expose secrets in public repositories or client-side logs. You are responsible for key rotation, password hygiene, environment-variable protection, and secure handling of reset links.'
    },
    {
      title: '7. Acceptable Use',
      text: 'You agree not to upload malware, infringing content, or unlawful datasets, and not to abuse infrastructure through denial-of-service, credential stuffing, scraping attacks, or unauthorized access attempts.'
    },
    {
      title: '8. Email and Notification Delivery',
      text: 'Notification and reset email flows depend on correctly configured SMTP/email providers. Delivery can be delayed or blocked by external email gateways, spam policies, and provider outages.'
    },
    {
      title: '9. Export and Deployment Risk',
      text: 'Generated SQL should be reviewed before production deployment. You are responsible for running migrations in staged environments and maintaining backup/recovery plans for destination databases.'
    },
    {
      title: '10. Limitation and Changes',
      text: 'Features may evolve over time. We may update these terms to reflect infrastructure, security, and compliance requirements. Continued use indicates acceptance of updated terms.'
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-5">
        <h1 className="text-4xl font-black">Terms & Conditions</h1>
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
