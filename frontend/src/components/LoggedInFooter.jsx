import { Link } from 'react-router-dom'

export default function LoggedInFooter() {
  return (
    <section className="mt-16 rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-10">
        <div>
          <h3 className="text-2xl font-black text-white mb-2">Let&apos;s keep in touch.</h3>
          <p className="text-sm text-white/55">Get product updates, migration tips, and new feature releases.</p>
        </div>
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Join our newsletter"
            className="w-full sm:w-80 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/35 focus:outline-none focus:border-blue-500/40"
          />
          <button className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-white/90">
            Subscribe
          </button>
        </form>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 text-sm text-white/60">
        <div className="space-y-2">
          <p className="text-white font-semibold">Product</p>
          <Link to="/dashboard" className="block hover:text-white">Dashboard</Link>
          <Link to="/upload" className="block hover:text-white">New Migration</Link>
          <Link to="/generate-sql" className="block hover:text-white">SQL Generator</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">Platform</p>
          <Link to="/schema-map" className="block hover:text-white">Schema Map</Link>
          <Link to="/anomalies" className="block hover:text-white">Anomalies</Link>
          <Link to="/deploy" className="block hover:text-white">Deploy</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">Resources</p>
          <Link to="/documentation" className="block hover:text-white">Documentation</Link>
          <Link to="/help" className="block hover:text-white">Help Center</Link>
          <Link to="/contact-support" className="block hover:text-white">Contact Support</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">Company</p>
          <Link to="/terms" className="block hover:text-white">Terms</Link>
          <Link to="/privacy" className="block hover:text-white">Privacy</Link>
        </div>
        <div className="space-y-2">
          <p className="text-white font-semibold">Account</p>
          <Link to="/profile" className="block hover:text-white">Profile</Link>
          <Link to="/settings" className="block hover:text-white">Settings</Link>
        </div>
      </div>
    </section>
  )
}
