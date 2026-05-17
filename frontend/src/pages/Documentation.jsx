import { FileText, Microscope, Network, FlaskConical } from 'lucide-react'

export default function Documentation() {
  const sections = [
    {
      icon: FileText,
      title: 'Project Report',
      text: 'This page is prepared for your full project report document upload. Once uploaded, it will render as an interactive chapter-based view.'
    },
    {
      icon: Microscope,
      title: 'Research Highlights',
      text: 'Comparative strategy, model choices, and migration trade-offs will be displayed in interactive cards and timelines.'
    },
    {
      icon: Network,
      title: 'Agent Architecture',
      text: 'Visual maps will explain each agent’s role, data handoff between stages, and fail-safe behavior in production.'
    },
    {
      icon: FlaskConical,
      title: 'Experiment Logs',
      text: 'Planned section for benchmark notes, quality score evolution, and test-driven findings.'
    }
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-2">Documentation & Research</h1>
        <p className="text-white/55 text-lg">Interactive documentation shell ready for your report upload.</p>
      </header>
      <section className="grid md:grid-cols-2 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-6">
            <s.icon className="w-7 h-7 text-blue-300 mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">{s.title}</h2>
            <p className="text-white/65">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
