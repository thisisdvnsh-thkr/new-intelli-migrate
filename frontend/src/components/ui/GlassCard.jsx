import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

export default function GlassCard({ children, className = '', tiltStrength = 8, glow = true }) {
  const ref = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 20 })
  const sy = useSpring(y, { stiffness: 200, damping: 20 })
  const rotateX = useTransform(sy, [-0.5, 0.5], [tiltStrength, -tiltStrength])
  const rotateY = useTransform(sx, [-0.5, 0.5], [-tiltStrength, tiltStrength])
  const glareX = useTransform(sx, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(sy, [-0.5, 0.5], ['0%', '100%'])

  function handleMove(e) {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    x.set((e.clientX - r.left) / r.width - 0.5)
    y.set((e.clientY - r.top) / r.height - 0.5)
  }
  function handleLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: 'preserve-3d' }}
      className={`relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl
                  shadow-[0_8px_40px_rgba(0,0,0,0.35)] overflow-hidden will-change-transform
                  ${className}`}
    >
      {/* Top inner highlight (the glass edge) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {/* Left inner highlight */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/30 via-transparent to-transparent" />
      {/* Moving glare */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-1 opacity-50 mix-blend-screen"
        style={{
          background: `radial-gradient(280px circle at ${glareX.get()} ${glareY.get()}, rgba(255,255,255,0.18), transparent 60%)`
        }}
      />
      {glow && (
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl
                        bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-pink-500/0
                        opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{ maskImage: 'linear-gradient(black, black)' }}
        />
      )}
      <div style={{ transform: 'translateZ(40px)' }} className="relative">
        {children}
      </div>
    </motion.div>
  )
}
