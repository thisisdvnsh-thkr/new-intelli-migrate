import { motion } from 'framer-motion'

export default function BrandLogo({ width, height, className, showText = true, alt = 'Intelli-Migrate logo' }) {
  // Render a native image element. Width, height, and className are forwarded
  // so existing layout containers retain their sizing and styling behaviour.
  const img = (
    <img src="/logo.png" alt="IntelliMigrate" className="h-8 w-auto object-contain" />
  )

  if (!showText) return img

  return (
    <div className="flex items-center gap-3">
      {img}
      <span className="text-xl font-black tracking-tight text-white">Intelli-Migrate</span>
    </div>
  )
}
