import { useState, useEffect, useRef, useMemo } from "react";

/* ─────────────────────────────────────────────────────────────
   HOOKS
───────────────────────────────────────────────────────────── */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }, { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, vis];
}

function useElementScroll() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const filled = window.innerHeight - rect.top;
      setProgress(Math.max(0, Math.min(1, filled / total)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return [ref, progress];
}

/* ─────────────────────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────────────────────── */
function Counter({ to, suffix = "", prefix = "" }) {
  const [v, setV] = useState(0);
  const [ref, vis] = useInView(0.3);
  useEffect(() => {
    if (!vis) return;
    let s = null;
    const step = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / 1800, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(Math.floor(ease * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [vis, to]);
  return <span ref={ref}>{prefix}{v.toLocaleString()}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────
   WORD-REVEAL TEXT (Datawizz style)
───────────────────────────────────────────────────────────── */
function WordReveal({ text, className = "", style: s = {}, threshold = 0.1 }) {
  const [ref, vis] = useInView(threshold);
  const words = text.split(" ");
  return (
    <div ref={ref} className={className} style={s}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            marginRight: "0.28em",
            opacity: vis ? 1 : 0,
            transform: vis ? "translateY(0)" : "translateY(18px)",
            transition: `opacity 0.5s ease ${i * 40}ms, transform 0.5s ease ${i * 40}ms`,
          }}
        >
          {w}
        </span>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FLOATING PARTICLE CANVAS
───────────────────────────────────────────────────────────── */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.4 + 0.05,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.a})`;
        ctx.fill();
      });
      // draw connecting lines
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(167,139,250,${(1 - d / 100) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
}

/* ─────────────────────────────────────────────────────────────
   V12 ENGINE DIAGRAM
───────────────────────────────────────────────────────────── */
const MODULES = [
  { id: 1, label: "Procurement",      icon: "📦", angle: 0,   color: "#a78bfa" },
  { id: 2, label: "POS Checkout",     icon: "🏪", angle: 30,  color: "#38bdf8" },
  { id: 3, label: "Invoicing",        icon: "🧾", angle: 60,  color: "#34d399" },
  { id: 4, label: "Customer Khata",   icon: "🤝", angle: 90,  color: "#fbbf24" },
  { id: 5, label: "Expense Manager",  icon: "💸", angle: 120, color: "#f472b6" },
  { id: 6, label: "Multi-Warehouse",  icon: "🏭", angle: 150, color: "#fb923c" },
  { id: 7, label: "Product Variants", icon: "🎨", angle: 180, color: "#a78bfa" },
  { id: 8, label: "Auto-Assembly",    icon: "⚙️", angle: 210, color: "#38bdf8" },
  { id: 9, label: "SuperAdmin HQ",    icon: "🛡️", angle: 240, color: "#34d399" },
  { id: 10,label: "Report Factory",  icon: "📊", angle: 270, color: "#fbbf24" },
  { id: 11,label: "Workforce",        icon: "👥", angle: 300, color: "#f472b6" },
  { id: 12,label: "E-Commerce Sync",  icon: "🌐", angle: 330, color: "#fb923c" },
];

function V12EngineDiagram() {
  const [ref, vis] = useInView(0.1);
  const [active, setActive] = useState(null);
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 60); return () => clearInterval(t); }, []);

  const R = 160; // orbit radius
  const cx = 200, cy = 200;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", maxWidth: 500, margin: "0 auto" }}>
      <svg viewBox="0 0 400 400" style={{ width: "100%", overflow: "visible" }}>
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Orbit ring */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx={cx} cy={cy} r={R + 30} fill="none" stroke="rgba(167,139,250,0.05)" strokeWidth="1" />
        <circle cx={cx} cy={cy} r={R - 30} fill="none" stroke="rgba(167,139,250,0.05)" strokeWidth="1" />

        {/* Rotating scanner line */}
        {vis && (
          <line
            x1={cx} y1={cy}
            x2={cx + Math.cos((tick * 1.8 * Math.PI) / 180) * (R + 28)}
            y2={cy + Math.sin((tick * 1.8 * Math.PI) / 180) * (R + 28)}
            stroke="rgba(167,139,250,0.3)" strokeWidth="1"
            style={{ transition: "none" }}
          />
        )}

        {/* Connection lines from modules to core */}
        {MODULES.map((m) => {
          const rad = (m.angle * Math.PI) / 180;
          const mx = cx + Math.cos(rad) * R;
          const my = cy + Math.sin(rad) * R;
          const isActive = active === m.id;
          return (
            <line key={m.id}
              x1={cx} y1={cy} x2={mx} y2={my}
              stroke={isActive ? m.color : "rgba(167,139,250,0.1)"}
              strokeWidth={isActive ? 1.5 : 0.5}
              style={{ transition: "all 0.3s" }}
            />
          );
        })}

        {/* Core glow */}
        <circle cx={cx} cy={cy} r={55} fill="url(#coreGlow)" />
        <circle cx={cx} cy={cy} r={44} fill="rgba(167,139,250,0.08)" stroke="rgba(167,139,250,0.3)" strokeWidth="1" filter="url(#glow)" />
        <circle cx={cx} cy={cy} r={32} fill="rgba(10,10,20,0.9)" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" />

        {/* Core text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">V12</text>
        <text x={cx} y={cy + 6} textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="Inter,sans-serif">TWIN TURBO</text>
        <text x={cx} y={cy + 17} textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="Inter,sans-serif">QORE</text>

        {/* Module nodes */}
        {MODULES.map((m, i) => {
          const rad = (m.angle * Math.PI) / 180;
          const mx = cx + Math.cos(rad) * R;
          const my = cy + Math.sin(rad) * R;
          const isActive = active === m.id;
          const animOffset = vis ? Math.sin((tick * 0.02) + i) * 2 : 0;
          return (
            <g key={m.id}
              transform={`translate(${mx + Math.cos(rad) * animOffset}, ${my + Math.sin(rad) * animOffset})`}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setActive(m.id)}
              onMouseLeave={() => setActive(null)}
            >
              <circle r={isActive ? 20 : 16} fill={isActive ? m.color + "33" : "rgba(15,17,30,0.95)"} stroke={m.color} strokeWidth={isActive ? 1.5 : 0.8} style={{ transition: "all 0.3s" }} filter={isActive ? "url(#glow)" : ""} />
              <text textAnchor="middle" dominantBaseline="central" fontSize="12">{m.icon}</text>
              {isActive && (
                <text y={26} textAnchor="middle" fill={m.color} fontSize="7" fontFamily="Inter,sans-serif" fontWeight="600">{m.label}</text>
              )}
            </g>
          );
        })}

        {/* Twin turbos */}
        {[["Left", -68, 0, "#38bdf8"], ["Right", 68, 0, "#34d399"]].map(([label, ox, oy, c]) => (
          <g key={label} transform={`translate(${cx + ox}, ${cy + oy})`}>
            <ellipse rx={14} ry={10} fill="rgba(10,10,20,0.9)" stroke={c} strokeWidth="1" opacity="0.7" />
            <text textAnchor="middle" dominantBaseline="central" fontSize="6" fill={c} fontFamily="Inter,sans-serif">⚡</text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      {active && (
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(10,10,20,0.95)", border: `1px solid ${MODULES.find(m => m.id === active)?.color}44`, borderRadius: 8, padding: "8px 16px", fontSize: 12, color: "#e2e8f0", whiteSpace: "nowrap", pointerEvents: "none" }}>
          {MODULES.find(m => m.id === active)?.icon} {MODULES.find(m => m.id === active)?.label}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SCROLL PARALLAX LAYER
───────────────────────────────────────────────────────────── */
function ParallaxLayer({ children, speed = 0.2, style: s = {} }) {
  const scrollY = useScrollY();
  return (
    <div style={{ transform: `translateY(${scrollY * speed}px)`, willChange: "transform", ...s }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STICKY SCROLL SECTION
───────────────────────────────────────────────────────────── */
function StickySection({ label, labelColor = "#a78bfa", title, items }) {
  const [sectionRef, progress] = useElementScroll();
  const step = Math.min(items.length - 1, Math.floor(progress * (items.length + 0.5)));

  return (
    <div ref={sectionRef} style={{ position: "relative", minHeight: `${items.length * 80}vh` }}>
      <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          {/* Left: step list */}
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: labelColor + "18", border: `1px solid ${labelColor}44`, borderRadius: 999, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: labelColor, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 28 }}>
              {label}
            </div>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 800, color: "#f1f5f9", marginBottom: 40, letterSpacing: "-0.025em", lineHeight: 1.2 }}>{title}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 18, padding: "18px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: i === step ? 1 : 0.3, transform: i === step ? "translateX(0)" : "translateX(-8px)", transition: "all 0.5s ease" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: i === step ? item.color + "22" : "rgba(255,255,255,0.03)", border: `1px solid ${i === step ? item.color + "55" : "rgba(255,255,255,0.06)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0, transition: "all 0.5s" }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#f1f5f9", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: active panel */}
          <div style={{ position: "relative" }}>
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  position: i === 0 ? "relative" : "absolute",
                  top: 0, left: 0, right: 0,
                  opacity: i === step ? 1 : 0,
                  transform: i === step ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
                  transition: "all 0.5s ease",
                  pointerEvents: i === step ? "auto" : "none",
                }}
              >
                <div style={{ background: "linear-gradient(135deg, rgba(15,17,30,0.95), rgba(10,10,20,0.95))", border: `1px solid ${item.color}33`, borderRadius: 20, padding: "28px 24px", backdropFilter: "blur(20px)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: item.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: item.color }}>{item.tag}</div>
                    </div>
                  </div>
                  {item.visual}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   POS VISUAL
───────────────────────────────────────────────────────────── */
function POSVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[
        ["Nike Air Max 270", "×2", "PKR 25,000", "#a78bfa"],
        ["Levi's 501 Slim", "×1", "PKR 8,200",  "#38bdf8"],
        ["Adidas Originals Cap", "×3", "PKR 6,300", "#34d399"],
      ].map(([name, qty, price, c]) => (
        <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: c + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: c, fontWeight: 700 }}>{qty}</div>
            <span style={{ fontSize: 12, color: "#e2e8f0" }}>{name}</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{price}</span>
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 12px", background: "rgba(167,139,250,0.08)", borderRadius: 10, marginTop: 4 }}>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>Total</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: "#a78bfa" }}>PKR 39,500</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <div style={{ flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "#94a3b8" }}>💵 Cash</div>
        <div style={{ flex: 1, textAlign: "center", padding: "9px 0", borderRadius: 8, background: "#a78bfa", fontSize: 12, color: "#fff", fontWeight: 600 }}>Charge →</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REPORT VISUAL
───────────────────────────────────────────────────────────── */
function ReportVisual() {
  const bars = [55, 72, 48, 88, 65, 92, 71, 96, 80, 85, 74, 100];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[["Gross Profit","PKR 2.1M","↑ 12.4%","#34d399"],["Net Margin","38.4%","↑ 3.1pp","#38bdf8"]].map(([l,v,d,c]) => (
          <div key={l} style={{ padding: "12px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 10, color: "#34d399" }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 60 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, background: h === 100 ? "#38bdf8" : `rgba(56,189,248,${0.15 + h / 280})`, borderRadius: "2px 2px 0 0", transition: "height 1.5s ease" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: "#374151" }}>
        <span>Jan</span><span>Jun</span><span>Dec</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AI VISUAL
───────────────────────────────────────────────────────────── */
function AIVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ alignSelf: "flex-end", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: "12px 12px 2px 12px", padding: "10px 14px", fontSize: 12, color: "#e2e8f0", maxWidth: "85%", lineHeight: 1.5 }}>
        Which product had the highest margin this month?
      </div>
      <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "2px 12px 12px 12px", padding: "12px 14px", fontSize: 12, color: "#cbd5e1", maxWidth: "90%", lineHeight: 1.6 }}>
        <span style={{ color: "#a78bfa", fontWeight: 700 }}>Nike Air Max 270</span> led with a 54% gross margin. Revenue: PKR 186K. Consider expanding this SKU in Lahore and Islamabad branches.
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
        {["Show top 5 SKUs","Stock forecast","P&L summary"].map(q => (
          <div key={q} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(167,139,250,0.2)", fontSize: 10, color: "#a78bfa", cursor: "pointer" }}>{q}</div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export default function VenQoreLanding() {
  const scrollY = useScrollY();
  const [heroRef, heroVis] = useInView(0.01);

  const heroParallax = scrollY * 0.4;
  const heroOpacity = Math.max(0, 1 - scrollY / 600);
  const navBg = scrollY > 50 ? "rgba(7,8,16,0.92)" : "transparent";
  const navBlur = scrollY > 50 ? "blur(20px)" : "none";

  return (
    <div style={{ background: "#07080f", color: "#f1f5f9", fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0%,100%{opacity:.35} 50%{opacity:.6} }
        @keyframes orbitSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes scanLine { from{stroke-dashoffset:200} to{stroke-dashoffset:0} }
        @keyframes ticker { 0%{opacity:0;transform:translateY(8px)} 15%{opacity:1;transform:translateY(0)} 85%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-8px)} }
        @keyframes float1 { 0%,100%{transform:translateY(0px) rotate(-1deg)} 50%{transform:translateY(-16px) rotate(1.5deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(-8px) rotate(1deg)} 50%{transform:translateY(8px) rotate(-1.5deg)} }
        @keyframes float3 { 0%,100%{transform:translateY(4px)} 50%{transform:translateY(-12px)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes borderGlow { 0%,100%{border-color:rgba(167,139,250,0.2)} 50%{border-color:rgba(167,139,250,0.6)} }
        @keyframes countUp { from{opacity:0} to{opacity:1} }
        @keyframes lineGrow { from{width:0} to{width:100%} }

        .glow-pulse { animation: glowPulse 4s ease-in-out infinite; }
        .glow-pulse-2 { animation: glowPulse 6s ease-in-out infinite 2s; }
        .float-1 { animation: float1 8s ease-in-out infinite; }
        .float-2 { animation: float2 10s ease-in-out infinite 1s; }
        .float-3 { animation: float3 7s ease-in-out infinite 2.5s; }
        .border-glow { animation: borderGlow 3s ease-in-out infinite; }

        .gradient-text {
          background: linear-gradient(135deg, #f8fafc 0%, #a78bfa 40%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .shimmer-text {
          background: linear-gradient(90deg, #a78bfa, #38bdf8, #a78bfa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #07080f; }
        ::-webkit-scrollbar-thumb { background: rgba(167,139,250,0.3); border-radius: 2px; }

        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hero-inner { flex-direction: column !important; }
          .hero-vis { display: none !important; }
          .two-col { grid-template-columns: 1fr !important; gap: 40px !important; }
          .stats-row { grid-template-columns: 1fr 1fr !important; }
          .pricing-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── NAV ────────────────────────────────────────────────── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: navBg, backdropFilter: navBlur, WebkitBackdropFilter: navBlur, borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,0.06)" : "none", transition: "all 0.4s ease" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#a78bfa,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#fff" }}>V</div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.025em" }}>VenQore</span>
          </div>
          <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 13, color: "#64748b" }}>
            {["Platform","POS","Inventory","AI Engine","Reports","Pricing"].map(l => (
              <a key={l} href="#" style={{ color: "inherit", textDecoration: "none" }}
                onMouseEnter={e => e.target.style.color = "#f1f5f9"}
                onMouseLeave={e => e.target.style.color = "#64748b"}
              >{l}</a>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>Sign In</button>
            <button style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "linear-gradient(90deg,#a78bfa,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Free Trial →</button>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO — Full cinematic parallax
      ══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{ position: "relative", height: "100vh", minHeight: 700, display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* Particle canvas */}
        <ParticleCanvas />

        {/* Deep background glow layers with parallax */}
        <div className="glow-pulse" style={{ position: "absolute", top: "5%", left: "20%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 65%)", filter: "blur(60px)", transform: `translateY(${scrollY * 0.15}px)`, pointerEvents: "none" }} />
        <div className="glow-pulse-2" style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.1) 0%, transparent 65%)", filter: "blur(50px)", transform: `translateY(${scrollY * -0.1}px)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "30%", right: "30%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)", filter: "blur(30px)", transform: `translateY(${scrollY * 0.25}px)`, pointerEvents: "none" }} />

        {/* Grid lines */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)", backgroundSize: "64px 64px", transform: `translateY(${scrollY * 0.05}px)`, pointerEvents: "none" }} />

        {/* Hero content with parallax */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "0 24px", width: "100%", transform: `translateY(${heroParallax}px)`, opacity: heroOpacity }}>
          <div className="hero-inner" style={{ display: "flex", alignItems: "center", gap: 64 }}>
            {/* Left */}
            <div style={{ flex: "0 0 54%", animation: "fadeUp 0.9s ease both" }}>
              {/* Live pill */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "6px 16px" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", display: "block" }} />
                <span style={{ fontSize: 12, color: "#94a3b8" }}>635 tests passing · 3,970 assertions live</span>
              </div>

              <h1 style={{ fontSize: "clamp(38px, 5.8vw, 72px)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-0.04em", marginBottom: 24 }}>
                <span style={{ display: "block", color: "#f8fafc" }}>The ERP That</span>
                <span className="gradient-text" style={{ display: "block" }}>Runs on Truth.</span>
              </h1>

              <p style={{ fontSize: "clamp(15px, 1.7vw, 18px)", color: "#94a3b8", lineHeight: 1.7, marginBottom: 36, maxWidth: 500 }}>
                VenQore's V12 Twin Turbo Qore engine powers 226+ capabilities with bulletproof double-entry accounting. Every debit equals every credit. Every report checks. Every transaction balances — always.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
                <button
                  style={{ padding: "14px 28px", borderRadius: 12, border: "none", background: "linear-gradient(90deg,#a78bfa,#6366f1)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 0 50px rgba(167,139,250,0.4)", letterSpacing: "-0.01em" }}
                  onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 60px rgba(167,139,250,0.5)"; }}
                  onMouseLeave={e => { e.target.style.transform = "none"; e.target.style.boxShadow = "0 0 50px rgba(167,139,250,0.4)"; }}
                >
                  Launch Demo Store →
                </button>
                <button style={{ padding: "14px 24px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#e2e8f0", fontSize: 15, cursor: "pointer" }}>
                  ▷ Watch Overview
                </button>
              </div>

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 12, color: "#4b5563" }}>
                {["14-day free trial","No credit card","Full access","Instant setup"].map(t => (
                  <span key={t} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ color: "#34d399" }}>✓</span>{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — floating parallax cards */}
            <div className="hero-vis" style={{ flex: 1, position: "relative", height: 480 }}>
              {/* Main dashboard card — moves slowest */}
              <div className="float-1" style={{ position: "absolute", inset: 0, zIndex: 3 }}>
                <div className="border-glow" style={{ background: "rgba(10,11,22,0.85)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 20, backdropFilter: "blur(20px)", padding: 20, height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
                      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em" }}>VENQORE COMMAND CENTER</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#34d399" }}>Live</span>
                  </div>
                  {/* KPIs */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      ["Revenue","PKR 4.2M","↑8.1%","#a78bfa"],
                      ["Orders","2,840","↑124","#38bdf8"],
                      ["Profit","PKR 890K","↑12.4%","#34d399"],
                    ].map(([l,v,d,c]) => (
                      <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 8px" }}>
                        <div style={{ fontSize: 9, color: "#4b5563", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: c, letterSpacing: "-0.02em" }}>{v}</div>
                        <div style={{ fontSize: 9, color: "#34d399" }}>{d}</div>
                      </div>
                    ))}
                  </div>
                  {/* Revenue bars */}
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "12px 10px" }}>
                    <div style={{ fontSize: 9, color: "#374151", marginBottom: 8 }}>Revenue — 12mo</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 64 }}>
                      {[42,68,51,82,60,88,55,94,71,86,70,100].map((h,i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: h === 100 ? "#a78bfa" : `rgba(167,139,250,${0.12 + h/220})`, borderRadius: "2px 2px 0 0" }} />
                      ))}
                    </div>
                  </div>
                  {/* Stock health */}
                  <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: "#374151", marginBottom: 8 }}>Inventory Health</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {[["In Stock",78,"#34d399"],["Low Stock",14,"#fbbf24"],["Out of Stock",8,"#f87171"]].map(([l,p,c]) => (
                        <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ fontSize: 9, color: "#64748b", width: 60, flexShrink: 0 }}>{l}</div>
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                            <div style={{ width: `${p}%`, height: "100%", background: c, borderRadius: 2, transition: "width 2s ease" }} />
                          </div>
                          <div style={{ fontSize: 9, color: "#4b5563", width: 20, textAlign: "right" }}>{p}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating AI chip — moves faster */}
              <div className="float-2" style={{ position: "absolute", right: -40, top: 20, zIndex: 5, width: 200 }}>
                <div style={{ background: "rgba(10,11,22,0.9)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: 14, padding: "14px 16px", backdropFilter: "blur(20px)" }}>
                  <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 8 }}>AI GROWTH ENGINE ✦</div>
                  <div style={{ fontSize: 11, color: "#e2e8f0", lineHeight: 1.5 }}><strong style={{ color: "#a78bfa" }}>Nike Air Max 270</strong> — top margin this week at 54% gross.</div>
                  <div style={{ fontSize: 10, color: "#4b5563", marginTop: 6 }}>Plain English. Real data.</div>
                </div>
              </div>

              {/* Live tx chip */}
              <div className="float-3" style={{ position: "absolute", left: -30, bottom: 40, zIndex: 5, width: 170 }}>
                <div style={{ background: "rgba(10,11,22,0.9)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 12, padding: "12px 14px", backdropFilter: "blur(16px)" }}>
                  <div style={{ fontSize: 9, color: "#34d399", fontWeight: 600, marginBottom: 6 }}>LIVE TRANSACTION</div>
                  <div style={{ fontSize: 11, color: "#f1f5f9", fontWeight: 600 }}>PKR 4,800 ✓</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>POS · Register 2 · DHA Branch</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>Balanced. Ledger updated.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(transparent, #07080f)", pointerEvents: "none" }} />
      </section>

      {/* ══════════════════════════════════════════════════════════
          TRUSTED BY
      ══════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "24px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#374151", letterSpacing: "0.08em", textTransform: "uppercase" }}>Trusted by businesses in</span>
          {["🇵🇰 Pakistan","🇸🇦 Saudi Arabia","🇦🇪 UAE","🇬🇧 United Kingdom","🇺🇸 United States"].map(c => (
            <span key={c} style={{ fontSize: 12, color: "#4b5563", padding: "4px 12px", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 999 }}>{c}</span>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SCROLL-DRIVEN WORD REVEAL — "What VenQore is"
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "120px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <WordReveal
            text="VenQore is a bulletproof double-entry financial engine wrapped in a beautiful, fast, and intelligent retail operating system. Every transaction balances. Every report checks. Every number is the truth."
            style={{ fontSize: "clamp(22px,3.2vw,38px)", fontWeight: 700, lineHeight: 1.45, letterSpacing: "-0.02em", color: "#f1f5f9" }}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          V12 ENGINE — THE SHOWPIECE
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 24px 120px", position: "relative", overflow: "hidden" }}>
        {/* Parallax glow behind engine */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: `translate(-50%, ${scrollY * 0.08}px)`, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)", filter: "blur(80px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 72 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 999, padding: "5px 16px", fontSize: 11, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 24 }}>
              🏎️ The Engine
            </div>
            <WordReveal
              text="V12 Twin Turbo Qore"
              style={{ fontSize: "clamp(36px,6vw,80px)", fontWeight: 900, letterSpacing: "-0.04em", color: "#f8fafc" }}
            />
            <p style={{ fontSize: "clamp(14px,1.6vw,17px)", color: "#64748b", maxWidth: 560, margin: "16px auto 0", lineHeight: 1.65 }}>
              12 precision power modules orbiting a single unbreakable accounting core. Every module talks to The Qore. The Qore never lies.
            </p>
          </div>

          {/* Engine diagram + stats side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
            <div style={{ transform: `translateY(${scrollY * -0.04}px)` }}>
              <V12EngineDiagram />
              <p style={{ textAlign: "center", fontSize: 11, color: "#374151", marginTop: 12 }}>Hover any module to explore</p>
            </div>
            <div style={{ transform: `translateY(${scrollY * 0.04}px)` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Power specs */}
                {[
                  { label: "635+ Horsepower Tests", val: 635, suffix: "+", color: "#a78bfa", desc: "Passed unit & feature tests validating system boundaries" },
                  { label: "3,970+ Octane Assertions", val: 3970, suffix: "+", color: "#38bdf8", desc: "Live assertions confirming ledger integrity under pressure" },
                  { label: "13-Gate Compression Chamber", val: 13, suffix: "", color: "#34d399", desc: "Capstone reconciliation tests — multi-split payments, returns" },
                  { label: "DECIMAL(20,4) Precision", val: 20, suffix: " digits", color: "#fbbf24", desc: "Every currency column cast to eliminate rounding errors" },
                ].map((s, i) => {
                  const [ref, vis] = useInView(0.1);
                  return (
                    <div key={i} ref={ref} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${s.color}22`, borderRadius: 14, padding: "18px 20px", display: "flex", gap: 16, alignItems: "flex-start", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateX(20px)", transition: `all 0.5s ease ${i * 80}ms` }}>
                      <div style={{ fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 900, color: s.color, letterSpacing: "-0.03em", minWidth: 70, flexShrink: 0 }}>
                        <Counter to={s.val} suffix={s.suffix} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5 }}>{s.desc}</div>
                      </div>
                    </div>
                  );
                })}

                {/* 5 audit categories */}
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ fontSize: 11, color: "#4b5563", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>5 Audit Categories Passed</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      ["Journal Integrity","Single write path — raw DB inserts blocked"],
                      ["Derived Balances","Live recalculation prevents number drift"],
                      ["Unified Read Engine","One reporting service — no dual calculators"],
                      ["Heart Capstone Gate","13 end-to-end reconciliation scenarios"],
                      ["Dashboard Integration","Summaries match general ledger exactly"],
                    ].map(([title, desc], i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ width: 18, height: 18, borderRadius: 5, background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#34d399", flexShrink: 0, marginTop: 1 }}>✓</div>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{title} </span>
                          <span style={{ fontSize: 11, color: "#374151" }}>{desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STICKY SCROLL — Platform Deep Dive
      ══════════════════════════════════════════════════════════ */}
      <StickySection
        label="Platform Modules"
        labelColor="#a78bfa"
        title="Every tool your business actually needs."
        items={[
          {
            icon: "🏪", title: "Point of Sale", tag: "Ultra-fast cashier system",
            color: "#a78bfa",
            desc: "Barcode-ready. PIN login. Split payments. Live WebSocket sync across all terminals with zero page reloads.",
            visual: <POSVisual />,
          },
          {
            icon: "📊", title: "Report Factory", tag: "40+ instant reports",
            color: "#38bdf8",
            desc: "P&L, Balance Sheet, Stock Aging, Party-wise Profitability, Cash Flow, and 35 more — generated instantly from your live ledger.",
            visual: <ReportVisual />,
          },
          {
            icon: "✦", title: "AI Growth Engine", tag: "Ask in plain English",
            color: "#fbbf24",
            desc: "Query your entire ledger in plain English. Stock forecasts, margin analysis, churn prediction — your data, answered instantly.",
            visual: <AIVisual />,
          },
        ]}
      />

      {/* ══════════════════════════════════════════════════════════
          226+ CAPABILITIES — Parallax grid
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "120px 24px", position: "relative", overflow: "hidden" }}>
        <ParallaxLayer speed={0.06} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8, opacity: 0.04, padding: "0 24px" }}>
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} style={{ height: 60, background: "rgba(167,139,250,1)", borderRadius: 6 }} />
            ))}
          </div>
        </ParallaxLayer>

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 999, padding: "5px 16px", fontSize: 11, fontWeight: 700, color: "#38bdf8", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 20 }}>
              Tier Capabilities
            </div>
            <WordReveal
              text="226+ capabilities across 5 tiers"
              style={{ fontSize: "clamp(28px,4vw,52px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9" }}
            />
            <p style={{ fontSize: 16, color: "#4b5563", marginTop: 14 }}>From micro-gestures to platform infrastructure — nothing is missing.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {[
              { tier: "Tier 1", icon: "🔬", label: "Micro-Comforts", sub: "Hotkeys, gestures, visual polish", color: "#a78bfa", items: ["Keyboard hotkeys","Touchscreen gestures","Visual micro-polish","POS speed shortcuts"] },
              { tier: "Tier 2", icon: "🌱", label: "Operational Helpers", sub: "Auto-math, split payments", color: "#38bdf8", items: ["Rounding automation","Split payment tools","Quick calc utilities","Daily task automation"] },
              { tier: "Tier 3", icon: "📦", label: "Modular Components", sub: "HR, expenses, customer life", color: "#34d399", items: ["Expense tracking","HR attendance","Customer lifecycle","Supplier management"] },
              { tier: "Tier 4", icon: "🏛️", label: "Heavyweight Engines", sub: "Real-time ledgers, costing", color: "#fbbf24", items: ["Double-entry ledger","LIFO/FIFO costing","Legacy DB restorer","Batch variant costing"] },
              { tier: "Tier 5", icon: "🌌", label: "Platform Infrastructure", sub: "SaaS, multi-tenant, God Admin", color: "#f472b6", items: ["Multi-tenant isolation","SuperAdmin HQ","Plan limit gating","Redis-cached gates"] },
            ].map((t, i) => {
              const [ref, vis] = useInView(0.08);
              return (
                <div key={i} ref={ref} style={{ background: "#0c0d1a", border: `1px solid ${t.color}22`, borderRadius: 16, padding: "22px 18px", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(24px)", transition: `all 0.6s ease ${i * 80}ms` }}>
                  <div style={{ fontSize: 22, marginBottom: 12 }}>{t.icon}</div>
                  <div style={{ fontSize: 10, color: t.color, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>{t.tier}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "#374151", marginBottom: 16, lineHeight: 1.4 }}>{t.sub}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {t.items.map(item => (
                      <div key={item} style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: t.color, fontSize: 9 }}>▸</span>{item}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          MULTI-STORE + AI — Side by side with parallax
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <div style={{ transform: `translateY(${scrollY * 0.03}px)` }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 999, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: "#34d399", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 24 }}>
              Multi-Store Hub
            </div>
            <WordReveal
              text="One login. Every branch. Real-time."
              style={{ fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.025em", color: "#f1f5f9", marginBottom: 20 }}
            />
            <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, marginBottom: 32 }}>
              Manage unlimited branches from a single dashboard. Granular roles per store — Owner in Lahore, Manager in Karachi, read-only in Islamabad. Data isolated. Reports consolidated.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                ["Unlimited Branches","Scale from 1 to 1,000 stores without architecture changes"],
                ["Granular Role Control","Different permissions per store per user — fully configurable"],
                ["Real-Time Sync","WebSocket-powered live data across every terminal"],
                ["Isolated Scopes","Each branch in its own secure tenant partition"],
              ].map(([title, desc]) => {
                const [ref, vis] = useInView(0.1);
                return (
                  <div key={title} ref={ref} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "16px 14px", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(12px)", transition: "all 0.5s ease" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ transform: `translateY(${scrollY * -0.03}px)` }}>
            <div style={{ background: "#0c0d1a", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: 11, color: "#374151", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 16 }}>MULTI-STORE DASHBOARD</div>
              {[
                { name: "Lahore — Gulberg", rev: "PKR 2.1M", status: "Open", role: "Owner", trend: "+8.1%", bars: [60,72,55,88,70,96,82] },
                { name: "Karachi — DHA",   rev: "PKR 1.8M", status: "Open", role: "Manager", trend: "+4.3%", bars: [50,65,48,76,62,84,71] },
                { name: "Islamabad — F-8", rev: "PKR 940K", status: "Closing", role: "Owner", trend: "+2.1%", bars: [42,54,38,60,52,70,58] },
              ].map((s, si) => {
                const [ref, vis] = useInView(0.1);
                return (
                  <div key={s.name} ref={ref} style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateX(-12px)", transition: `all 0.5s ease ${si * 100}ms` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 3 }}>{s.name}</div>
                        <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
                          <span style={{ color: "#4b5563" }}>{s.role}</span>
                          <span style={{ color: s.status === "Open" ? "#34d399" : "#fbbf24" }}>● {s.status}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#a78bfa", letterSpacing: "-0.02em" }}>{s.rev}</div>
                        <div style={{ fontSize: 10, color: "#34d399" }}>{s.trend} today</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28 }}>
                      {s.bars.map((h, i) => (
                        <div key={i} style={{ flex: 1, height: `${h}%`, background: `rgba(167,139,250,${0.15 + h/180})`, borderRadius: "1px 1px 0 0" }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <WordReveal
              text="Businesses that chose truth."
              style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {[
              { name: "Hamza Farooq", role: "Owner", co: "FreshMart Lahore", q: "We had mystery discrepancies every month-end. After VenQore, our books balance to the paisa. The double-entry engine is not marketing — it's real engineering.", c: "#a78bfa", d: 0 },
              { name: "Tariq Al-Rashid", role: "Operations Manager", co: "Gulf Retail Group, UAE", q: "Managing 4 branches from one screen was impossible before. Now I see live revenue, stock, and cashier activity across all stores simultaneously.", c: "#38bdf8", d: 80 },
              { name: "Sara Mehmood", role: "CFO", co: "Threads Fashion, Karachi", q: "The Report Factory replaced two hours of manual Excel work every day. P&L by item, by category, by cashier — instant, accurate, exportable.", c: "#34d399", d: 160 },
            ].map((t) => {
              const [ref, vis] = useInView(0.1);
              return (
                <div key={t.name} ref={ref} style={{ background: "#0c0d1a", border: `1px solid ${t.c}22`, borderRadius: 18, padding: "28px 24px", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(24px)", transition: `all 0.6s ease ${t.d}ms` }}>
                  <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                    {[...Array(5)].map((_,i) => <span key={i} style={{ color: "#fbbf24", fontSize: 12 }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75, marginBottom: 22, fontStyle: "italic" }}>"{t.q}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${t.c}44,${t.c}22)`, border: `1px solid ${t.c}44`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: t.c }}>{t.name[0]}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#374151" }}>{t.role}, {t.co}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <WordReveal text="Transparent pricing. Full access." style={{ fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9" }} />
            <p style={{ fontSize: 15, color: "#4b5563", marginTop: 12 }}>14-day free trial. No credit card. Cancel anytime.</p>
          </div>
          <div className="pricing-row" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
            {[
              { plan: "Starter", price: "PKR 4,999", mo: "/mo", desc: "Single-store businesses ready to move beyond spreadsheets.", features: ["1 Store","2 Users","POS + Inventory + Purchases","15 Reports","Customer Khata","Email Support"], hi: false, delay: 0 },
              { plan: "Professional", price: "PKR 12,999", mo: "/mo", desc: "Growing retailers who need the full truth about their business.", features: ["3 Stores","10 Users","All 12 Core Modules","40+ Reports","AI Growth Engine","WooCommerce Sync","Priority Support"], hi: true, delay: 80 },
              { plan: "Enterprise", price: "Custom", mo: "", desc: "Multi-branch chains, franchise groups, SaaS operators.", features: ["Unlimited Stores","Unlimited Users","SuperAdmin HQ","Full API Access","Dedicated Onboarding","SLA Support"], hi: false, delay: 160 },
            ].map((p) => {
              const [ref, vis] = useInView(0.1);
              return (
                <div key={p.plan} ref={ref} style={{ background: p.hi ? "linear-gradient(135deg, rgba(167,139,250,0.1), rgba(99,102,241,0.06))" : "#0c0d1a", border: p.hi ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "32px 26px", position: "relative", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(24px)", transition: `all 0.6s ease ${p.delay}ms` }}>
                  {p.hi && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg,#a78bfa,#6366f1)", borderRadius: 999, padding: "4px 14px", fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>Most Popular</div>}
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{p.plan}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                    <span style={{ fontSize: 34, fontWeight: 900, color: "#f1f5f9", letterSpacing: "-0.03em" }}>{p.price}</span>
                    <span style={{ fontSize: 12, color: "#374151" }}>{p.mo}</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#4b5563", marginBottom: 22, lineHeight: 1.5 }}>{p.desc}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 26 }}>
                    {p.features.map(f => (
                      <div key={f} style={{ display: "flex", gap: 8, fontSize: 12, color: "#94a3b8" }}>
                        <span style={{ color: "#34d399", flexShrink: 0 }}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                  <button style={{ width: "100%", padding: "12px 0", borderRadius: 10, border: p.hi ? "none" : "1px solid rgba(255,255,255,0.1)", background: p.hi ? "linear-gradient(90deg,#a78bfa,#6366f1)" : "transparent", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    {p.hi ? "Start Free Trial" : "Get Started"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 24px 120px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ position: "relative", background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(167,139,250,0.06))", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 28, padding: "clamp(48px,6vw,80px)", textAlign: "center", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: `translate(-50%,-50%) translateY(${scrollY * 0.02}px)`, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(167,139,250,0.1) 0%,transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <WordReveal
                text="Stop estimating. Start knowing."
                style={{ fontSize: "clamp(30px,5vw,56px)", fontWeight: 900, letterSpacing: "-0.035em", color: "#f8fafc", marginBottom: 20 }}
              />
              <p style={{ fontSize: "clamp(14px,1.7vw,18px)", color: "#64748b", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.65 }}>
                Launch a fully pre-populated interactive demo store in one click. Real inventory. Real reports. Real double-entry accounting. No setup required.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
                <button
                  style={{ padding: "16px 36px", borderRadius: 12, border: "none", background: "linear-gradient(90deg,#a78bfa,#6366f1)", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 0 60px rgba(167,139,250,0.35)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 70px rgba(167,139,250,0.5)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 0 60px rgba(167,139,250,0.35)"; }}
                >
                  Launch Demo Store →
                </button>
                <button style={{ padding: "16px 28px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#e2e8f0", fontSize: 16, cursor: "pointer" }}>
                  Talk to Sales
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 28, fontSize: 12, color: "#374151", flexWrap: "wrap" }}>
                {["60-second setup","14-day full access","No credit card","Used in 5 countries"].map(t => <span key={t}>{t}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "52px 24px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 52 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#a78bfa,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>V</div>
                <span style={{ fontWeight: 800, fontSize: 16 }}>VenQore</span>
              </div>
              <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, maxWidth: 260, marginBottom: 16 }}>
                The elite POS & ERP platform built on mathematical truth. Every transaction balances. Every report checks.
              </p>
              <div style={{ fontSize: 11, color: "#1e293b" }}>venqore.com</div>
            </div>
            {[
              { h: "Platform", links: ["POS System","Inventory","Accounting","Reports","AI Assistant","Multi-Store"] },
              { h: "Company",  links: ["About","Blog","Careers","Contact","Privacy","Terms"] },
              { h: "Resources",links: ["Documentation","API Reference","Changelog","Status Page","Demo Store"] },
            ].map((col) => (
              <div key={col.h}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4b5563", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 16 }}>{col.h}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ fontSize: 12, color: "#374151", textDecoration: "none" }}
                      onMouseEnter={e => e.target.style.color = "#94a3b8"}
                      onMouseLeave={e => e.target.style.color = "#374151"}
                    >{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#1e293b" }}>© 2026 VenQore. All rights reserved.</span>
            <span style={{ fontSize: 11, color: "#1e293b" }}>V12 Twin Turbo Qore — 635 tests · 3,970 assertions · zero compromises.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
