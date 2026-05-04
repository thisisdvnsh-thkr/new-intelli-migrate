import { motion } from 'framer-motion'

export default function BrandLogo({ size = 44, showText = true, textSize = 'text-xl', interactive = true }) {
  const icon = (
    <motion.div
      whileHover={interactive ? { rotate: 6, scale: 1.04 } : {}}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="relative rounded-2xl overflow-hidden shadow-lg shadow-blue-500/25"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#1d4ed8] via-[#7c3aed] to-[#db2777]" />
      <motion.div
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -inset-3 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_60%)]"
      />
      <svg
        className="absolute inset-0 m-auto"
        width={Math.round(size * 0.55)}
        height={Math.round(size * 0.55)}
        viewBox="0 0 64 64"
        fill="none"
      >
        <circle cx="32" cy="14" r="8" fill="white" fillOpacity="0.95" />
        <rect x="12" y="24" width="40" height="9" rx="4.5" fill="white" fillOpacity="0.92" />
        <rect x="12" y="36.5" width="40" height="9" rx="4.5" fill="white" fillOpacity="0.84" />
        <path d="M20 52C22.5 54.5 41.5 54.5 44 52" stroke="white" strokeOpacity="0.9" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </motion.div>
  )

  if (!showText) return icon

  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className={`${textSize} font-black tracking-tight text-white`}>Intelli-Migrate</span>
    </div>
  )
}
