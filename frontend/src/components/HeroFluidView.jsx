import { useEffect, useRef } from "react";

// Static foreground metrics data mapped directly to data migration functions [cite: 474, 523]
const MIGRATION_CARDS = [
  {
    title: "Multi-Format Ingestion",
    metric: "JSON · CSV · XML",
    desc: "Unstructured sources parsed and normalized into a unified intermediate representation.",
  },
  {
    title: "NLP Schema Mapping",
    metric: "98.6% match",
    desc: "Language models infer field semantics and align them to target relational columns.",
  },
  {
    title: "Anomaly Detection",
    metric: "Zero-loss",
    desc: "Outliers, type drift, and duplicates flagged before they ever reach production.",
  },
  {
    title: "Automated SQL Generation",
    metric: "DDL + DML",
    desc: "Production-ready schemas and inserts emitted with full lineage and audit trails.",
  },
];

export default function HeroFluidView() {
  const canvasRef = useRef(null); // [cite: 476]

  useEffect(() => {
    const canvas = canvasRef.current; // [cite: 477]
    if (!canvas) return; // [cite: 477]
    const ctx = canvas.getContext("2d", { alpha: true }); // [cite: 477]

    let width = 0; // [cite: 477]
    let height = 0; // [cite: 477]
    let dpr = Math.min(window.devicePixelRatio || 1, 2); // [cite: 477]
    let rafId = 0; // [cite: 477]
    let resizeTimer = 0; // [cite: 477]
    let running = true; // [cite: 477]

    // Flow-field particle tracking pool [cite: 477]
    const PARTICLE_COUNT = 140; // [cite: 477]
    const particles = []; // [cite: 477]

    const rand = (min, max) => min + Math.random() * (max - min); // [cite: 478]

    function seedParticles() {
      particles.length = 0; // [cite: 478]
      for (let i = 0; i < PARTICLE_COUNT; i++) { // [cite: 478]
        particles.push({
          x: rand(0, width),
          y: rand(0, height),
          speed: rand(0.15, 0.6),
          size: rand(0.6, 2.4),
          hue: Math.random() > 0.5 ? 243 : 272, // Slates, Indigos (#6366f1) and Neon Violets (#a855f7) [cite: 8, 479, 520]
          alpha: rand(0.15, 0.55),
          phase: rand(0, Math.PI * 2),
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); // [cite: 479]
      width = canvas.clientWidth; // [cite: 479]
      height = canvas.clientHeight; // [cite: 480]
      canvas.width = Math.floor(width * dpr); // [cite: 480]
      canvas.height = Math.floor(height * dpr); // [cite: 480]
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // [cite: 480]
      seedParticles(); // [cite: 480]
    }

    // High performance math formulas driving organic vector currents [cite: 4, 481, 515]
    function fieldAngle(x, y, t) {
      const nx = x * 0.0016; // [cite: 481]
      const ny = y * 0.0016; // [cite: 482]
      return (
        Math.sin(nx + t) * Math.cos(ny - t * 0.6) * Math.PI +
        Math.sin((nx + ny) * 1.3 + t * 0.4) * 0.8
      ); // [cite: 482]
    }

    let startTime = performance.now(); // [cite: 483]

    function frame(now) {
      if (!running) return; // [cite: 483]
      const t = (now - startTime) * 0.00018; // Smooth pulse loop duration [cite: 484, 516]

      // Wash slate-950 backdrop layers dynamically to make motion trails [cite: 484, 485]
      ctx.fillStyle = "rgba(2, 6, 23, 0.18)"; 
      ctx.fillRect(0, 0, width, height); // [cite: 485]

      const pulse = 0.5 + 0.5 * Math.sin(now * 0.0008); // [cite: 486]

      for (let i = 0; i < particles.length; i++) { // [cite: 487]
        const p = particles[i]; // [cite: 487]
        const angle = fieldAngle(p.x, p.y, t); // [cite: 488]

        // Linear bias drift shifting left-to-right to simulate a migration data pipeline [cite: 469, 488, 523]
        p.x += Math.cos(angle) * p.speed + 0.12; 
        p.y += Math.sin(angle) * p.speed; // [cite: 489]

        // Loop constraints keeping coordinate mutations clean with zero memory overhead [cite: 489, 490, 516]
        if (p.x > width + 8) p.x = -8; // [cite: 489]
        if (p.x < -8) p.x = width + 8; // [cite: 490]
        if (p.y > height + 8) p.y = -8; // [cite: 490]
        if (p.y < -8) p.y = height + 8; // [cite: 491]

        const a = p.alpha * (0.5 + 0.5 * pulse); // [cite: 491]
        const r = p.size * (1 + 0.35 * Math.sin(p.phase + now * 0.002)); // [cite: 492]

        ctx.beginPath(); // [cite: 492]
        ctx.fillStyle = `hsla(${p.hue}, 90%, 68%, ${a})`; // [cite: 493]
        ctx.shadowColor = `hsla(${p.hue}, 95%, 65%, ${a})`; // [cite: 493]
        ctx.shadowBlur = 14; // [cite: 493]
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2); // [cite: 494]
        ctx.fill(); // [cite: 494]
      }
      ctx.shadowBlur = 0; // [cite: 494]

      rafId = requestAnimationFrame(frame); // Native 60fps tracking loop [cite: 9, 494, 516]
    }

    function debouncedResize() {
      clearTimeout(resizeTimer); // [cite: 495]
      resizeTimer = setTimeout(resize, 150); // Debounced window calculation hooks [cite: 9, 495, 517]
    }

    resize(); // [cite: 496]
    rafId = requestAnimationFrame(frame); // [cite: 496]
    window.addEventListener("resize", debouncedResize); // [cite: 496]

    // Complete cleanup callback preventing runtime hardware choke, listener leaks, or rendering rot [cite: 17, 497, 518]
    return () => {
      running = false; // [cite: 497]
      cancelAnimationFrame(rafId); // [cite: 498]
      clearTimeout(resizeTimer); // [cite: 498]
      window.removeEventListener("resize", debouncedResize); // [cite: 498]
      particles.length = 0; // [cite: 498]
    };
  }, []);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white flex items-center justify-center">
      {/* Canvas Element Mask Base [cite: 5, 499] */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>

      {/* Glassmorphic vignette overlays protecting readability [cite: 10, 11, 499, 519] */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/40 to-slate-950 z-10" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(2,6,23,0.85)_100%)] z-10" />

      {/* Premium UI Layout Content View Layer [cite: 12, 499, 521] */}
      <div className="relative z-20 mx-auto flex max-w-6xl flex-col items-center px-6 py-28 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-widest text-indigo-200 uppercase backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_2px_rgba(99,102,241,0.8)]" />
          Architecture Overview
        </span>

        <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl text-white">
          Migrate Unstructured Data Into{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(168,85,247,0.45)]">
            Intelligent Schemas
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          IntelliMigrate transforms raw JSON, CSV, and XML into structured
          relational databases using NLP-driven mapping, real-time anomaly
          detection, and fully automated SQL generation.
        </p>

        {/* Symmetrical Frosted Glassmorphism Grid Container [cite: 13, 14, 503, 521, 522] */}
        <div className="mt-16 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {MIGRATION_CARDS.map((card) => (
            <div
              key={card.title}
              style={{ background: "rgba(15, 23, 42, 0.45)" }}
              className="group rounded-2xl border border-white/10 p-6 text-left backdrop-blur-xl transition-all duration-300 ease-out hover:scale-[1.03] hover:border-indigo-400/60 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)]"
            >
              <div className="text-sm font-semibold tracking-wide text-indigo-300">
                {card.metric}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {card.desc}
              </p>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/40 to-violet-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}