import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, Banknote,
    BarChart3, Bot, Boxes, Building2, Calculator, Check, CheckCircle2, ChevronDown,
    CreditCard, Cpu, Factory, Fingerprint, Gauge, Globe, Layers, Lock,
    Mail, Menu, MessageCircle, MoreHorizontal, Network, Package, Play, Plus, Quote,
    Receipt, RefreshCw, Repeat, ScanBarcode, ShieldCheck, ShoppingCart, Sparkles,
    TrendingUp, Truck, Users, Wallet, Warehouse, X
} from 'lucide-react';
import axios from 'axios';

/* ═══════════════════════════════════════════════════════════════════════════
   VENQORE — "The Books Are Always Right."
   ──────────────────────────────────────────────────────────────────────────
   Midnight Nebula 2.0 · Cinematic, code-built product experience.
   Motion engine: IntersectionObserver + rAF + CSS — no external animation deps.
   Everything degrades gracefully under prefers-reduced-motion.
   Functionality preserved: usePage() settings, /subscribe newsletter (axios),
   auth links, nav routes, WhatsApp, fonts, Inertia <Link>, Lucide, Tailwind.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Reduced-motion preference ───────────────────────────────────────────── */
function usePrefersReducedMotion() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const on = () => setReduced(mq.matches);
        on();
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);
    return reduced;
}

/* ── Scroll reveal (one-shot) ────────────────────────────────────────────── */
function useReveal(options = {}) {
    const ref = useRef(null);
    const [vis, setVis] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVis(true); obs.unobserve(el); } },
            { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? '0px 0px -60px 0px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return [ref, vis];
}

/* ── "In view" (repeatable) — used to start/stop heavy loops on visibility ── */
function useInView(threshold = 0.2) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold });
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, inView];
}

/* ── Scroll progress (0..1) ──────────────────────────────────────────────── */
function useScrollProgress() {
    const [p, setP] = useState(0);
    useEffect(() => {
        const h = () => {
            const d = document.documentElement;
            const max = d.scrollHeight - d.clientHeight;
            setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        };
        h();
        window.addEventListener('scroll', h, { passive: true });
        window.addEventListener('resize', h);
        return () => { window.removeEventListener('scroll', h); window.removeEventListener('resize', h); };
    }, []);
    return p;
}

/* ── Reveal wrapper ──────────────────────────────────────────────────────── */
const Reveal = ({ children, delay = 0, direction = 'up', className = '', as: Tag = 'div' }) => {
    const [ref, vis] = useReveal();
    const t = {
        up: 'translateY(46px)', down: 'translateY(-34px)',
        left: 'translateX(46px)', right: 'translateX(-46px)',
        scale: 'scale(0.94)', none: 'none',
    };
    return (
        <Tag ref={ref} className={className} style={{
            opacity: vis ? 1 : 0,
            transform: vis ? 'none' : (t[direction] || t.up),
            transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
            willChange: 'opacity, transform',
        }}>
            {children}
        </Tag>
    );
};

/* ── Animated counter (locale-formatted, easing, decimals) ───────────────── */
const fmtNum = (n, decimals = 0, group = true) => {
    const v = decimals > 0 ? Number(n).toFixed(decimals) : String(Math.round(n));
    if (!group) return v;
    const [int, dec] = v.split('.');
    const gi = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return dec ? `${gi}.${dec}` : gi;
};

const AnimCounter = ({ end, decimals = 0, group = false, suffix = '', prefix = '', duration = 1900 }) => {
    const reduced = usePrefersReducedMotion();
    const [val, setVal] = useState(0);
    const [ref, vis] = useReveal({ threshold: 0.4 });
    const ran = useRef(false);
    useEffect(() => {
        if (!vis || ran.current) return;
        ran.current = true;
        if (reduced) { setVal(end); return; }
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 4);
            setVal(eased * end);
            if (p < 1) requestAnimationFrame(tick);
            else setVal(end);
        };
        requestAnimationFrame(tick);
    }, [vis, reduced, end, duration]);
    return <span ref={ref}>{prefix}{fmtNum(val, decimals, group)}{suffix}</span>;
};

/* ── Magnetic button (Inertia Link) ──────────────────────────────────────── */
const MagBtn = ({ children, href, variant = 'primary', className = '', onClick }) => {
    const reduced = usePrefersReducedMotion();
    const r = useRef(null);
    const onMove = useCallback(e => {
        if (reduced) return;
        const b = r.current; if (!b) return;
        const rect = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) * 0.18}px, ${(e.clientY - rect.top - rect.height / 2) * 0.28}px)`;
    }, [reduced]);
    const onLeave = useCallback(() => { if (r.current) r.current.style.transform = ''; }, []);

    const variants = {
        primary: 'px-9 py-4 bg-white text-[#05030f] font-black text-[15px] rounded-full shadow-[0_8px_40px_-8px_rgba(255,255,255,0.35)] hover:shadow-[0_0_70px_-6px_rgba(165,180,252,0.55)]',
        glow: 'px-9 py-4 text-white font-black text-[15px] rounded-full vq-cta-glow',
        ghost: 'px-8 py-4 bg-white/[0.04] border border-white/12 text-white font-bold text-[15px] rounded-full hover:bg-white/[0.08] hover:border-white/25 backdrop-blur-md',
        accent: 'px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-full shadow-xl shadow-indigo-600/25',
    };
    return (
        <Link ref={r} href={href || '/register'} onClick={onClick}
            className={`group/btn relative inline-flex items-center justify-center gap-2.5 transition-[transform,box-shadow,background] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${variants[variant]} ${className}`}>
            {children}
        </Link>
    );
};

/* ── Eyebrow label ───────────────────────────────────────────────────────── */
const Eyebrow = ({ children, icon: Ic, tone = 'indigo' }) => {
    const tones = {
        indigo: 'bg-indigo-500/10 border-indigo-400/20 text-indigo-300',
        cyan: 'bg-cyan-500/10 border-cyan-400/20 text-cyan-300',
        amber: 'bg-amber-500/10 border-amber-400/20 text-amber-300',
        emerald: 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300',
        rose: 'bg-rose-500/10 border-rose-400/20 text-rose-300',
        violet: 'bg-violet-500/10 border-violet-400/20 text-violet-300',
    };
    return (
        <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border ${tones[tone]} text-[10px] font-black tracking-[0.32em] uppercase mb-7 backdrop-blur-sm`}>
            {Ic && <Ic size={13} />}
            {children}
        </div>
    );
};

/* ── Glass surface ───────────────────────────────────────────────────────── */
const Glass = ({ children, className = '', glow = false }) => (
    <div className={`relative rounded-[2rem] border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl ${glow ? 'shadow-[0_30px_120px_-40px_rgba(99,102,241,0.45)]' : ''} ${className}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-t-[2rem]" />
        {children}
    </div>
);

/* ── Scroll progress bar ─────────────────────────────────────────────────── */
const ScrollProgressBar = () => {
    const p = useScrollProgress();
    return (
        <div className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-transparent">
            <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-400 to-cyan-400 origin-left transition-transform duration-150 ease-out"
                style={{ transform: `scaleX(${p})`, width: '100%' }} />
        </div>
    );
};

/* ── Floating particle field (subtle dust; desktop + motion only) ─────────── */
const ParticleField = () => {
    const reduced = usePrefersReducedMotion();
    const canvasRef = useRef(null);
    useEffect(() => {
        if (reduced || window.matchMedia('(pointer: coarse)').matches) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h, raf = 0, particles = [], running = true;
        const COLORS = ['rgba(129,140,248,', 'rgba(167,139,250,', 'rgba(34,211,238,'];
        const resize = () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
            const count = Math.min(64, Math.floor(w / 30));
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * w, y: Math.random() * h,
                r: Math.random() * 1.5 + 0.4,
                vy: -(Math.random() * 0.22 + 0.05),
                vx: (Math.random() - 0.5) * 0.1,
                a: Math.random() * 0.32 + 0.06,
                c: COLORS[(Math.random() * COLORS.length) | 0],
                tw: Math.random() * Math.PI * 2,
            }));
        };
        const draw = () => {
            if (!running) return;
            ctx.clearRect(0, 0, w, h);
            for (const p of particles) {
                p.y += p.vy; p.x += p.vx; p.tw += 0.02;
                if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
                if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
                const a = p.a * (0.55 + 0.45 * Math.sin(p.tw));
                ctx.beginPath();
                ctx.fillStyle = p.c + a.toFixed(3) + ')';
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            }
            raf = requestAnimationFrame(draw);
        };
        const onVis = () => { running = !document.hidden; if (running) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); } };
        resize(); draw();
        window.addEventListener('resize', resize);
        document.addEventListener('visibilitychange', onVis);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVis); };
    }, [reduced]);
    if (reduced) return null;
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 hidden md:block" style={{ opacity: 0.55 }} />;
};

/* ── Ambient background: deep gradient + beams + edge glows + vignette ─────── */
/* No raster images — solid gradient base keeps every component crisp & legible. */
const Ambient = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Deep gradient base (single cohesive color field) */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 95% at 50% -10%, #0c0922 0%, #070518 46%, #040210 100%)' }} />
        {/* Volumetric light beams fanning from the top */}
        <div className="absolute -top-[10%] left-1/2 w-[140vw] h-[85vh] -translate-x-1/2 vq-beams" />
        {/* Edge-confined glows (low opacity, away from content) */}
        <div className="absolute top-[-26%] left-[-16%] w-[52vw] h-[52vw] rounded-full blur-[190px] vq-blob"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 62%)' }} />
        <div className="absolute top-[-22%] right-[-16%] w-[48vw] h-[48vw] rounded-full blur-[190px] vq-blob-2"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12), transparent 62%)' }} />
        <div className="absolute bottom-[-28%] left-[28%] w-[46vw] h-[46vw] rounded-full blur-[210px] vq-blob"
            style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.07), transparent 62%)' }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 vq-grid opacity-[0.35]" />
        {/* Center-darkening vignette → guarantees readable foreground */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(95% 75% at 50% 40%, rgba(4,2,12,0) 0%, rgba(4,2,12,0.5) 100%)' }} />
        <div className="absolute inset-0 vq-grain opacity-[0.3]" />
    </div>
);

/* ── Cursor spotlight (desktop, motion-on only) ──────────────────────────── */
const Spotlight = () => {
    const reduced = usePrefersReducedMotion();
    const ref = useRef(null);
    useEffect(() => {
        if (reduced || window.matchMedia('(pointer: coarse)').matches) return;
        const el = ref.current;
        let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;
        const move = (e) => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(loop); };
        const loop = () => {
            cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
            if (el) el.style.transform = `translate(${cx}px, ${cy}px)`;
            raf = Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5 ? requestAnimationFrame(loop) : 0;
        };
        window.addEventListener('pointermove', move, { passive: true });
        return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
    }, [reduced]);
    if (reduced) return null;
    return (
        <div className="fixed inset-0 pointer-events-none z-[5] hidden md:block">
            <div ref={ref} className="absolute -left-[300px] -top-[300px] w-[600px] h-[600px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.07), transparent 60%)' }} />
        </div>
    );
};

/* ── SVG smooth-path helpers ─────────────────────────────────────────────── */
const _line = (a, b) => ({ len: Math.hypot(b[0] - a[0], b[1] - a[1]), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) });
const _ctrl = (cur, prev, next, rev) => {
    prev = prev || cur; next = next || cur;
    const o = _line(prev, next); const ang = o.ang + (rev ? Math.PI : 0); const len = o.len * 0.16;
    return [cur[0] + Math.cos(ang) * len, cur[1] + Math.sin(ang) * len];
};
const smoothPath = (pts) => pts.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p[0]},${p[1]}`;
    const cs = _ctrl(a[i - 1], a[i - 2], p, false);
    const ce = _ctrl(p, a[i - 1], a[i + 1], true);
    return `${acc} C ${cs[0]},${cs[1]} ${ce[0]},${ce[1]} ${p[0]},${p[1]}`;
}, '');

/* ── Revenue Analytics chart — dual area (Sales + Gross Profit), real colors ── */
const REV_SETS = {
    Today: { s: [140, 132, 150, 128, 142, 120, 130, 110, 124, 104, 116, 92, 102, 84, 92, 70], p: 0.42 },
    Month: { s: [168, 160, 150, 156, 138, 146, 128, 136, 120, 128, 108, 116, 96, 104, 84, 64], p: 0.50 },
    Year:  { s: [176, 158, 164, 146, 150, 132, 138, 120, 128, 106, 114, 92, 100, 78, 70, 52], p: 0.46 },
};
const RevenueChart = ({ height = 210, tab = 'Month', reduced = false }) => {
    const [ref, inView] = useInView(0.3);
    const W = 520, H = 240;
    const set = REV_SETS[tab] || REV_SETS.Month;
    const ptsS = useMemo(() => set.s.map((y, i) => [(i * (W - 16)) / (set.s.length - 1) + 8, y]), [tab]);
    const ptsP = useMemo(() => ptsS.map(([x, y]) => [x, Math.min(232, y + 34 + (1 - set.p) * 30)]), [ptsS]);
    const lineS = useMemo(() => smoothPath(ptsS), [ptsS]);
    const lineP = useMemo(() => smoothPath(ptsP), [ptsP]);
    const areaS = `${lineS} L ${ptsS[ptsS.length - 1][0]},${H} L ${ptsS[0][0]},${H} Z`;
    const areaP = `${lineP} L ${ptsP[ptsP.length - 1][0]},${H} L ${ptsP[0][0]},${H} Z`;
    const last = ptsS[ptsS.length - 1];
    const drawn = reduced || inView;
    return (
        <div ref={ref} className="relative w-full">
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" className="overflow-visible">
                <defs>
                    <linearGradient id="vqSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity="0.34" />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="vqProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity="0.40" />
                        <stop offset="95%" stopColor="#10b981" stopOpacity="0.04" />
                    </linearGradient>
                </defs>
                {[60, 120, 180].map(y => (
                    <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" strokeWidth="1" />
                ))}
                <path key={`pa-${tab}`} d={areaP} fill="url(#vqProfit)" style={{ opacity: drawn ? 1 : 0, transition: 'opacity 1s ease 0.5s' }} />
                <path key={`sa-${tab}`} d={areaS} fill="url(#vqSales)" style={{ opacity: drawn ? 1 : 0, transition: 'opacity 1s ease 0.6s' }} />
                <path key={`pl-${tab}`} d={lineP} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" pathLength="1"
                    style={{ strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: reduced ? 'none' : 'stroke-dashoffset 1.7s cubic-bezier(0.65,0,0.35,1) 0.15s' }} />
                <path key={`sl-${tab}`} d={lineS} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" pathLength="1"
                    style={{ strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: reduced ? 'none' : 'stroke-dashoffset 1.7s cubic-bezier(0.65,0,0.35,1)', filter: 'drop-shadow(0 6px 16px rgba(99,102,241,0.45))' }} />
                <g style={{ opacity: drawn ? 1 : 0, transition: 'opacity 0.6s ease 1.5s' }}>
                    <circle cx={last[0]} cy={last[1]} r="9" fill="rgba(99,102,241,0.2)" className={reduced ? '' : 'vq-ping'} />
                    <circle cx={last[0]} cy={last[1]} r="4" fill="#818cf8" />
                </g>
            </svg>
        </div>
    );
};

/* ── Live activity feed (mirrors the real dashboard RightPanel "Activity") ── */
const ACTIVITY_POOL = [
    { type: 'Sale', ref: 'INV-2041', amt: '+ 1,250', dir: 'in', tone: 'blue' },
    { type: 'Purchase', ref: 'GRN-118', amt: '- 3,400', dir: 'out', tone: 'amber' },
    { type: 'Payment In', ref: 'RCP-330', amt: '+ 5,000', dir: 'in', tone: 'emerald' },
    { type: 'Expense', ref: 'Utilities', amt: '- 145', dir: 'out', tone: 'red' },
    { type: 'Return', ref: 'CRN-07', amt: '- 220', dir: 'out', tone: 'rose' },
    { type: 'Sale', ref: 'INV-2042', amt: '+ 860', dir: 'in', tone: 'blue' },
    { type: 'Transfer', ref: 'WT-12', amt: '980', dir: 'move', tone: 'orange' },
];
const ACT_TONE = {
    blue: 'bg-blue-500/20 text-blue-300', amber: 'bg-amber-500/20 text-amber-300',
    emerald: 'bg-emerald-500/20 text-emerald-300', red: 'bg-red-500/20 text-red-300',
    rose: 'bg-rose-500/20 text-rose-300', orange: 'bg-orange-500/20 text-orange-300',
};
const TIMES = ['just now', '2m ago', '6m ago', '11m ago', '18m ago', '25m ago'];
const ActivityRow = ({ a, fresh, t }) => (
    <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors ${fresh ? 'vq-row-in' : ''}`}>
        <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${ACT_TONE[a.tone]}`}>
                {a.dir === 'in' ? <ArrowDownRight size={12} /> : a.dir === 'move' ? <RefreshCw size={12} /> : <ArrowUpRight size={12} />}
            </div>
            <div className="leading-tight min-w-0">
                <div className="text-[11px] font-semibold text-white/90 truncate">{a.type} <span className="text-slate-500 font-mono">· {a.ref}</span></div>
                <div className="text-[9px] text-slate-500">{t}</div>
            </div>
        </div>
        <span className={`text-[11px] font-bold tabular-nums shrink-0 ${a.dir === 'in' ? 'text-emerald-400' : a.dir === 'move' ? 'text-orange-300' : 'text-slate-300'}`}>{a.amt}</span>
    </div>
);
const ActivityFeed = () => {
    const reduced = usePrefersReducedMotion();
    const [ref, inView] = useInView(0.25);
    const [rows, setRows] = useState(() => [0, 1, 2, 3, 4].map(i => ({ ...ACTIVITY_POOL[i], k: i })));
    const ptr = useRef(5); const idk = useRef(100);
    useEffect(() => {
        if (reduced || !inView) return;
        const tm = setInterval(() => {
            const a = { ...ACTIVITY_POOL[ptr.current % ACTIVITY_POOL.length], k: idk.current++ };
            ptr.current++;
            setRows(prev => [a, ...prev].slice(0, 5));
        }, 2400);
        return () => clearInterval(tm);
    }, [reduced, inView]);
    return (
        <div ref={ref} className="space-y-0.5">
            {rows.map((a, i) => <ActivityRow key={a.k} a={a} fresh={i === 0 && !reduced} t={TIMES[i]} />)}
        </div>
    );
};

/* ── Hero command center (glass window + tilt + parallax chips) ───────────── */
const railIcons = [Gauge, ShoppingCart, Boxes, Users, BarChart3, Wallet, Cpu];
const HeroDashboard = () => {
    const reduced = usePrefersReducedMotion();
    const wrapRef = useRef(null);
    const cardRef = useRef(null);
    const chipRefs = useRef([]);
    const [revTab, setRevTab] = useState('Month');
    useEffect(() => {
        if (reduced) return;
        const t = setInterval(() => setRevTab(p => (p === 'Today' ? 'Month' : p === 'Month' ? 'Year' : 'Today')), 4200);
        return () => clearInterval(t);
    }, [reduced]);
    const onMove = useCallback((e) => {
        if (reduced || !wrapRef.current) return;
        const r = wrapRef.current.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5;
        const dy = (e.clientY - r.top) / r.height - 0.5;
        if (cardRef.current) cardRef.current.style.transform =
            `perspective(1600px) rotateY(${dx * 7}deg) rotateX(${-dy * 7}deg) translateZ(0)`;
        chipRefs.current.forEach((c, i) => {
            if (!c) return;
            const depth = (i % 3 + 1) * 10;
            c.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
        });
    }, [reduced]);
    const onLeave = useCallback(() => {
        if (cardRef.current) cardRef.current.style.transform = 'perspective(1600px) rotateY(0) rotateX(0)';
        chipRefs.current.forEach(c => { if (c) c.style.transform = ''; });
    }, []);
    const setChip = (i) => (el) => { chipRefs.current[i] = el; };

    return (
        <div ref={wrapRef} onMouseMove={onMove} onMouseLeave={onLeave} className="relative mx-auto w-full max-w-5xl">
            {/* Floating chips */}
            <div ref={setChip(0)} className="hidden md:flex absolute -left-6 top-16 z-20 items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-xl shadow-2xl vq-float">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-200">Balanced to the cent</span>
            </div>
            <div ref={setChip(1)} className="hidden md:flex absolute -right-4 top-32 z-20 items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 backdrop-blur-xl shadow-2xl vq-float-2">
                <ScanBarcode size={16} className="text-indigo-300" />
                <span className="text-[11px] font-bold text-indigo-100">Scan → Journal · 1.2s</span>
            </div>
            <div ref={setChip(2)} className="hidden lg:flex absolute -left-10 bottom-24 z-20 items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-xl shadow-2xl vq-float-3">
                <Layers size={16} className="text-cyan-300" />
                <span className="text-[11px] font-bold text-cyan-100">FIFO COGS per batch</span>
            </div>
            <div ref={setChip(3)} className="hidden md:flex absolute -right-8 bottom-16 z-20 items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 backdrop-blur-xl shadow-2xl vq-float">
                <TrendingUp size={16} className="text-amber-300" />
                <span className="text-[11px] font-bold text-amber-100">+18.4% MoM</span>
            </div>

            {/* Glass window */}
            <div ref={cardRef} className="relative z-10 rounded-[1.75rem] border border-white/[0.08] bg-[#0a0820]/70 backdrop-blur-2xl shadow-[0_50px_160px_-50px_rgba(99,102,241,0.6)] overflow-hidden transition-transform duration-300 ease-out">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                {/* window bar */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-rose-400/70" />
                        <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                        <span className="w-3 h-3 rounded-full bg-emerald-400/70" />
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
                        <Lock size={10} className="text-slate-500" />
                        <span className="text-[10px] font-mono text-slate-400">app.venqore.com/dashboard</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 vq-blink" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Live Sync</span>
                    </div>
                </div>
                {/* body */}
                <div className="flex">
                    {/* rail */}
                    <div className="hidden sm:flex flex-col items-center gap-4 py-5 px-3 border-r border-white/[0.06] bg-white/[0.015]">
                        {railIcons.map((Ic, i) => (
                            <div key={i} className={`w-9 h-9 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-600'}`}>
                                <Ic size={16} />
                            </div>
                        ))}
                    </div>
                    {/* main */}
                    <div className="flex-1 p-4 sm:p-5 min-w-0">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">VenQore</div>
                                <div className="text-lg font-black text-white tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Dashboard</div>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-400/20">
                                <Sparkles size={12} className="text-violet-300" />
                                <span className="text-[10px] font-bold text-violet-200">AI Insight</span>
                            </div>
                        </div>

                        {/* KPI row — real dashboard cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                            {/* Performance */}
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300"><TrendingUp size={14} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Performance</span>
                                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold text-slate-500">Month <ChevronDown size={10} /></span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 relative">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.06]" />
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 tracking-wider">Sales</div>
                                        <div className="text-sm font-black text-white tabular-nums">$<AnimCounter end={1245670} group duration={2200} /></div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 tracking-wider">Gross Profit</div>
                                        <div className="text-sm font-black text-emerald-400 tabular-nums">$<AnimCounter end={772315} group duration={2400} /></div>
                                    </div>
                                </div>
                            </div>
                            {/* Outstanding */}
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-300"><CreditCard size={14} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Outstanding</span>
                                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold text-slate-500">Month <ChevronDown size={10} /></span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 relative">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.06]" />
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 tracking-wider">To Receive</div>
                                        <div className="text-sm font-black text-white tabular-nums">$<AnimCounter end={84200} group duration={2200} /></div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 tracking-wider">To Pay</div>
                                        <div className="text-sm font-black text-white tabular-nums">$<AnimCounter end={51940} group duration={2400} /></div>
                                    </div>
                                </div>
                            </div>
                            {/* Net Profit */}
                            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 relative overflow-hidden">
                                <div className="absolute -right-3 -top-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl" />
                                <div className="flex items-center gap-2 mb-2.5 relative">
                                    <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300"><Wallet size={14} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">Net Profit</span>
                                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold text-slate-500">Month <ChevronDown size={10} /></span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 relative">
                                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/[0.06]" />
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 tracking-wider">Status</div>
                                        <div className="text-sm font-black text-emerald-400">Healthy</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-[9px] uppercase font-bold text-slate-500 mb-0.5 tracking-wider">Net</div>
                                        <div className="text-sm font-black text-white tabular-nums">$<AnimCounter end={184920} group duration={2400} /></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Revenue Analytics + Right panel */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                            <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3.5">
                                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300"><TrendingUp size={14} /></div>
                                        <span className="text-[13px] font-bold text-white">Revenue Analytics</span>
                                    </div>
                                    <div className="flex bg-white/[0.04] p-0.5 rounded-lg">
                                        {['Today', 'Month', 'Year'].map(t => (
                                            <button key={t} onClick={() => setRevTab(t)} className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md transition-all ${revTab === t ? 'bg-white/10 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}>{t}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 mb-1">
                                    <span className="flex items-center gap-1.5 text-[11px]"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="font-semibold text-slate-400">Sales</span></span>
                                    <span className="flex items-center gap-1.5 text-[11px]"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="font-semibold text-slate-400">Gross Profit</span></span>
                                </div>
                                <RevenueChart height={168} tab={revTab} reduced={reduced} />
                            </div>

                            <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-[#0b0a1c] p-3.5 relative overflow-hidden">
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
                                <div className="relative flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Wallet size={15} className="text-white" /></div>
                                        <div>
                                            <div className="text-[9px] text-slate-400 font-medium">Total Balance</div>
                                            <div className="text-sm font-black text-white tabular-nums">$<AnimCounter end={328400} group duration={2400} /></div>
                                        </div>
                                    </div>
                                    <MoreHorizontal size={16} className="text-slate-500" />
                                </div>
                                <div className="relative grid grid-cols-3 gap-1.5 mb-3">
                                    <div className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300"><ArrowDownRight size={14} /><span className="text-[8px] font-black tracking-wider">SALE</span></div>
                                    <div className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-orange-500/10 border border-orange-500/40 text-orange-300"><ArrowUpRight size={14} /><span className="text-[8px] font-black tracking-wider">PURCHASE</span></div>
                                    <div className="flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/40 text-indigo-300"><Plus size={14} /><span className="text-[8px] font-black tracking-wider">ACTIONS</span></div>
                                </div>
                                <div className="relative grid grid-cols-2 gap-1.5 mb-3">
                                    <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5">
                                        <div className="flex items-center gap-1.5 mb-1"><Wallet size={12} className="text-emerald-300" /><span className="text-[9px] font-bold text-slate-300">Cash</span></div>
                                        <div className="text-[12px] font-black text-white tabular-nums">$<AnimCounter end={142300} group duration={2200} /></div>
                                    </div>
                                    <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-2.5">
                                        <div className="flex items-center gap-1.5 mb-1"><Package size={12} className="text-indigo-300" /><span className="text-[9px] font-bold text-slate-300">Stock Value</span></div>
                                        <div className="text-[12px] font-black text-white tabular-nums">$<AnimCounter end={486100} group duration={2400} /></div>
                                    </div>
                                </div>
                                <div className="relative rounded-xl bg-black/30 border border-white/5 p-2.5">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Activity</span>
                                        <span className="flex items-center gap-2 text-[8px] text-slate-500">
                                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />Sale</span>
                                            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Buy</span>
                                        </span>
                                    </div>
                                    <ActivityFeed />
                                </div>
                            </div>
                        </div>

                        {/* Bottom tables (lg+) */}
                        <div className="hidden lg:grid grid-cols-5 gap-3 mt-3">
                            <div className="col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3.5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
                                    <span className="text-[13px] font-bold text-white">Top Products</span>
                                </div>
                                <div className="space-y-1">
                                    {[['🥤', 'Cola 500ml', 'Beverages', '312', '$1,840'], ['🍫', 'Dark Choco', 'Snacks', '268', '$1,210'], ['🧴', 'Hand Wash', 'Care', '190', '$980']].map((r, i) => (
                                        <div key={i} className="flex items-center justify-between py-1.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm">{r[0]}</div>
                                                <div className="min-w-0"><div className="text-[12px] font-bold text-slate-200 truncate">{r[1]}</div><div className="text-[9px] text-slate-500">{r[2]}</div></div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-[10px] font-semibold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">{r[3]}</span>
                                                <span className="text-[12px] font-bold text-emerald-400 tabular-nums w-14 text-right">{r[4]}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-3.5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-1.5 h-4 rounded-full bg-red-500" />
                                    <span className="text-[13px] font-bold text-white">Low Stock Alerts</span>
                                </div>
                                <div className="space-y-2">
                                    {[['SKU-492 · Alpha 12', '5', '20'], ['SKU-781 · Beta 4', '8', '25']].map((r, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-red-500/[0.06] border border-red-500/15">
                                            <div className="min-w-0"><div className="text-[11px] font-bold text-slate-200 truncate">{r[0]}</div><div className="text-[9px] text-red-400 font-bold">Stock: {r[1]} / {r[2]}</div></div>
                                            <span className="text-[9px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded-lg">Order</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Scan → Journal mechanic (the core differentiator, animated) ─────────── */
const ScanToJournal = () => {
    const reduced = usePrefersReducedMotion();
    const [ref, inView] = useInView(0.4);
    const [stage, setStage] = useState(reduced ? 3 : 0);
    useEffect(() => {
        if (reduced || !inView) return;
        const t = setInterval(() => setStage(s => (s + 1) % 4), 1400);
        return () => clearInterval(t);
    }, [reduced, inView]);
    const active = (s) => stage >= s;
    return (
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 lg:gap-10 items-center">
            {/* Scan side */}
            <div className="flex flex-col items-center gap-4">
                <div className={`relative w-40 h-28 rounded-2xl border flex items-center justify-center transition-all duration-500 ${active(0) ? 'border-indigo-400/40 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02]'}`}>
                    <svg viewBox="0 0 120 60" className="w-28 h-14">
                        {[4, 10, 13, 20, 26, 30, 38, 44, 48, 56, 62, 66, 74, 80, 86, 94, 100, 106, 112].map((x, i) => (
                            <rect key={i} x={x} y="8" width={i % 3 === 0 ? 3.5 : 1.8} height="44"
                                fill={active(0) ? '#c7d2fe' : '#475569'} className="transition-colors duration-500" />
                        ))}
                    </svg>
                    {!reduced && active(0) && <div className="absolute left-2 right-2 h-0.5 bg-rose-400 shadow-[0_0_12px_2px_rgba(251,113,133,0.8)] vq-scanline" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Barcode Scan</span>
            </div>
            {/* Flow → ledger */}
            <div className="relative">
                <div className="hidden lg:flex absolute -left-8 top-1/2 -translate-y-1/2 text-slate-600">
                    <ArrowRight size={22} className={`transition-all duration-500 ${active(1) ? 'text-indigo-400 translate-x-1' : ''}`} />
                </div>
                <Glass className={`p-5 transition-all duration-700 ${active(2) ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-2'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Journal Entry · Auto-posted</span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-500 ${active(3) ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-600'}`}>
                            <CheckCircle2 size={11} /> {active(3) ? 'Balanced' : 'Posting…'}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 font-mono text-sm">
                        <div className="space-y-2">
                            <div className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Debit</div>
                            <div className="flex justify-between text-slate-200"><span>Cash</span><span className="tabular-nums">1,250.00</span></div>
                            <div className="flex justify-between text-slate-200"><span>COGS</span><span className="tabular-nums">742.50</span></div>
                        </div>
                        <div className="space-y-2">
                            <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Credit</div>
                            <div className="flex justify-between text-slate-200"><span>Revenue + VAT</span><span className="tabular-nums">1,250.00</span></div>
                            <div className="flex justify-between text-slate-200"><span>Inventory (FIFO)</span><span className="tabular-nums">742.50</span></div>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-wider">Σ Debits = Σ Credits</span>
                        <span className="font-mono text-emerald-300 tabular-nums">1,992.50 = 1,992.50</span>
                    </div>
                </Glass>
            </div>
        </div>
    );
};

/* ── 5-layer financial integrity pipeline ────────────────────────────────── */
const INTEGRITY = [
    { t: 'Journal Integrity', d: 'One controlled gateway. Direct DB tampering blocked at the system level.' },
    { t: 'Live Balances', d: 'Computed from raw entries — never cached numbers that drift out of sync.' },
    { t: 'Unified Engine', d: 'Dashboard, P&L and balance sheet read one source. They always agree.' },
    { t: 'Scenario Testing', d: '13 end-to-end real-world flows verified automatically on every release.' },
    { t: 'Statement Alignment', d: 'Summary figures reconciled to the general ledger, down to the cent.' },
];
const IntegrityPipeline = () => {
    const reduced = usePrefersReducedMotion();
    const [ref, inView] = useInView(0.3);
    return (
        <div ref={ref} className="relative">
            <div className="absolute left-0 right-0 top-7 h-0.5 bg-white/[0.06] hidden md:block">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-400 to-cyan-400 origin-left transition-transform duration-[2200ms] ease-out"
                    style={{ transform: `scaleX(${reduced ? 1 : (inView ? 1 : 0)})` }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-3 relative">
                {INTEGRITY.map((n, i) => (
                    <div key={i} className="relative">
                        <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-0">
                            <div className={`relative z-10 w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 md:mb-5 transition-all duration-700 ${(reduced || inView) ? 'bg-indigo-500/15 border-indigo-400/40 text-indigo-200' : 'bg-white/[0.02] border-white/10 text-slate-600'}`}
                                style={{ transitionDelay: reduced ? '0s' : `${i * 0.28}s` }}>
                                <span className="text-lg font-black" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{i + 1}</span>
                                <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center transition-all duration-500 ${(reduced || inView) ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
                                    style={{ transitionDelay: reduced ? '0s' : `${i * 0.28 + 0.4}s` }}>
                                    <Check size={11} className="text-[#05030f]" strokeWidth={4} />
                                </span>
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1">Layer {i + 1}</div>
                                <h4 className="text-white font-bold text-[15px] tracking-tight mb-1.5" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{n.t}</h4>
                                <p className="text-slate-500 text-[12.5px] leading-relaxed">{n.d}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ── AI Growth Engine — plain-English chat demo ──────────────────────────── */
const AI_QA = [
    {
        q: 'Which customers are about to churn?',
        type: 'bars',
        head: '3 high-value accounts dropped 40%+ in order frequency.',
        rows: [['Khan Traders', 82], ['Bilal Mart', 67], ['Noor Wholesale', 54]],
        unit: '% churn risk',
    },
    {
        q: "What will I run out of next week?",
        type: 'bars',
        head: '5 SKUs breach safety stock by Tuesday — draft POs ready.',
        rows: [['SKU-492 · Alpha 12', 12], ['SKU-781 · Beta 4', 24], ['SKU-118 · Core', 38]],
        unit: 'days of cover',
    },
    {
        q: 'Show me last month’s net profit.',
        type: 'stat',
        head: 'Net profit $184,920 — gross margin 62%, opex $110K.',
        stat: ['$184,920', '+12.6% vs prior month'],
    },
];
const AIChatDemo = () => {
    const reduced = usePrefersReducedMotion();
    const [ref, inView] = useInView(0.3);
    const [idx, setIdx] = useState(0);
    const [phase, setPhase] = useState('answer'); // 'typing' | 'answer'
    useEffect(() => {
        if (reduced || !inView) return;
        let toType, toNext;
        const cycle = () => {
            setPhase('typing');
            toType = setTimeout(() => setPhase('answer'), 1100);
            toNext = setTimeout(() => { setIdx(i => (i + 1) % AI_QA.length); cycle(); }, 4600);
        };
        toNext = setTimeout(cycle, 3200);
        return () => { clearTimeout(toType); clearTimeout(toNext); };
    }, [reduced, inView]);
    const cur = AI_QA[idx];
    return (
        <div ref={ref}>
            <Glass className="p-5 sm:p-6" glow>
                <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-white/[0.06]">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center"><Bot size={16} className="text-violet-300" /></div>
                    <div>
                        <div className="text-sm font-black text-white tracking-tight">VenQore Assistant</div>
                        <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 vq-blink" /> Reading your ledger</div>
                    </div>
                </div>
                {/* user bubble */}
                <div className="flex justify-end mb-4">
                    <div key={`q${idx}`} className="vq-row-in max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-indigo-500/15 border border-indigo-400/20 text-indigo-50 text-sm font-medium">
                        {cur.q}
                    </div>
                </div>
                {/* assistant */}
                <div className="flex justify-start">
                    {phase === 'typing' && !reduced ? (
                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-slate-400 vq-dot" />
                            <span className="w-2 h-2 rounded-full bg-slate-400 vq-dot" style={{ animationDelay: '0.15s' }} />
                            <span className="w-2 h-2 rounded-full bg-slate-400 vq-dot" style={{ animationDelay: '0.3s' }} />
                        </div>
                    ) : (
                        <div key={`a${idx}`} className="vq-row-in max-w-[92%] w-full px-4 py-3.5 rounded-2xl rounded-tl-sm bg-white/[0.04] border border-white/[0.06]">
                            <p className="text-slate-200 text-sm font-medium mb-3">{cur.head}</p>
                            {cur.type === 'bars' && (
                                <div className="space-y-2.5">
                                    {cur.rows.map(([name, val], i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-[11px] mb-1">
                                                <span className="text-slate-400 font-semibold">{name}</span>
                                                <span className="text-slate-500 tabular-nums">{val}{cur.unit.includes('%') ? '%' : 'd'}</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-400 origin-left"
                                                    style={{ transform: `scaleX(${reduced ? 1 : (phase === 'answer' ? Math.min(1, val / 100 + 0.12) : 0)})`, transition: 'transform 1s cubic-bezier(0.22,1,0.36,1)', transitionDelay: `${i * 0.12}s` }} />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 pt-1">{cur.unit}</div>
                                </div>
                            )}
                            {cur.type === 'stat' && (
                                <div className="flex items-end gap-3">
                                    <span className="text-3xl font-black text-white" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{cur.stat[0]}</span>
                                    <span className="text-xs font-bold text-emerald-400 mb-1">{cur.stat[1]}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Glass>
        </div>
    );
};

/* ── 12 core modules (light grid) ────────────────────────────────────────── */
const MODULES = [
    { ic: Truck, n: 'Procurement', d: 'POs, supplier credit & intake' },
    { ic: ShoppingCart, n: 'POS Checkout', d: 'Barcode-fast, keyboard-first' },
    { ic: Receipt, n: 'Invoicing & Billing', d: 'Wholesale, quotes & pre-sales' },
    { ic: Wallet, n: 'Customer Khata', d: 'Balances & payment histories' },
    { ic: Banknote, n: 'Expense Manager', d: 'Overheads & supplier charges' },
    { ic: Warehouse, n: 'Multi-Warehouse', d: 'Transfers across godowns' },
    { ic: Package, n: 'Variant Factory', d: 'Color, size, weight & serial' },
    { ic: Factory, n: 'Manufacturing', d: 'Recipe-based assembly & BOM' },
    { ic: ShieldCheck, n: 'SuperAdmin', d: 'Platform-wide command center' },
    { ic: BarChart3, n: 'Report Factory', d: '40+ reports on demand' },
    { ic: Users, n: 'Workforce & Security', d: 'Logins, shifts & audit logs' },
    { ic: Globe, n: 'E-Commerce Sync', d: 'WooCommerce & marketplaces' },
];
const ModuleCard = ({ m, delay }) => (
    <Reveal delay={delay}>
        <div className="group relative h-full p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-400/25 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
            <div className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(220px circle at var(--mx,50%) var(--my,0%), rgba(129,140,248,0.12), transparent 70%)' }} />
            <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/12 text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    <m.ic size={20} />
                </div>
                <h4 className="text-white font-bold text-[15px] tracking-tight mb-1" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{m.n}</h4>
                <p className="text-slate-500 text-[12.5px] leading-snug">{m.d}</p>
            </div>
        </div>
    </Reveal>
);

/* ── Qore — The Intelligence Core (real modules orbit the engine) ─────────── */
const QORE_MODULES = (() => {
    const defs = [
        ['Dashboard', Gauge], ['Reports', BarChart3], ['Sales', ShoppingCart], ['POS', ScanBarcode],
        ['Purchases', Truck], ['Inventory', Boxes], ['Warehouses', Warehouse], ['Manufacturing', Factory],
        ['CRM', Users], ['Accounting', Calculator], ['AI Assistant', Bot], ['Multi-Store', Network],
    ];
    const cx = 400, cy = 300, Rx = 300, Ry = 232;
    return defs.map(([n, ic], i) => {
        const ang = (-90 + i * (360 / defs.length)) * Math.PI / 180;
        const rf = i % 2 === 0 ? 1 : 0.82;
        const x = cx + Rx * rf * Math.cos(ang);
        const y = cy + Ry * rf * Math.sin(ang);
        return { n, ic, x, y, lx: (x / 800) * 100, ty: (y / 600) * 100 };
    });
})();
const QoreCore = () => {
    const reduced = usePrefersReducedMotion();
    const [ref, inView] = useInView(0.25);
    return (
        <div ref={ref} className="relative w-full max-w-4xl mx-auto aspect-[4/3]">
            <svg viewBox="0 0 800 600" className="absolute inset-0 w-full h-full overflow-visible">
                <defs>
                    <radialGradient id="qcore-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(139,92,246,0.35)" />
                        <stop offset="60%" stopColor="rgba(99,102,241,0.08)" />
                        <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <linearGradient id="qline" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                </defs>
                <circle cx="400" cy="300" r="150" fill="url(#qcore-glow)" />
                {QORE_MODULES.map((m, i) => {
                    const d = `M 400,300 L ${m.x.toFixed(1)},${m.y.toFixed(1)}`;
                    const rev = `M ${m.x.toFixed(1)},${m.y.toFixed(1)} L 400,300`;
                    return (
                        <g key={m.n}>
                            <path d={d} stroke="url(#qline)" strokeWidth="1.3" fill="none" opacity="0.3" />
                            <circle cx={m.x} cy={m.y} r="4" fill="#818cf8" />
                            {!reduced && inView && (
                                <>
                                    <circle r="3.4" fill="#22d3ee" opacity="0.9">
                                        <animateMotion dur={`${2.6 + (i % 5) * 0.45}s`} repeatCount="indefinite" path={i % 2 ? rev : d} />
                                    </circle>
                                    <circle r="2.2" fill="#a78bfa" opacity="0.8">
                                        <animateMotion dur={`${3.6 + (i % 4) * 0.5}s`} begin={`${i * 0.22}s`} repeatCount="indefinite" path={i % 2 ? d : rev} />
                                    </circle>
                                </>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Core orb */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
                    <div className="absolute -inset-6 rounded-full border border-dashed border-white/10" style={reduced ? {} : { animation: 'vq-spin-rev 38s linear infinite' }} />
                    <div className="absolute -inset-2 rounded-full border border-indigo-400/20" style={reduced ? {} : { animation: 'vq-spin-slow 26s linear infinite' }} />
                    <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.75), rgba(99,102,241,0.2) 60%, transparent 72%)' }} />
                    <div className={`absolute inset-3 rounded-full ${reduced ? '' : 'vq-pulse-node'}`} style={{ background: 'radial-gradient(circle at 35% 30%, #c4b5fd, #8b5cf6 45%, #4f46e5 100%)', boxShadow: '0 0 60px rgba(139,92,246,0.55)' }} />
                    <div className="relative z-10 text-center">
                        <div className="text-white font-black tracking-tight text-lg sm:text-2xl" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>QORE</div>
                        <div className="text-[7px] sm:text-[8px] font-black uppercase tracking-[0.3em] text-indigo-200/80">Intelligence Core</div>
                    </div>
                </div>
            </div>

            {/* Module chips */}
            {QORE_MODULES.map((m, i) => (
                <div key={m.n} className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 ${reduced ? '' : 'vq-float'}`}
                    style={{ left: `${m.lx}%`, top: `${m.ty}%`, animationDelay: `${(i % 6) * 0.4}s` }}>
                    <div className="group flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#0c0a20]/85 border border-white/10 backdrop-blur-md shadow-lg hover:border-indigo-400/40 hover:scale-105 transition-all duration-300">
                        <m.ic size={13} className="text-indigo-300 shrink-0" />
                        <span className="hidden sm:inline text-[10px] font-bold text-slate-200 whitespace-nowrap">{m.n}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ── FAQ accordion ───────────────────────────────────────────────────────── */
const FaqItem = ({ q, a, open, onClick }) => (
    <div className="border-b border-white/[0.07]">
        <button onClick={onClick} className="w-full py-6 flex items-center justify-between text-left group gap-6">
            <span className="text-[17px] font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">{q}</span>
            <span className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${open ? 'rotate-180 border-indigo-400/40 bg-indigo-500/10 text-indigo-300' : 'border-white/10 text-slate-600'}`}>
                <ChevronDown size={16} />
            </span>
        </button>
        <div className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? 'max-h-72 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
            <p className="text-slate-400 leading-relaxed text-[15px] max-w-3xl">{a}</p>
        </div>
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
    const { props } = usePage();
    const settings = props.settings || {};
    const appName = settings.app_name || 'VenQore';
    const logo = settings.logo_url || '/images/logo.png';

    const [scrolled, setScrolled] = useState(false);
    const [heroLoaded, setHeroLoaded] = useState(false);
    const [mobileMenu, setMobileMenu] = useState(false);
    const [openFaq, setOpenFaq] = useState(0);

    /* Newsletter — preserved contract */
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterStatus, setNewsletterStatus] = useState('idle');
    const [newsletterMsg, setNewsletterMsg] = useState('');
    const handleNewsletterSubmit = async (e) => {
        e.preventDefault();
        setNewsletterStatus('loading');
        setNewsletterMsg('');
        try {
            await axios.post('/subscribe', { email: newsletterEmail, interest: 'cloud' });
            setNewsletterStatus('success');
            setNewsletterMsg('Awesome! You have successfully subscribed to our newsletter.');
            setNewsletterEmail('');
        } catch (err) {
            setNewsletterStatus('error');
            setNewsletterMsg(err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Subscription failed.');
        }
    };

    useEffect(() => {
        setHeroLoaded(true);
        const h = () => setScrolled(window.scrollY > 40);
        h();
        window.addEventListener('scroll', h, { passive: true });
        return () => window.removeEventListener('scroll', h);
    }, []);

    const navLinks = [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Blog', href: '/blog' },
        { label: 'About', href: '/about' },
    ];

    const marquee = ['Retail', 'Grocery', 'Food & Beverage', 'Fashion', 'Electronics', 'Wholesale', 'Pharmacy', 'Hardware'];

    const aiBrains = [
        { ic: Repeat, t: 'Return Predictor', d: 'Forecasts when each customer is due back — so promos land before they lapse.', tone: 'indigo' },
        { ic: Boxes, t: 'Stock Forecaster', d: 'Projects depletion per SKU and drafts purchase orders before you stock out.', tone: 'cyan' },
        { ic: AlertTriangle, t: 'Churn Detector', d: 'Flags high-value accounts losing momentum while there is still time to act.', tone: 'rose' },
    ];

    const reports = [
        'Profit & Loss', 'Balance Sheet', 'Cash Flow', 'Trial Balance',
        'Aged Receivables', 'Stock Valuation', 'Item-Wise Profit', 'Day Book',
    ];

    const faqs = [
        { q: 'Is VenQore a POS or an accounting system?', a: 'Both — and they are the same system, not two apps synced together. The POS posts double-entry journal entries as it runs; the accounting module reads those exact entries to produce auditor-grade statements. No integration layer to drift.' },
        { q: 'Do I need an accountant to use it?', a: 'No. VenQore handles the double-entry mechanics automatically. Every sale, purchase, return, transfer and adjustment writes the correct balanced entry. Your accountant can verify the output — they just won’t need to create it by hand.' },
        { q: 'How long does setup take?', a: 'The Instant Store Creator needs only your store name, then seeds units, taxes and categories for your industry. Most businesses are live in 10–15 minutes, and full historical data can be imported the same day.' },
        { q: 'Will it work across multiple stores?', a: 'Yes. The Multi-Store Hub switches between branches in one click, and granular roles let you be Owner in one store, Manager in another and read-only Viewer in a third — all from a single account.' },
        { q: 'How accurate is the financial engine, really?', a: 'It runs on a DECIMAL(20,4) double-entry core verified by 665+ automated tests, 4,000+ integrity checks and 13 end-to-end scenarios. Dashboard figures reconcile to the general ledger down to the cent.' },
        { q: 'What happens to my data if I cancel?', a: 'It’s yours. Export it at any time via the import/export tools. We never hold your data hostage.' },
    ];

    return (
        <div className="min-h-screen bg-[#04020c] text-white overflow-x-hidden selection:bg-indigo-500/40 antialiased">
            <Head>
                <title>{`${appName} — The Books Are Always Right.`}</title>
                <meta name="description" content="VenQore is the all-in-one POS & ERP built on a real double-entry engine. Every sale, purchase, return and transfer posts a correct journal entry — automatically. 226+ features, 40+ reports, AI growth engine." />
                <meta name="theme-color" content="#04020c" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <ScrollProgressBar />
            <Ambient />
            <ParticleField />
            <Spotlight />

            {/* ── NAV ─────────────────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#04020c]/80 backdrop-blur-2xl border-b border-white/[0.06] py-3' : 'py-5'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0 shrink">
                        <img src={logo} alt={appName} width="144" height="36" className="h-8 sm:h-9 w-auto shrink-0 group-hover:scale-105 transition-transform duration-300" />
                        <span className="font-black text-white text-base sm:text-lg uppercase tracking-tighter truncate" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{appName}</span>
                    </Link>
                    <div className="hidden lg:flex items-center gap-1">
                        {navLinks.map(l => (
                            <Link key={l.href} href={l.href} className="px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-full transition-all duration-300">
                                {l.label}
                            </Link>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Link href="/login" className="hidden sm:block px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors">Sign In</Link>
                        <Link href="/register" className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-[#05030f] rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] whitespace-nowrap transition-all hover:scale-105 hover:shadow-[0_0_40px_-6px_rgba(255,255,255,0.5)]">
                            Start Free
                        </Link>
                        <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2 -mr-1 text-slate-300 hover:text-white" aria-label="Menu" aria-expanded={mobileMenu}>
                            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
                <div className={`lg:hidden overflow-hidden transition-all duration-500 ${mobileMenu ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 py-5 space-y-1 bg-[#04020c]/95 backdrop-blur-2xl border-t border-white/[0.06]">
                        {navLinks.map(l => (
                            <Link key={l.href} href={l.href} onClick={() => setMobileMenu(false)}
                                className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors">
                                {l.label}
                            </Link>
                        ))}
                        <Link href="/login" onClick={() => setMobileMenu(false)} className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/[0.04]">Sign In</Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">

                {/* ══ 1 · HERO ══ */}
                <section className="relative px-6 pt-32 md:pt-40 pb-20">
                    <div className="max-w-7xl mx-auto text-center">
                        <div className={`transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-[10px] font-black tracking-[0.3em] uppercase mb-10">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 vq-blink" />
                                <span className="text-slate-300">226+ Features · One Source of Truth</span>
                            </div>

                            <h1 className="mb-8 leading-[0.86]" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                <span className="block text-[2.75rem] xs:text-[3.25rem] sm:text-7xl lg:text-[8.5rem] font-black tracking-tighter text-white hero-rise">
                                    The Books Are
                                </span>
                                <span className="block text-[2.75rem] xs:text-[3.25rem] sm:text-7xl lg:text-[8.5rem] font-black tracking-tighter -mt-1 md:-mt-4 hero-rise-d">
                                    <span className="vq-headline-grad vq-text-glow">Always Right.</span>
                                </span>
                            </h1>

                            <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-medium hero-fade">
                                The all-in-one POS &amp; ERP where every sale, purchase and transfer writes a correct, balanced journal entry —{' '}
                                <span className="text-white font-semibold">without an accountant in the room.</span>
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5 hero-fade-2">
                                <MagBtn href="/register" variant="primary">
                                    Start Free Trial <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </MagBtn>
                                <MagBtn href="/demo" variant="ghost">
                                    <Play size={15} fill="currentColor" /> Launch Live Demo
                                </MagBtn>
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-16 hero-fade-2">14-day free trial · No credit card · Live in 15 minutes</p>
                        </div>

                        {/* Living command center */}
                        <div className={`transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] delay-200 ${heroLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
                            <HeroDashboard />
                        </div>

                        {/* Trust marquee */}
                        <div className="mt-20 max-w-5xl mx-auto">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6">Built for real businesses</p>
                            <div className="relative overflow-hidden vq-marquee-mask">
                                <div className="flex gap-10 vq-marquee whitespace-nowrap">
                                    {[...marquee, ...marquee].map((m, i) => (
                                        <span key={i} className="text-lg font-black text-slate-700 uppercase tracking-wider shrink-0" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{m}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══ 2 · THE UNCOMFORTABLE TRUTH ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <Reveal>
                            <Glass className="p-8 md:p-16 overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 text-white/[0.025] pointer-events-none"><Calculator size={240} strokeWidth={0.3} /></div>
                                <div className="relative z-10 max-w-4xl">
                                    <Eyebrow icon={AlertTriangle} tone="rose">The Uncomfortable Truth</Eyebrow>
                                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-8 leading-[0.9]" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                        Most business software<br />
                                        <span className="bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent italic">quietly lies to you.</span>
                                    </h2>
                                    <div className="space-y-5 text-lg md:text-xl text-slate-400 leading-relaxed font-medium max-w-3xl">
                                        <p>Not maliciously — structurally. Your “revenue” includes tax you owe the government. Your profit uses a cost that was silently overwritten three purchases ago. Your inventory value is an approximation no one can trace.</p>
                                        <p className="text-white font-semibold">You’ve been deciding on fabricated numbers. VenQore was built to end that.</p>
                                    </div>
                                    <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
                                        {[
                                            { ic: AlertTriangle, t: 'Tax-as-Revenue', b: 'Most systems inflate the top line by folding VAT/GST into revenue. VenQore separates them at the ledger level.', cls: 'bg-rose-500/[0.05] border-rose-500/15', ico: 'text-rose-400' },
                                            { ic: Calculator, t: 'The FIFO Lie', b: 'Profit from overwritten average costs is permanently wrong. VenQore tracks real cost per batch, per variant.', cls: 'bg-amber-500/[0.05] border-amber-500/15', ico: 'text-amber-400' },
                                            { ic: Fingerprint, t: 'Editable Ledgers', b: 'Edits with no reversal trail aren’t accounting — they’re guessing. Posted entries are immutable by design.', cls: 'bg-indigo-500/[0.05] border-indigo-500/15', ico: 'text-indigo-400' },
                                        ].map((c, i) => (
                                            <Reveal key={i} delay={0.1 + i * 0.1}>
                                                <div className={`h-full p-7 rounded-3xl border ${c.cls} transition-all duration-500 hover:-translate-y-1`}>
                                                    <c.ic className={`${c.ico} mb-5`} size={26} />
                                                    <h3 className="text-white font-bold mb-2.5 tracking-tight text-lg" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{c.t}</h3>
                                                    <p className="text-slate-400 text-sm leading-relaxed">{c.b}</p>
                                                </div>
                                            </Reveal>
                                        ))}
                                    </div>
                                </div>
                            </Glass>
                        </Reveal>
                    </div>
                </section>

                {/* ══ 3 · SCAN → JOURNAL ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-6xl mx-auto">
                        <Reveal>
                            <div className="text-center mb-14">
                                <Eyebrow icon={ScanBarcode}>How it works</Eyebrow>
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                    One scan becomes<br /><span className="text-indigo-400">balanced accounting.</span>
                                </h2>
                                <p className="text-slate-500 text-lg max-w-2xl mx-auto mt-6">No exports. No month-end reconstruction. The instant an item is scanned, a correct double-entry posts — and your statements update live.</p>
                            </div>
                        </Reveal>
                        <Reveal delay={0.12}>
                            <Glass className="p-8 md:p-12"><ScanToJournal /></Glass>
                        </Reveal>
                    </div>
                </section>

                {/* ══ 4 · FINANCIAL INTEGRITY ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <Reveal>
                            <div className="text-center mb-16">
                                <Eyebrow icon={ShieldCheck} tone="emerald">Financial Verification</Eyebrow>
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                    Five layers between you<br />and a wrong number.
                                </h2>
                            </div>
                        </Reveal>
                        <Reveal delay={0.1}><IntegrityPipeline /></Reveal>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto">
                            {[
                                { e: 665, s: '+', l: 'Tests Passed' },
                                { e: 4000, s: '+', l: 'Integrity Checks', g: true },
                                { e: 13, s: '', l: 'E2E Scenarios' },
                                { e: 4, s: '', l: 'Decimal Precision', disp: 'DECIMAL(20,4)' },
                            ].map((s, i) => (
                                <Reveal key={i} delay={0.08 * i}>
                                    <div className="text-center p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                                        <div className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                            {s.disp ? <span className="text-base md:text-lg">{s.disp}</span> : <><AnimCounter end={s.e} group={s.g} />{s.s}</>}
                                        </div>
                                        <div className="text-[10px] text-slate-600 font-black uppercase tracking-[0.18em]">{s.l}</div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ 5 · AI GROWTH ENGINE ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                        <Reveal direction="right">
                            <Eyebrow icon={Cpu} tone="violet">AI Growth Engine</Eyebrow>
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-6" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                Ask your business<br /><span className="text-violet-400">anything.</span>
                            </h2>
                            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
                                A context-aware assistant reads your live ledger and answers in plain English — no spreadsheets, no SQL. Behind it, three models work continuously so you act before problems do.
                            </p>
                            <div className="space-y-3">
                                {aiBrains.map((b, i) => (
                                    <Reveal key={i} delay={0.08 * i} direction="right">
                                        <div className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${b.tone === 'indigo' ? 'bg-indigo-500/15 text-indigo-300' : b.tone === 'cyan' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-rose-500/15 text-rose-300'}`}>
                                                <b.ic size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{b.t}</h3>
                                                <p className="text-slate-400 text-sm leading-snug">{b.d}</p>
                                            </div>
                                        </div>
                                    </Reveal>
                                ))}
                            </div>
                        </Reveal>
                        <Reveal delay={0.15} direction="left"><AIChatDemo /></Reveal>
                    </div>
                </section>

                {/* ══ 6 · CORE MODULES (light) ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <Reveal>
                            <div className="text-center mb-14">
                                <Eyebrow icon={Layers}>One platform, twelve engines</Eyebrow>
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                    Every part of the business,<br /><span className="text-indigo-400">one connected system.</span>
                                </h2>
                                <p className="text-slate-500 text-lg max-w-2xl mx-auto mt-6">From the counter to the godown to the general ledger — twelve modules, no integrations, nothing to sync.</p>
                            </div>
                        </Reveal>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {MODULES.map((m, i) => <ModuleCard key={m.n} m={m} delay={(i % 4) * 0.06} />)}
                        </div>
                        <Reveal delay={0.15}>
                            <div className="text-center mt-12">
                                <MagBtn href="/features" variant="ghost">Explore all 226+ features <ArrowRight size={15} /></MagBtn>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ══ 7 · QORE — THE INTELLIGENCE CORE ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-7xl mx-auto">
                        <Reveal>
                            <div className="text-center mb-12 max-w-3xl mx-auto">
                                <Eyebrow icon={Cpu} tone="violet">Qore — The Intelligence Core</Eyebrow>
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9]" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                    One core.<br /><span className="vq-headline-grad">Every module, in sync.</span>
                                </h2>
                                <p className="text-slate-400 text-lg mt-6">
                                    Qore is the engine at the centre of VenQore — continuously coordinating Sales, Inventory, Accounting, AI and every other module so your whole business runs on one live set of numbers.
                                </p>
                            </div>
                        </Reveal>
                        <Reveal delay={0.12}>
                            <Glass className="p-6 md:p-10 overflow-hidden" glow><QoreCore /></Glass>
                        </Reveal>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto">
                            {[
                                { ic: RefreshCw, t: 'Real-Time Sync', d: 'WebSocket-fast, no reloads' },
                                { ic: Network, t: 'Every Module', d: '12 engines, one system' },
                                { ic: ShieldCheck, t: 'One Source of Truth', d: 'Every number agrees' },
                                { ic: Building2, t: 'Multi-Store', d: 'All branches, one view' },
                            ].map((c, i) => (
                                <Reveal key={i} delay={0.06 * i}>
                                    <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] text-center hover:border-indigo-400/25 hover:bg-white/[0.04] transition-all duration-500">
                                        <c.ic size={20} className="text-indigo-300 mb-2 mx-auto" />
                                        <h3 className="text-white font-bold text-[13px] tracking-tight mb-1">{c.t}</h3>
                                        <p className="text-slate-400 text-[11px] leading-snug">{c.d}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ 8 · REPORTS (light) ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-6xl mx-auto text-center">
                        <Reveal>
                            <Eyebrow icon={BarChart3} tone="amber">Report Factory</Eyebrow>
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-6" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                40+ reports.<br /><span className="text-amber-400">One source of truth.</span>
                            </h2>
                            <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-12">P&amp;L, balance sheet and cash flow don’t come from separate calculators — they read the same verified ledger, so they always agree.</p>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <div className="flex flex-wrap justify-center gap-3">
                                {reports.map((r, i) => (
                                    <span key={r} className="px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.025] text-sm font-bold text-slate-300 hover:border-amber-400/30 hover:text-white transition-colors">
                                        {r}
                                    </span>
                                ))}
                                <span className="px-5 py-2.5 rounded-full border border-amber-400/25 bg-amber-500/10 text-sm font-black text-amber-300">+32 more</span>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ══ 9 · STAT BAND ══ */}
                <section className="py-20 px-6 border-y border-white/[0.06] bg-white/[0.012]">
                    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
                        {[
                            { e: 226, s: '+', l: 'Platform Features' },
                            { e: 40, s: '+', l: 'Business Reports' },
                            { e: 665, s: '+', l: 'Tests Passed' },
                            { e: 5, s: '', l: 'Audit Layers' },
                        ].map((s, i) => (
                            <Reveal key={i} delay={0.07 * i}>
                                <div className="text-center">
                                    <div className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 vq-headline-grad" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                        <AnimCounter end={s.e} />{s.s}
                                    </div>
                                    <div className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase tracking-[0.22em]">{s.l}</div>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* ══ 10 · TESTIMONIALS ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                        <Reveal direction="right">
                            <Eyebrow icon={Users}>Built for operators</Eyebrow>
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 leading-[0.9]" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                Real results.<br /><span className="text-indigo-400">Real operators.</span>
                            </h2>
                            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-md">We built VenQore for the operator who is done guessing. Here’s what changes when the numbers are finally right.</p>
                            <MagBtn href="/about" variant="ghost">Read our story <ArrowRight size={15} /></MagBtn>
                        </Reveal>
                        <div className="space-y-5">
                            {[
                                { t: 'For the first time, my daily revenue matched what my accountant calculated at month-end. We’re not adjusting numbers anymore — they just come out right.', a: 'Electronics Retailer · 3 locations' },
                                { t: 'We process 800+ transactions a day. Keyboard shortcuts and multi-tab checkout mean our cashiers never touch a mouse. Throughput went up 30%.', a: 'Supermarket Operator' },
                            ].map((q, i) => (
                                <Reveal key={i} delay={i * 0.12} direction="left">
                                    <Glass className="p-7">
                                        <Quote size={26} className="text-indigo-400/50 mb-4" />
                                        <p className="text-lg text-slate-200 leading-relaxed mb-5">{q.t}</p>
                                        <div className="flex items-center gap-1 mb-3">{[...Array(5)].map((_, k) => <span key={k} className="text-amber-400">★</span>)}</div>
                                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{q.a}</div>
                                    </Glass>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ 11 · PRICING TEASER ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-5xl mx-auto">
                        <Reveal>
                            <Glass className="p-10 md:p-16 text-center overflow-hidden" glow>
                                <div className="absolute inset-0 vq-grid opacity-30 pointer-events-none" />
                                <div className="relative z-10">
                                    <Eyebrow icon={BadgeCheck} tone="emerald">Risk-free to start</Eyebrow>
                                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] mb-6" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                        Try the whole platform.<br /><span className="text-emerald-400">Free for 14 days.</span>
                                    </h2>
                                    <p className="text-slate-400 text-lg max-w-xl mx-auto mb-9">Full access. No credit card. Launch a pre-populated demo store in one click, or start your own and be live in 15 minutes.</p>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                                        <MagBtn href="/register" variant="primary">Start Free Trial <ArrowRight size={18} /></MagBtn>
                                        <MagBtn href="/pricing" variant="ghost">See pricing</MagBtn>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[12px] font-bold text-slate-500">
                                        {['No credit card', 'Cancel anytime', 'Export your data', 'Free demo store'].map(x => (
                                            <span key={x} className="inline-flex items-center gap-1.5"><Check size={13} className="text-emerald-400" /> {x}</span>
                                        ))}
                                    </div>
                                </div>
                            </Glass>
                        </Reveal>
                    </div>
                </section>

                {/* ══ 12 · FAQ ══ */}
                <section className="py-24 md:py-32 px-6">
                    <div className="max-w-3xl mx-auto">
                        <Reveal>
                            <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-14 tracking-tighter" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                Common <span className="text-indigo-400">questions</span>
                            </h2>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <div>
                                {faqs.map((f, i) => (
                                    <FaqItem key={i} q={f.q} a={f.a} open={openFaq === i} onClick={() => setOpenFaq(openFaq === i ? -1 : i)} />
                                ))}
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ══ 13 · NEWSLETTER (preserved) ══ */}
                <section className="py-24 px-6 border-t border-white/[0.06] relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/[0.06] to-transparent pointer-events-none" />
                    <div className="max-w-4xl mx-auto relative z-10 text-center">
                        <Reveal>
                            <Eyebrow icon={Mail}>Stay updated</Eyebrow>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                Subscribe to <span className="text-indigo-400">VenQore Insights</span>
                            </h2>
                            <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
                                Direct news on system upgrades, cloud accounting releases, and platform enhancements.
                            </p>
                        </Reveal>
                        <Reveal delay={0.1}>
                            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-3">
                                <input
                                    type="email"
                                    required
                                    value={newsletterEmail}
                                    onChange={e => setNewsletterEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] hover:border-white/15 focus:border-indigo-500/50 rounded-xl text-white text-sm outline-none transition-all duration-300"
                                />
                                <button
                                    type="submit"
                                    disabled={newsletterStatus === 'loading'}
                                    className="w-full sm:w-auto h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0 shadow-lg shadow-indigo-600/20"
                                >
                                    {newsletterStatus === 'loading' ? 'Subscribing...' : 'Subscribe'}
                                    <ArrowRight size={14} />
                                </button>
                            </form>
                            {newsletterMsg && (
                                <p className={`text-xs mt-4 font-semibold ${newsletterStatus === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {newsletterMsg}
                                </p>
                            )}
                        </Reveal>
                    </div>
                </section>

                {/* ══ 14 · FINAL CTA ══ */}
                <section className="py-28 md:py-40 px-6 text-center overflow-hidden">
                    <div className="max-w-4xl mx-auto relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
                        <Reveal>
                            <h2 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] relative z-10" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
                                You already suspect<br />your <span className="vq-headline-grad">numbers are wrong.</span>
                            </h2>
                            <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed relative z-10">
                                The only question is whether you fix it this year — or keep guessing. 14-day free trial, full access, no credit card.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                                <MagBtn href="/register" variant="primary">Start Your Free Trial <ArrowRight size={18} /></MagBtn>
                                <MagBtn href="/contact" variant="ghost">Talk to Sales</MagBtn>
                            </div>
                        </Reveal>
                    </div>
                </section>
            </main>

            {/* ══ FOOTER ══ */}
            <footer className="border-t border-white/[0.06] pt-20 pb-12 px-6 relative z-10 bg-[#04020c]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    <div className="md:col-span-5">
                        <Link href="/" className="flex items-center gap-3 mb-7">
                            <img src={logo} alt={appName} width="160" height="40" className="h-10 w-auto" />
                            <span className="font-black text-white text-xl uppercase tracking-tighter" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>{appName}</span>
                        </Link>
                        <p className="text-slate-400 max-w-sm leading-relaxed text-sm">
                            The all-in-one POS &amp; ERP built on financial truth. Every sale, purchase and transfer writes a correct journal entry — automatically.
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Platform</h3>
                        <ul className="space-y-3">
                            {[{ l: 'Features', h: '/features' }, { l: 'Pricing', h: '/pricing' }, { l: 'Blog', h: '/blog' }, { l: 'About', h: '/about' }].map(i => (
                                <li key={i.h}><Link href={i.h} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{i.l}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-2">
                        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Resources</h3>
                        <ul className="space-y-3">
                            {[{ l: 'Contact', h: '/contact' }, { l: 'Live Demo', h: '/demo' }, { l: 'Terms', h: '/terms' }, { l: 'Privacy', h: '/privacy' }].map(i => (
                                <li key={i.h}><Link href={i.h} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">{i.l}</Link></li>
                            ))}
                        </ul>
                    </div>
                    <div className="md:col-span-3">
                        <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Connect</h3>
                        <div className="space-y-3">
                            <a href="https://wa.me/923091999489" className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-600/[0.06] border border-emerald-500/10 text-emerald-400 hover:bg-emerald-600/[0.1] transition-all duration-300">
                                <MessageCircle size={20} />
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest">WhatsApp Sales</div>
                                    <div className="text-[10px] opacity-60">Immediate Response</div>
                                </div>
                            </a>
                            <Link href="/contact" className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-600/[0.06] border border-indigo-500/10 text-indigo-400 hover:bg-indigo-600/[0.1] transition-all duration-300">
                                <Lock size={20} />
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest">Book a Demo</div>
                                    <div className="text-[10px] opacity-60">1-on-1 Walkthrough</div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">© 2026 {appName}. All rights reserved. The Books Are Always Right.</span>
                    <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                        <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>

            {/* ══ STYLES ══ */}
            <style>{VQ_CSS}</style>
        </div>
    );
}

/* ── Global stylesheet (motion + tokens) ─────────────────────────────────── */
const VQ_CSS = `
* { font-family: 'Inter','Figtree',system-ui,sans-serif; }
html { scroll-behavior: smooth; }
.tabular-nums { font-variant-numeric: tabular-nums; }

.vq-headline-grad {
    background: linear-gradient(100deg,#818cf8 0%,#a78bfa 40%,#22d3ee 80%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
    background-size: 200% auto; animation: vq-shimmer 6s linear infinite;
}
@keyframes vq-shimmer { to { background-position: 200% center; } }
.vq-text-glow { filter: drop-shadow(0 0 60px rgba(129,140,248,0.35)); }

@keyframes vq-rise { 0%{transform:translateY(110%);opacity:0;filter:blur(10px);} 100%{transform:translateY(0);opacity:1;filter:blur(0);} }
.hero-rise { display:inline-block; animation: vq-rise 1.1s cubic-bezier(0.22,1,0.36,1) forwards; }
.hero-rise-d { display:inline-block; animation: vq-rise 1.1s cubic-bezier(0.22,1,0.36,1) 0.18s forwards; transform: translateY(110%); }
.hero-fade { opacity:0; animation: vq-fade 1s ease 0.5s forwards; }
.hero-fade-2 { opacity:0; animation: vq-fade 1s ease 0.7s forwards; }
@keyframes vq-fade { to { opacity:1; } }

/* Ambient */
@keyframes vq-blob { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(3%,2%) scale(1.06);} }
.vq-blob { animation: vq-blob 18s ease-in-out infinite; }
.vq-blob-2 { animation: vq-blob 22s ease-in-out infinite 3s; }
.vq-beams {
    background: conic-gradient(from 90deg at 50% 0%,
        transparent 0deg, rgba(129,140,248,0.07) 10deg, transparent 22deg,
        transparent 44deg, rgba(167,139,250,0.06) 56deg, transparent 70deg,
        transparent 104deg, rgba(34,211,238,0.05) 118deg, transparent 134deg);
    filter: blur(22px); transform-origin: 50% 0%;
    animation: vq-beamspin 26s ease-in-out infinite;
}
@keyframes vq-beamspin { 0%,100%{transform:translateX(-50%) rotate(-7deg);} 50%{transform:translateX(-50%) rotate(7deg);} }
.vq-grid { background-image:
    linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),
    linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px);
    background-size: 64px 64px; }
.vq-grain { background-image: url('/images/noise.svg'); background-repeat: repeat; }

/* Floating chips */
@keyframes vq-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }
.vq-float { animation: vq-float 6s ease-in-out infinite; }
.vq-float-2 { animation: vq-float 7s ease-in-out infinite 1s; }
.vq-float-3 { animation: vq-float 8s ease-in-out infinite 0.5s; }

/* Core spins */
@keyframes vq-spin-slow { to { transform: rotate(360deg); } }
@keyframes vq-spin-rev { to { transform: rotate(-360deg); } }

/* Misc motion */
@keyframes vq-blink { 0%,100%{opacity:1;} 50%{opacity:0.25;} }
.vq-blink { animation: vq-blink 1.6s ease-in-out infinite; }
@keyframes vq-ping { 0%{transform:scale(1);opacity:0.8;} 75%,100%{transform:scale(2.4);opacity:0;} }
.vq-ping { transform-origin: center; transform-box: fill-box; animation: vq-ping 1.8s cubic-bezier(0,0,0.2,1) infinite; }
@keyframes vq-scan { 0%{top:8%;} 50%{top:82%;} 100%{top:8%;} }
.vq-scanline { animation: vq-scan 1.6s ease-in-out infinite; }
@keyframes vq-rowin { 0%{opacity:0;transform:translateY(-8px) scale(0.98);} 100%{opacity:1;transform:none;} }
.vq-row-in { animation: vq-rowin 0.5s cubic-bezier(0.22,1,0.36,1); }
@keyframes vq-dot { 0%,60%,100%{transform:translateY(0);opacity:0.4;} 30%{transform:translateY(-5px);opacity:1;} }
.vq-dot { animation: vq-dot 1s ease-in-out infinite; }
@keyframes vq-pulsenode { 0%,100%{opacity:0.9;transform:scale(1);} 50%{opacity:1;transform:scale(1.05);filter:drop-shadow(0 0 18px rgba(167,139,250,0.7));} }
.vq-pulse-node { animation: vq-pulsenode 2.8s ease-in-out infinite; }

.vq-cta-glow { background: linear-gradient(100deg,#6366f1,#8b5cf6,#22d3ee); background-size:200% auto; box-shadow:0 10px 50px -12px rgba(99,102,241,0.6); animation: vq-shimmer 5s linear infinite; }

@keyframes vq-marq { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }
.vq-marquee { animation: vq-marq 30s linear infinite; }
.vq-marquee-mask { -webkit-mask-image: linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent); mask-image: linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent); }

::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { background: #04020c; }
::-webkit-scrollbar-thumb { background: rgba(129,140,248,0.25); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: rgba(129,140,248,0.4); }

@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
    .hero-rise, .hero-rise-d, .hero-fade, .hero-fade-2 { opacity:1 !important; transform:none !important; }
}
`;
