import { Mail, ExternalLink, Users } from 'lucide-react'

const supportEmail = 'thisisdvnsh.thkr@gmail.com'
const githubUrl = 'https://github.com/thisisdvnsh-thkr/new-intelli-migrate/issues'

const members = [
  {
    name: 'Devansh Thakur',
    role: 'Team Lead, platform integration and delivery strategy',
    contribution: 'Led architecture decisions across frontend and backend orchestration, deployment synchronization, and production-facing UX alignment.',
    thought: 'Intelli-Migrate was built to turn migration complexity into a confident, guided flow. The strongest part of this project is how independent agents behave like one focused engineering team for real user outcomes.'
  },
  {
    name: 'Arpit Sharma',
    role: 'Parser and frontend workflow implementation',
    contribution: 'Worked on ingestion reliability and visual flow interactions to keep file parsing transparent and user-friendly.',
    thought: 'Our goal was to make migration feel understandable at each stage, not like a black box.'
  },
  {
    name: 'Prashant Kumar',
    role: 'Schema intelligence and mapping logic',
    contribution: 'Contributed to semantic mapping behaviors and confidence-aware field conversion strategy.',
    thought: 'The mapping layer is where messy data starts becoming structured intelligence.'
  },
  {
    name: 'Mohd Suhail Khan',
    role: 'Data quality and anomaly workflow',
    contribution: 'Focused on anomaly inspection flow and quality surfacing to reduce deployment risk.',
    thought: 'Reliable migration starts with clear quality signals before table generation.'
  },
  {
    name: 'Priyanshu Singh',
    role: 'Normalization and relational modeling',
    contribution: 'Built normalization experience and relational preparation for SQL generation stages.',
    thought: 'Normalization gives long-term value by making migrated data maintainable and query-ready.'
  }
]

export default function ContactSupport() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Contact Support</h1>
        <p className="text-white/55 text-lg">Reach Team Intelli-Migrate for issues, suggestions, and collaboration.</p>
      </header>

      <section className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <a href={`mailto:${supportEmail}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors">
            <Mail className="w-4 h-4" />
            {supportEmail}
          </a>
          <a href={githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
            <ExternalLink className="w-4 h-4" />
            GitHub comments & suggestions
          </a>
        </div>
        <img
          src="/team-photo.png"
          alt="Team Intelli-Migrate"
          className="w-full max-w-2xl max-h-[220px] object-cover rounded-2xl border border-white/10"
        />
      </section>

      <section className="rounded-3xl bg-white/[0.02] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-300" />
          <h2 className="text-2xl font-bold text-white">Team Intelli-Migrate</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {members.map((m) => (
            <article key={m.name} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-4">
              <h3 className="text-white font-bold">{m.name}</h3>
              <p className="text-sm text-blue-300 mt-1">{m.role}</p>
              <p className="text-sm text-white/65 mt-2">{m.contribution}</p>
              <p className="text-sm text-white/80 mt-3 italic">“{m.thought}”</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
