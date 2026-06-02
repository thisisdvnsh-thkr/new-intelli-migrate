export default function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-[40rem] w-[40rem] rounded-full bg-blue-600/25 blur-[120px] animate-aurora-1" />
      <div className="absolute -bottom-32 -right-32 h-[36rem] w-[36rem] rounded-full bg-fuchsia-600/25 blur-[120px] animate-aurora-2" />
      <div className="absolute top-1/3 left-1/3 h-[28rem] w-[28rem] rounded-full bg-cyan-400/15 blur-[120px] animate-aurora-3" />
    </div>
  )
}
