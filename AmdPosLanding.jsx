import { useState, useEffect, useRef } from "react";
import {
  ShoppingCart, Calculator, Boxes, Cpu, Printer,
  ScanBarcode, RefreshCw, Globe, FileText, ShieldCheck,
  Play, CheckCircle2, Star, ArrowRight, Zap, TrendingUp,
  MessageCircle, Menu, X, ChevronRight, BarChart3, Package
} from "lucide-react";

/* ─── Fade-in on scroll hook ─────────────────────────────── */
function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── Section wrapper with fade ──────────────────────────── */
function FadeSection({ children, className = "", delay = 0 }) {
  const [ref, visible] = useFadeIn();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Data ────────────────────────────────────────────────── */
const features = [
  { icon: ShoppingCart, color: "#22d3ee", title: "High-Speed POS", desc: "Keyboard-driven checkout built for high-traffic retail. 25+ shortcuts, 10 simultaneous sale tabs." },
  { icon: Calculator, color: "#a78bfa", title: "Double-Entry Accounting", desc: "Full journal entries, trial balance, P&L, and balance sheet — verified at zero imbalance." },
  { icon: Boxes, color: "#e879f9", title: "Multi-Warehouse", desc: "Track inventory across godowns with full transfer logs and discrepancy audit trails." },
  { icon: Cpu, color: "#60a5fa", title: "AI Growth Engine", desc: "Retention, churn, and stock-outage prediction running daily — not just dashboards." },
  { icon: Printer, color: "#34d399", title: "Thermal Printing", desc: "58mm / 80mm receipt printing in 2 seconds. No dedicated PC needed via VenQore Station shell." },
  { icon: ScanBarcode, color: "#fbbf24", title: "Serial / IMEI Tracking", desc: "Full device lifecycle from purchase to sale to return. Critical for electronics retail." },
  { icon: RefreshCw, color: "#f472b6", title: "Recurring Invoices", desc: "Automated subscription billing — daily, weekly, monthly, or quarterly." },
  { icon: Globe, color: "#22d3ee", title: "WooCommerce Sync", desc: "Bi-directional stock sync with your website every 5 minutes. No manual updates." },
  { icon: BarChart3, color: "#a78bfa", title: "38 Master Reports", desc: "P&L, stock valuation, sale aging, expiry, discount leakage — every report you need." },
  { icon: ShieldCheck, color: "#e879f9", title: "Granular RBAC", desc: "Cashier, manager, owner, and support specialist roles with permission-level control." },
];

const testimonials = [
  {
    initials: "AK", avatarBg: "rgba(139,92,246,0.2)", avatarColor: "#a78bfa",
    name: "Ahmed Khan", biz: "Electronics Shop · Okara",
    review: "Pehle hum manually sab likhte the. Ab VenQore POS se daily closing report ek click mein aati hai. Serial number tracking ne hamari returns bohot kam kar di.",
    source: "Verified on G2", date: "Feb 2026", accent: "#a78bfa"
  },
  {
    initials: "SA", avatarBg: "rgba(34,197,94,0.2)", avatarColor: "#4ade80",
    name: "Sports Arena", biz: "Sports Shop · Okara",
    review: "Installation mein sirf 2 ghante lage. Inventory tracking aur barcode scanning bohot fast hai. Highly recommend karta hoon har retail owner ko.",
    source: "Direct client", date: "Jan 2026", accent: "#4ade80"
  },
  {
    initials: "JM", avatarBg: "rgba(251,191,36,0.2)", avatarColor: "#fbbf24",
    name: "James M.", biz: "Retail Store · United Kingdom",
    review: "Found this on Fiverr. Setup was smooth, developer was responsive, and the accounting features beat everything else at this price point. Will use for my second store.",
    source: "Verified Fiverr buyer", date: "Mar 2026", accent: "#fbbf24"
  },
];

const statsBar = [
  { value: "38", label: "Built-in reports" },
  { value: "25+", label: "Keyboard shortcuts" },
  { value: "0.00", label: "Trial balance error" },
  { value: "5 min", label: "WooCommerce sync" },
];

/* ─── Main Component ──────────────────────────────────────── */
export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
  }, []);

  return (
    <div
      className="min-h-screen text-slate-200 font-sans overflow-x-hidden relative"
      style={{ background: "#04000d", fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900&family=Space+Grotesk:wght@700;900&display=swap');
        .hero-font { font-family: 'Space Grotesk', sans-serif; }
        .grad-text { background: linear-gradient(135deg, #22d3ee 0%, #818cf8 50%, #e879f9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .shimmer::after { content:''; position:absolute; inset:0; background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.04) 50%,transparent 100%); animation: shimmer 3s infinite; }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .card-hover { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
        .card-hover:hover { transform: translateY(-4px); }
        .pulse-ring { animation: pulse-ring 2.5s ease-out infinite; }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.7} 70%{transform:scale(1.5);opacity:0} 100%{transform:scale(1.5);opacity:0} }
        .float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#04000d} ::-webkit-scrollbar-thumb{background:#2d1f5e;border-radius:3px}
        .mobile-cta { display: none; }
        @media(max-width:640px){ .mobile-cta{display:flex;position:fixed;bottom:0;left:0;right:0;z-index:40;padding:12px 16px 20px;background:linear-gradient(0deg,#04000d 60%,transparent);} }
      `}</style>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute", top:"-15%", left:"-10%", width:"55%", height:"55%", background:"radial-gradient(ellipse,rgba(109,40,217,0.18) 0%,transparent 70%)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-10%", width:"50%", height:"50%", background:"radial-gradient(ellipse,rgba(6,182,212,0.12) 0%,transparent 70%)" }} />
        <div style={{ position:"absolute", top:"45%", left:"55%", width:"40%", height:"40%", background:"radial-gradient(ellipse,rgba(236,72,153,0.08) 0%,transparent 70%)" }} />
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" style={{opacity:0.025}}>
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ── Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(4,0,13,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
          padding: scrolled ? "14px 0" : "22px 0",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#7c3aed,#06b6d4)", padding:1 }}>
              <div style={{ width:"100%", height:"100%", borderRadius:9, background:"#04000d", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Boxes style={{ width:18, height:18, color:"white" }} />
              </div>
            </div>
            <span style={{ fontSize:20, fontWeight:800, color:"white", fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"-0.5px" }}>VenQore POS</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8" style={{ fontSize:14, fontWeight:500, color:"#94a3b8" }}>
            {["Features","Demo","Reviews","Pricing"].map(n => (
              <a key={n} href={`#${n.toLowerCase()}`}
                style={{ transition:"color 0.2s" }}
                onMouseEnter={e => e.target.style.color="#22d3ee"}
                onMouseLeave={e => e.target.style.color="#94a3b8"}>
                {n}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/demo/start"
              style={{ padding:"8px 16px", borderRadius:8, border:"1px solid rgba(255,255,255,0.12)", fontSize:13, fontWeight:600, color:"white", cursor:"pointer", background:"rgba(255,255,255,0.05)", textDecoration:"none", transition:"background 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.1)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}>
              Live Demo
            </a>
            <a href="#pricing"
              style={{ padding:"8px 20px", borderRadius:8, background:"linear-gradient(135deg,#7c3aed,#0891b2)", fontSize:13, fontWeight:700, color:"white", cursor:"pointer", textDecoration:"none", boxShadow:"0 0 20px -4px rgba(124,58,237,0.5)", transition:"opacity 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
              onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
              Buy Now →
            </a>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background:"none", border:"none", color:"white", cursor:"pointer" }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div style={{ background:"rgba(4,0,13,0.97)", borderTop:"1px solid rgba(255,255,255,0.06)", padding:"20px 24px 28px" }}>
            {["Features","Demo","Reviews","Pricing"].map(n => (
              <a key={n} href={`#${n.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)}
                style={{ display:"block", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", color:"#cbd5e1", fontSize:16, fontWeight:500, textDecoration:"none" }}>
                {n}
              </a>
            ))}
          </div>
        )}
      </nav>

      <main className="relative z-10">

        {/* ── Hero ── */}
        <section style={{ padding:"160px 24px 80px", maxWidth:1200, margin:"0 auto", textAlign:"center" }}>
          {/* Badge */}
          <div style={{
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s ease", display:"inline-flex", alignItems:"center", gap:8,
            padding:"6px 14px", borderRadius:999, background:"rgba(124,58,237,0.12)",
            border:"1px solid rgba(124,58,237,0.25)", color:"#a78bfa", fontSize:12, fontWeight:700,
            letterSpacing:"0.04em", marginBottom:32, textTransform:"uppercase"
          }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#22d3ee", display:"inline-block", animation:"pulse-ring 2.5s infinite" }} />
            V3.0 · Verified double-entry engine · Now live
          </div>

          {/* Headline */}
          <h1
            className="hero-font"
            style={{
              opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(24px)",
              transition: "all 0.7s ease 0.1s",
              fontSize: "clamp(38px, 6vw, 76px)", fontWeight:900, lineHeight:1.08,
              color:"white", marginBottom:24, letterSpacing:"-2px"
            }}
          >
            Complete POS + ERP<br/>
            <span className="grad-text">built for Pakistan.</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(20px)",
            transition: "all 0.7s ease 0.2s",
            maxWidth:560, margin:"0 auto 40px", fontSize:18, color:"#94a3b8", lineHeight:1.6
          }}>
            Stop writing manually. One system for sales, inventory, accounting, and daily reports — with a verified double-entry engine trusted by real businesses.
          </p>

          {/* CTA buttons */}
          <div style={{
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(16px)",
            transition: "all 0.7s ease 0.3s",
            display:"flex", flexWrap:"wrap", gap:14, justifyContent:"center", marginBottom:56
          }}>
            <a href="/demo/start"
              style={{ display:"flex", alignItems:"center", gap:8, padding:"14px 28px", borderRadius:12, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"white", fontWeight:700, fontSize:15, textDecoration:"none", cursor:"pointer", transition:"background 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.12)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}>
              <Play size={18} /> Launch Live Demo
            </a>
            <a href="#pricing"
              style={{ display:"flex", alignItems:"center", gap:8, padding:"14px 32px", borderRadius:12, background:"linear-gradient(135deg,#7c3aed 0%,#0891b2 100%)", color:"white", fontWeight:700, fontSize:15, textDecoration:"none", cursor:"pointer", boxShadow:"0 0 40px -8px rgba(124,58,237,0.6)", transition:"opacity 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.opacity="0.9";e.currentTarget.style.boxShadow="0 0 50px -6px rgba(124,58,237,0.8)"}}
              onMouseLeave={e=>{e.currentTarget.style.opacity="1";e.currentTarget.style.boxShadow="0 0 40px -8px rgba(124,58,237,0.6)"}}>
              Buy Now · $249 <ArrowRight size={17} />
            </a>
          </div>

          {/* Stats bar */}
          <div style={{
            opacity: heroVisible ? 1 : 0, transition: "all 0.7s ease 0.4s",
            display:"flex", flexWrap:"wrap", justifyContent:"center", gap:0,
            maxWidth:640, margin:"0 auto 56px",
            border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden",
            background:"rgba(255,255,255,0.03)", backdropFilter:"blur(10px)"
          }}>
            {statsBar.map((s, i) => (
              <div key={i} style={{ flex:"1 1 130px", padding:"18px 12px", textAlign:"center", borderRight: i < statsBar.length-1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                <div className="hero-font" style={{ fontSize:26, fontWeight:900, color:"white", lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:4, fontWeight:500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Video mockup */}
          <div style={{
            opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(32px)",
            transition: "all 0.8s ease 0.5s",
            maxWidth:860, margin:"0 auto", borderRadius:20,
            background:"rgba(10,2,22,0.8)", border:"1px solid rgba(255,255,255,0.08)",
            padding:6, boxShadow:"0 40px 80px -20px rgba(109,40,217,0.3), 0 0 0 1px rgba(255,255,255,0.04)"
          }}>
            {/* Fake browser chrome */}
            <div style={{ padding:"10px 16px", display:"flex", alignItems:"center", gap:8, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              {["#ef4444","#f59e0b","#22c55e"].map((c,i) => <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c, opacity:0.7 }} />)}
              <div style={{ flex:1, height:24, borderRadius:6, background:"rgba(255,255,255,0.05)", marginLeft:8, display:"flex", alignItems:"center", paddingLeft:12 }}>
                <span style={{ fontSize:11, color:"#475569" }}>venqorepos.com/demo</span>
              </div>
            </div>
            <div style={{ aspectRatio:"16/9", background:"#04000d", borderRadius:14, position:"relative", overflow:"hidden" }}>
              <img 
                src="/venqore_dashboard_mockup_1776055918038.png" 
                alt="VenQore Dashboard Mockup" 
                style={{ width:"100%", height:"100%", objectFit:"cover", opacity: 0.8 }}
              />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, transparent 60%, rgba(4,0,13,0.9) 100%)" }} />
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", zIndex:1 }}>
                <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(255,255,255,0.1)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", cursor:"pointer", transition:"transform 0.3s, background 0.3s" }}
                  onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.1)";e.currentTarget.style.background="rgba(255,255,255,0.2)"}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background="rgba(255,255,255,0.1)"}}>
                  <Play style={{ width:28, height:28, color:"white", marginLeft:3 }} />
                </div>
                <p style={{ color:"white", fontSize:14, fontWeight:700, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>Explore the interface →</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" style={{ padding:"80px 24px", maxWidth:1200, margin:"0 auto", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <FadeSection>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <h2 className="hero-font" style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:900, color:"white", marginBottom:12, letterSpacing:"-1px" }}>Everything your shop needs</h2>
              <p style={{ color:"#64748b", fontSize:16, maxWidth:480, margin:"0 auto" }}>10 modules, one system. No stitching together separate apps.</p>
            </div>
          </FadeSection>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(210px, 1fr))", gap:12 }}>
            {features.map((f, i) => (
              <FadeSection key={i} delay={i * 40}>
                <div
                  className="card-hover"
                  style={{
                    background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
                    borderRadius:14, padding:"22px 20px", height:"100%", cursor:"default",
                    position:"relative", overflow:"hidden"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${f.color}40`;
                    e.currentTarget.style.background = `rgba(255,255,255,0.055)`;
                    e.currentTarget.style.boxShadow = `0 8px 32px -8px ${f.color}30`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ width:40, height:40, borderRadius:10, background:`${f.color}15`, border:`1px solid ${f.color}25`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                    <f.icon style={{ width:20, height:20, color:f.color }} />
                  </div>
                  <h3 style={{ fontSize:13, fontWeight:700, color:"white", marginBottom:6 }}>{f.title}</h3>
                  <p style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>{f.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </section>

        {/* ── Live Demo Banner ── */}
        <section id="demo" style={{ padding:"20px 24px 80px", maxWidth:1000, margin:"0 auto" }}>
          <FadeSection>
            <div style={{ position:"relative", borderRadius:20, overflow:"hidden", border:"1px solid rgba(6,182,212,0.2)", background:"linear-gradient(135deg,rgba(6,182,212,0.07) 0%,rgba(124,58,237,0.1) 100%)", padding:"48px 40px" }}>
              {/* Decorative glow */}
              <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200, background:"radial-gradient(ellipse,rgba(6,182,212,0.15),transparent 70%)", pointerEvents:"none" }} />
              <div style={{ position:"relative", zIndex:1, display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:28 }}>
                <div style={{ maxWidth:480 }}>
                  <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:999, background:"rgba(6,182,212,0.1)", border:"1px solid rgba(6,182,212,0.2)", marginBottom:14 }}>
                    <Zap size={12} style={{ color:"#22d3ee" }} />
                    <span style={{ fontSize:11, fontWeight:700, color:"#22d3ee", textTransform:"uppercase", letterSpacing:"0.05em" }}>Live instance running</span>
                  </div>
                  <h2 className="hero-font" style={{ fontSize:28, fontWeight:900, color:"white", marginBottom:10, letterSpacing:"-0.5px" }}>Try before you buy</h2>
                  <p style={{ color:"rgba(207,250,254,0.6)", fontSize:14, lineHeight:1.65 }}>
                    Access a fully working VenQore POS instance on our VPS. Guest login resets automatically every 24 hours. No credit card. No signup.
                  </p>
                </div>
                <a href="/demo/start"
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 28px", borderRadius:12, background:"#06b6d4", color:"#020617", fontWeight:800, fontSize:15, cursor:"pointer", textDecoration:"none", whiteSpace:"nowrap", boxShadow:"0 0 30px -6px rgba(6,182,212,0.5)", transition:"all 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background="#22d3ee";e.currentTarget.style.boxShadow="0 0 40px -4px rgba(6,182,212,0.7)"}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#06b6d4";e.currentTarget.style.boxShadow="0 0 30px -6px rgba(6,182,212,0.5)"}}>
                  Start Live Demo Experience <ArrowRight size={17} />
                </a>
              </div>
            </div>
          </FadeSection>
        </section>

        {/* ── Testimonials ── */}
        <section id="reviews" style={{ padding:"80px 24px", maxWidth:1200, margin:"0 auto", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <FadeSection>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <h2 className="hero-font" style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:900, color:"white", marginBottom:12, letterSpacing:"-1px" }}>Trusted by real businesses</h2>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, color:"#64748b", fontSize:14 }}>
                <span style={{ display:"flex", gap:2 }}>
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" style={{ color:"#f59e0b" }} />)}
                </span>
                Verified reviews from our earliest adopters
              </div>
            </div>
          </FadeSection>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
            {testimonials.map((t, i) => (
              <FadeSection key={i} delay={i * 80}>
                <div
                  className="card-hover"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, padding:"28px 24px", display:"flex", flexDirection:"column", height:"100%", position:"relative", overflow:"hidden" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=`${t.accent}40`;e.currentTarget.style.boxShadow=`0 12px 40px -12px ${t.accent}30`}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.boxShadow="none"}}
                >
                  {/* Top glow */}
                  <div style={{ position:"absolute", top:-40, right:-40, width:120, height:120, background:`radial-gradient(ellipse,${t.accent}12,transparent 70%)`, pointerEvents:"none" }} />

                  {/* Stars */}
                  <div style={{ display:"flex", gap:3, marginBottom:18 }}>
                    {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" style={{ color:"#f59e0b" }} />)}
                  </div>

                  {/* Quote */}
                  <p style={{ color:"#cbd5e1", fontSize:14, lineHeight:1.7, flex:1, marginBottom:24, fontStyle:"italic" }}>
                    "{t.review}"
                  </p>

                  {/* Reviewer */}
                  <div style={{ display:"flex", alignItems:"center", gap:12, paddingTop:18, borderTop:"1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ width:42, height:42, borderRadius:"50%", background:t.avatarBg, border:`1px solid ${t.accent}30`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13, color:t.avatarColor, flexShrink:0 }}>
                      {t.initials}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"white" }}>{t.name}</div>
                      <div style={{ fontSize:11, color:"#64748b" }}>{t.biz}</div>
                    </div>
                    <div style={{ fontSize:10, fontWeight:600, color:"#475569", textTransform:"uppercase", letterSpacing:"0.06em", textAlign:"right", lineHeight:1.4 }}>
                      {t.source}<br/>{t.date}
                    </div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>

          <FadeSection delay={300}>
            <div style={{ marginTop:32, textAlign:"center", fontSize:13, color:"#475569" }}>
              Also verified on:&nbsp;
              <a href="#" style={{ color:"#a78bfa", fontWeight:600, textDecoration:"none", marginRight:8 }}>G2.com</a>
              &amp;
              <a href="#" style={{ color:"#22d3ee", fontWeight:600, textDecoration:"none", marginLeft:8 }}>SoftwareSuggest</a>
            </div>
          </FadeSection>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" style={{ padding:"80px 24px 100px", maxWidth:1100, margin:"0 auto", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <FadeSection>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <h2 className="hero-font" style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:900, color:"white", marginBottom:12, letterSpacing:"-1px" }}>Simple, transparent pricing</h2>
              <p style={{ color:"#64748b", fontSize:15 }}>No hidden fees. Lifetime license. Works on shared hosting.</p>
            </div>
          </FadeSection>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16, alignItems:"center" }}>

            {/* License Only */}
            <FadeSection delay={0}>
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:18, padding:"32px 28px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>License Only</div>
                <div className="hero-font" style={{ fontSize:48, fontWeight:900, color:"white", marginBottom:6, letterSpacing:"-1.5px" }}>$79</div>
                <p style={{ color:"#64748b", fontSize:13, marginBottom:28 }}>For technical users who self-install</p>
                <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:32 }}>
                  {["Lifetime software license","Full source code access","Documentation portal","Community support"].map(item => (
                    <div key={item} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#94a3b8" }}>
                      <CheckCircle2 size={16} style={{ color:"#7c3aed", flexShrink:0 }} />
                      {item}
                    </div>
                  ))}
                </div>
                <button style={{ width:"100%", padding:"13px", borderRadius:10, border:"1px solid rgba(255,255,255,0.15)", background:"transparent", color:"white", fontWeight:700, fontSize:14, cursor:"pointer", transition:"background 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  Get License
                </button>
              </div>
            </FadeSection>

            {/* Full Package — highlighted */}
            <FadeSection delay={100}>
              <div style={{ background:"linear-gradient(160deg,rgba(124,58,237,0.18) 0%,rgba(8,145,178,0.12) 100%)", border:"1px solid rgba(124,58,237,0.4)", borderRadius:20, padding:"36px 28px", position:"relative", transform:"none", boxShadow:"0 0 60px -16px rgba(124,58,237,0.4)" }}>
                {/* Badge */}
                <div style={{ position:"absolute", top:-14, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(90deg,#7c3aed,#0891b2)", color:"white", fontSize:11, fontWeight:800, padding:"5px 16px", borderRadius:999, textTransform:"uppercase", letterSpacing:"0.08em", whiteSpace:"nowrap" }}>
                  Most Popular
                </div>
                <div style={{ fontSize:12, fontWeight:700, color:"#a78bfa", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Full Package</div>
                <div className="hero-font" style={{ fontSize:56, fontWeight:900, color:"white", marginBottom:4, letterSpacing:"-2px" }}>$249</div>
                <p style={{ color:"#94a3b8", fontSize:13, marginBottom:28 }}>Complete done-for-you setup</p>
                <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:32 }}>
                  {[
                    "Lifetime software license",
                    "Full remote installation",
                    "Database + hosting configuration",
                    "2 hours live staff training",
                    "3 months WhatsApp support",
                    "Free minor updates"
                  ].map(item => (
                    <div key={item} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#e2e8f0" }}>
                      <CheckCircle2 size={16} style={{ color:"#22d3ee", flexShrink:0 }} />
                      {item}
                    </div>
                  ))}
                </div>
                <a href="#"
                  style={{ display:"block", width:"100%", padding:"15px", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#0891b2)", color:"white", fontWeight:800, fontSize:15, cursor:"pointer", textAlign:"center", textDecoration:"none", boxShadow:"0 8px 24px -6px rgba(124,58,237,0.5)", transition:"opacity 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.opacity="0.85"}
                  onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                  Buy Full Package
                </a>
              </div>
            </FadeSection>

            {/* Annual Support */}
            <FadeSection delay={200}>
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:18, padding:"32px 28px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12 }}>Annual Support</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:4, marginBottom:4 }}>
                  <span className="hero-font" style={{ fontSize:48, fontWeight:900, color:"white", letterSpacing:"-1.5px" }}>$49</span>
                  <span style={{ color:"#475569", fontSize:16 }}>/yr</span>
                </div>
                <p style={{ color:"#64748b", fontSize:13, marginBottom:28 }}>Add-on to any plan above</p>
                <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:32 }}>
                  {["Priority WhatsApp support","Remote bug fixing","Free minor updates","Feature request priority"].map(item => (
                    <div key={item} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:"#94a3b8" }}>
                      <CheckCircle2 size={16} style={{ color:"#475569", flexShrink:0 }} />
                      {item}
                    </div>
                  ))}
                </div>
                <button style={{ width:"100%", padding:"13px", borderRadius:10, border:"1px solid rgba(255,255,255,0.15)", background:"transparent", color:"white", fontWeight:700, fontSize:14, cursor:"pointer", transition:"background 0.2s" }}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  Add Support Plan
                </button>
              </div>
            </FadeSection>

          </div>

          {/* Trust strip */}
          <FadeSection delay={400}>
            <div style={{ marginTop:40, display:"flex", flexWrap:"wrap", justifyContent:"center", gap:28, color:"#475569", fontSize:13 }}>
              {["Runs on shared hosting","Works offline (VenQore Station)","Vyapar data migration included","Based in Pakistan · WhatsApp support"].map(item => (
                <div key={item} style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <CheckCircle2 size={14} style={{ color:"#22d3ee" }} />
                  {item}
                </div>
              ))}
            </div>
          </FadeSection>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{ position:"relative", zIndex:10, borderTop:"1px solid rgba(255,255,255,0.08)", background:"rgba(0,0,0,0.6)", padding:"48px 24px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"flex-start", gap:32, marginBottom:40 }}>
            {/* Brand */}
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <Boxes size={22} style={{ color:"#7c3aed" }} />
                <span className="hero-font" style={{ fontSize:20, fontWeight:800, color:"white" }}>VenQore POS</span>
              </div>
              <p style={{ color:"#475569", fontSize:13, maxWidth:220, lineHeight:1.6 }}>Complete POS + ERP for Pakistani retail businesses. Built and supported locally.</p>
            </div>

            {/* Links */}
            <div style={{ display:"flex", gap:48, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Product</div>
                {["Features","Pricing","Live Demo","Documentation"].map(l => (
                  <a key={l} href="#" style={{ display:"block", fontSize:13, color:"#64748b", marginBottom:10, textDecoration:"none", transition:"color 0.2s" }}
                    onMouseEnter={e=>e.target.style.color="white"}
                    onMouseLeave={e=>e.target.style.color="#64748b"}>{l}</a>
                ))}
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#334155", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:14 }}>Reviews</div>
                {["G2.com","SoftwareSuggest","Capterra","Fiverr"].map(l => (
                  <a key={l} href="#" style={{ display:"block", fontSize:13, color:"#64748b", marginBottom:10, textDecoration:"none", transition:"color 0.2s" }}
                    onMouseEnter={e=>e.target.style.color="white"}
                    onMouseLeave={e=>e.target.style.color="#64748b"}>{l}</a>
                ))}
              </div>
            </div>

            {/* WhatsApp CTA — critical for Pakistani market */}
            <div style={{ background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.2)", borderRadius:14, padding:"20px 22px", maxWidth:220 }}>
              <MessageCircle size={22} style={{ color:"#25d366", marginBottom:10 }} />
              <div style={{ fontSize:13, fontWeight:700, color:"white", marginBottom:6 }}>Questions? WhatsApp us</div>
              <p style={{ fontSize:12, color:"#64748b", marginBottom:14, lineHeight:1.5 }}>Talk to the developer directly before buying.</p>
              <a href="https://wa.me/92XXXXXXXXXX"
                style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"9px 16px", borderRadius:8, background:"#25d366", color:"black", fontWeight:700, fontSize:13, textDecoration:"none" }}>
                <MessageCircle size={14} /> Chat on WhatsApp
              </a>
            </div>
          </div>

          <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:24, display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"center", gap:12, fontSize:12, color:"#334155" }}>
            <span>© 2026 VenQore. All rights reserved.</span>
            <div style={{ display:"flex", gap:20 }}>
              {["Privacy","Terms","Support"].map(l => (
                <a key={l} href="#" style={{ color:"#334155", textDecoration:"none", transition:"color 0.2s" }}
                  onMouseEnter={e=>e.target.style.color="#94a3b8"}
                  onMouseLeave={e=>e.target.style.color="#334155"}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile sticky CTA ── */}
      <div className="mobile-cta" style={{ flexDirection:"column", gap:8 }}>
        <a href="#pricing"
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"15px", borderRadius:12, background:"linear-gradient(135deg,#7c3aed,#0891b2)", color:"white", fontWeight:800, fontSize:15, textDecoration:"none", boxShadow:"0 0 30px -6px rgba(124,58,237,0.6)" }}>
          Buy Now · $249 <ArrowRight size={17} />
        </a>
        <a href="/demo/start"
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"12px", borderRadius:12, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.05)", color:"white", fontWeight:600, fontSize:14, textDecoration:"none" }}>
          <Play size={15} /> Try live demo now
        </a>
      </div>

    </div>
  );
}
