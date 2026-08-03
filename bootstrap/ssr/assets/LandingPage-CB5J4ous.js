import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { usePage, Link } from "@inertiajs/react";
import { Gauge, BarChart3, ShoppingCart, ScanBarcode, Boxes, Truck, Warehouse, Factory, Calculator, Users, Bot, Network, ArrowRight, Play, AlertTriangle, Repeat, ShieldCheck, Cpu, Layers, Receipt, Wallet, Banknote, Package, Globe, RefreshCw, Building2, Quote, BadgeCheck, Check, Mail, CheckCircle2, TrendingUp, Lock, Sparkles, ChevronDown, CreditCard, MoreHorizontal, ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import axios from "axios";
import { u as useTheme, a as MarketingLayout, v as vq } from "./marketing-pages-CTBAvetE.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const RINGS = [
  // radius (in core radii) · tilt about X · yaw about Y · angular speed (rad/s)
  { r: 2.55, tilt: 0.32, yaw: 0, speed: 0.13 },
  { r: 3.15, tilt: -0.42, yaw: 0.9, speed: -0.098 },
  { r: 3.7, tilt: 0.14, yaw: 1.9, speed: 0.074 }
];
const MODULES$1 = [
  { n: "Dashboard", ic: Gauge, ring: 0, a: 0 },
  { n: "Reports", ic: BarChart3, ring: 0, a: Math.PI / 2 },
  { n: "Sales", ic: ShoppingCart, ring: 0, a: Math.PI },
  { n: "POS", ic: ScanBarcode, ring: 0, a: 3 * Math.PI / 2 },
  { n: "Inventory", ic: Boxes, ring: 1, a: 0.4 },
  { n: "Purchases", ic: Truck, ring: 1, a: 0.4 + Math.PI / 2 },
  { n: "Warehouses", ic: Warehouse, ring: 1, a: 0.4 + Math.PI },
  { n: "Manufacturing", ic: Factory, ring: 1, a: 0.4 + 3 * Math.PI / 2 },
  { n: "Accounting", ic: Calculator, ring: 2, a: 0.85 },
  { n: "CRM", ic: Users, ring: 2, a: 0.85 + Math.PI / 2 },
  { n: "AI Assistant", ic: Bot, ring: 2, a: 0.85 + Math.PI },
  { n: "Multi-Store", ic: Network, ring: 2, a: 0.85 + 3 * Math.PI / 2 }
];
const CAM = 8.2;
const rotX = (p, t) => {
  const c = Math.cos(t), s = Math.sin(t);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
};
const rotY = (p, t) => {
  const c = Math.cos(t), s = Math.sin(t);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
};
const PALETTE = {
  dark: {
    line: [129, 140, 248],
    packet: [34, 211, 238],
    node: [165, 180, 252],
    wire: [199, 210, 254],
    coreIn: "#e9d5ff",
    coreMid: "#a78bfa",
    coreOut: "#5b21b6",
    rim: [196, 181, 253],
    halo: "rgba(139,92,246,",
    dust: [148, 163, 184],
    lineA: 0.42,
    wireA: 0.3,
    dustA: 0.4
  },
  light: {
    line: [79, 70, 229],
    packet: [8, 145, 178],
    node: [79, 70, 229],
    wire: [99, 102, 241],
    coreIn: "#ddd6fe",
    coreMid: "#7c3aed",
    coreOut: "#3730a3",
    rim: [139, 92, 246],
    halo: "rgba(109,74,226,",
    dust: [100, 116, 139],
    lineA: 0.34,
    wireA: 0.26,
    dustA: 0.3
  }
};
function QoreCore3D() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const labelRefs = useRef([]);
  const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(false);
  const { isDarkMode } = useTheme();
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const onPointerMove = useCallback((e) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pointerRef.current.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointerRef.current.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, []);
  const onPointerLeave = useCallback(() => {
    pointerRef.current.tx = 0;
    pointerRef.current.ty = 0;
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const P = isDarkMode ? PALETTE.dark : PALETTE.light;
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    let w = 0, h = 0, dpr = 1, raf = 0, running = true;
    let cx = 0, cy = 0, R = 0;
    const start = performance.now();
    const DUST = Array.from({ length: 70 }, () => {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const rr = 4.5 + Math.random() * 3.5;
      return {
        x: rr * Math.sin(ph) * Math.cos(th),
        y: rr * Math.sin(ph) * Math.sin(th) * 0.65,
        z: rr * Math.cos(ph),
        s: 0.4 + Math.random() * 1.1,
        tw: Math.random() * Math.PI * 2
      };
    });
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2;
      cy = h / 2;
      R = Math.min(w, h) * 0.113;
    };
    const project = (p) => {
      const d = CAM - p.z;
      if (d <= 0.15) return null;
      const k = CAM / d;
      return { x: cx + p.x * R * k, y: cy + p.y * R * k, k, z: p.z };
    };
    const nodeAt = (m, t, sceneX, sceneY) => {
      const ring = RINGS[m.ring];
      const a = m.a + t * ring.speed;
      let p = { x: Math.cos(a) * ring.r, y: 0, z: Math.sin(a) * ring.r };
      p = rotX(p, ring.tilt);
      p = rotY(p, ring.yaw);
      p = rotY(p, sceneY);
      p = rotX(p, sceneX);
      return p;
    };
    const drawCore = (t, sceneX, sceneY) => {
      const LX = -0.42, LY = -0.46;
      const halo = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 4.2);
      halo.addColorStop(0, `${P.halo}0.34)`);
      halo.addColorStop(0.35, `${P.halo}0.11)`);
      halo.addColorStop(1, `${P.halo}0)`);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 4.2, 0, Math.PI * 2);
      ctx.fill();
      const body = ctx.createRadialGradient(
        cx + LX * R * 0.75,
        cy + LY * R * 0.75,
        R * 0.06,
        cx,
        cy,
        R * 1.02
      );
      body.addColorStop(0, P.coreIn);
      body.addColorStop(0.42, P.coreMid);
      body.addColorStop(1, P.coreOut);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.995, 0, Math.PI * 2);
      ctx.clip();
      const spin = t * 0.16;
      const SEG = 54;
      for (let m = 0; m < 8; m++) {
        const lon = m / 8 * Math.PI * 2 + spin;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= SEG; i++) {
          const lat = -Math.PI / 2 + i / SEG * Math.PI;
          let p = {
            x: Math.cos(lat) * Math.cos(lon),
            y: Math.sin(lat),
            z: Math.cos(lat) * Math.sin(lon)
          };
          p = rotY(p, sceneY);
          p = rotX(p, sceneX + 0.28);
          const s = project(p);
          if (!s) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(s.x, s.y);
            started = true;
          } else ctx.lineTo(s.x, s.y);
        }
        ctx.strokeStyle = rgba(P.wire, P.wireA * 0.5);
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      for (let m = 1; m < 6; m++) {
        const lat = -Math.PI / 2 + m / 6 * Math.PI;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= SEG; i++) {
          const lon = i / SEG * Math.PI * 2 + spin;
          let p = {
            x: Math.cos(lat) * Math.cos(lon),
            y: Math.sin(lat),
            z: Math.cos(lat) * Math.sin(lon)
          };
          p = rotY(p, sceneY);
          p = rotX(p, sceneX + 0.28);
          const s = project(p);
          if (!s) {
            started = false;
            continue;
          }
          if (!started) {
            ctx.moveTo(s.x, s.y);
            started = true;
          } else ctx.lineTo(s.x, s.y);
        }
        ctx.strokeStyle = rgba(P.wire, P.wireA * 0.42);
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
      ctx.restore();
      const rim = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.03);
      rim.addColorStop(0, rgba(P.rim, 0));
      rim.addColorStop(0.75, rgba(P.rim, 0.16));
      rim.addColorStop(1, rgba(P.rim, 0.55));
      ctx.fillStyle = rim;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.03, 0, Math.PI * 2);
      ctx.fill();
      const spec = ctx.createRadialGradient(
        cx + LX * R * 0.55,
        cy + LY * R * 0.55,
        0,
        cx + LX * R * 0.55,
        cy + LY * R * 0.55,
        R * 0.42
      );
      spec.addColorStop(0, "rgba(255,255,255,0.55)");
      spec.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(cx + LX * R * 0.55, cy + LY * R * 0.55, R * 0.42, 0, Math.PI * 2);
      ctx.fill();
    };
    const drawOrbit = (ring, sceneX, sceneY, behind) => {
      const SEG = 96;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= SEG; i++) {
        const a = i / SEG * Math.PI * 2;
        let p = { x: Math.cos(a) * ring.r, y: 0, z: Math.sin(a) * ring.r };
        p = rotX(p, ring.tilt);
        p = rotY(p, ring.yaw);
        p = rotY(p, sceneY);
        p = rotX(p, sceneX);
        const isBehind = p.z < 0;
        const s = project(p);
        if (!s || isBehind !== behind) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(s.x, s.y);
          started = true;
        } else ctx.lineTo(s.x, s.y);
      }
      ctx.strokeStyle = rgba(P.line, behind ? P.lineA * 0.2 : P.lineA * 0.42);
      ctx.lineWidth = behind ? 0.7 : 1;
      ctx.setLineDash([3, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    const drawSpoke = (m, p, s, t, i) => {
      const behind = p.z < 0;
      const depth = (p.z + RINGS[m.ring].r) / (2 * RINGS[m.ring].r);
      const alpha = P.lineA * (0.25 + depth * 0.75);
      const g = ctx.createLinearGradient(cx, cy, s.x, s.y);
      g.addColorStop(0, rgba(P.line, alpha * 0.9));
      g.addColorStop(1, rgba(P.line, alpha * 0.15));
      ctx.strokeStyle = g;
      ctx.lineWidth = behind ? 0.7 : 1.15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();
      for (let k = 0; k < 2; k++) {
        const period = 2.4 + (i + k * 3) % 5 * 0.42;
        const phase = (t / period + i * 0.17 + k * 0.5) % 1;
        const u = k % 2 ? 1 - phase : phase;
        const wp = { x: p.x * u, y: p.y * u, z: p.z * u };
        const ps = project(wp);
        if (!ps) continue;
        const size = (k ? 1.5 : 2.2) * ps.k;
        const a = (0.35 + depth * 0.65) * (k ? 0.7 : 1);
        const halo = ctx.createRadialGradient(ps.x, ps.y, 0, ps.x, ps.y, size * 4);
        halo.addColorStop(0, rgba(P.packet, a * 0.55));
        halo.addColorStop(1, rgba(P.packet, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(ps.x, ps.y, size * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = rgba(P.packet, a);
        ctx.beginPath();
        ctx.arc(ps.x, ps.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const drawNode = (p, s, ring) => {
      const depth = (p.z + ring.r) / (2 * ring.r);
      const a = 0.35 + depth * 0.65;
      const rad = 3.1 * s.k;
      const halo = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, rad * 5);
      halo.addColorStop(0, rgba(P.node, a * 0.42));
      halo.addColorStop(1, rgba(P.node, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(s.x, s.y, rad * 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(P.node, Math.min(1, a + 0.15));
      ctx.beginPath();
      ctx.arc(s.x, s.y, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${a * 0.75})`;
      ctx.beginPath();
      ctx.arc(s.x - rad * 0.3, s.y - rad * 0.3, rad * 0.38, 0, Math.PI * 2);
      ctx.fill();
    };
    const drawDust = (t, sceneX, sceneY) => {
      for (const d of DUST) {
        let p = rotY({ x: d.x, y: d.y, z: d.z }, sceneY * 0.6 + t * 0.012);
        p = rotX(p, sceneX * 0.6);
        const s = project(p);
        if (!s) continue;
        const tw = 0.45 + 0.55 * Math.sin(t * 0.9 + d.tw);
        ctx.fillStyle = rgba(P.dust, P.dustA * tw * Math.min(1, s.k * 0.75));
        ctx.beginPath();
        ctx.arc(s.x, s.y, d.s * s.k, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    const frame = (now) => {
      const t = reduced ? 6.2 : (now - start) / 1e3;
      const pr = pointerRef.current;
      pr.x += (pr.tx - pr.x) * 0.055;
      pr.y += (pr.ty - pr.y) * 0.055;
      const sceneY = (reduced ? 0 : t * 0.055) + pr.x * 0.3;
      const sceneX = -0.16 + pr.y * -0.2;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      drawDust(t, sceneX, sceneY);
      const placed = MODULES$1.map((m, i) => {
        const p = nodeAt(m, t, sceneX, sceneY);
        return { m, i, p, s: project(p) };
      }).filter((o) => o.s);
      const behind = placed.filter((o) => o.p.z < 0).sort((a, b) => a.p.z - b.p.z);
      const front = placed.filter((o) => o.p.z >= 0).sort((a, b) => a.p.z - b.p.z);
      RINGS.forEach((ring) => drawOrbit(ring, sceneX, sceneY, true));
      behind.forEach((o) => {
        drawSpoke(o.m, o.p, o.s, t, o.i);
        drawNode(o.p, o.s, RINGS[o.m.ring]);
      });
      ctx.globalCompositeOperation = "source-over";
      drawCore(t, sceneX, sceneY);
      ctx.globalCompositeOperation = "lighter";
      RINGS.forEach((ring) => drawOrbit(ring, sceneX, sceneY, false));
      front.forEach((o) => {
        drawSpoke(o.m, o.p, o.s, t, o.i);
        drawNode(o.p, o.s, RINGS[o.m.ring]);
      });
      ctx.globalCompositeOperation = "source-over";
      placed.forEach((o) => {
        const el = labelRefs.current[o.i];
        if (!el) return;
        const ring = RINGS[o.m.ring];
        const depth = (o.p.z + ring.r) / (2 * ring.r);
        const scale = 0.74 + o.s.k * 0.3;
        el.style.transform = `translate3d(${o.s.x}px, ${o.s.y}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
        el.style.opacity = (0.34 + depth * 0.66).toFixed(3);
        el.style.zIndex = String(1e3 + Math.round(o.p.z * 100));
      });
      if (!reduced && running) raf = requestAnimationFrame(frame);
    };
    resize();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) requestAnimationFrame(frame);
    });
    ro.observe(wrap);
    const onVis = () => {
      running = !document.hidden && active && !reduced;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);
    running = active && !reduced;
    if (!running && !reduced) cancelAnimationFrame(raf);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isDarkMode, reduced, active]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: wrapRef,
      onPointerMove,
      onPointerLeave,
      className: "relative w-full max-w-4xl mx-auto aspect-[4/3] select-none",
      role: "img",
      "aria-label": "Qore, the VenQore intelligence core: twelve product modules orbiting a single shared engine — Dashboard, Reports, Sales, POS, Inventory, Purchases, Warehouses, Manufacturing, Accounting, CRM, AI Assistant and Multi-Store.",
      children: [
        /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className: "absolute inset-0 w-full h-full", "aria-hidden": "true" }),
        /* @__PURE__ */ jsxs("div", { className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] text-center pointer-events-none", children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: "font-black tracking-tight text-lg sm:text-2xl text-white drop-shadow-[0_2px_12px_rgba(76,29,149,0.9)]",
              style: { fontFamily: "'Space Grotesk',sans-serif" },
              children: "QORE"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "text-[7px] sm:text-4xs font-black uppercase tracking-[0.3em] text-violet-100/90 drop-shadow-[0_1px_6px_rgba(76,29,149,0.9)]", children: "Intelligence Core" })
        ] }),
        MODULES$1.map((m, i) => /* @__PURE__ */ jsx(
          "div",
          {
            ref: (el) => {
              labelRefs.current[i] = el;
            },
            className: "absolute left-0 top-0 will-change-transform pointer-events-none",
            style: { opacity: 0 },
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-slate-950/85 border border-slate-900/10 dark:border-white/10 backdrop-blur-md shadow-lg", children: [
              /* @__PURE__ */ jsx(m.ic, { size: 13, className: "text-indigo-600 dark:text-indigo-300 shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline text-2xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap", children: m.n })
            ] })
          },
          m.n
        ))
      ]
    }
  );
}
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}
function useReveal(options = {}) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.unobserve(el);
        }
      },
      { threshold: options.threshold ?? 0.15, rootMargin: options.rootMargin ?? "0px 0px -60px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}
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
const Reveal = ({ children, delay = 0, direction = "up", className = "", as: Tag = "div" }) => {
  const [ref, vis] = useReveal();
  const t = {
    up: "translateY(46px)",
    down: "translateY(-34px)",
    left: "translateX(46px)",
    right: "translateX(-46px)",
    scale: "scale(0.94)",
    none: "none"
  };
  return /* @__PURE__ */ jsx(Tag, { ref, className, style: {
    opacity: vis ? 1 : 0,
    transform: vis ? "none" : t[direction] || t.up,
    transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
    willChange: "opacity, transform"
  }, children });
};
const fmtNum = (n, decimals = 0, group = true) => {
  const v = decimals > 0 ? Number(n).toFixed(decimals) : String(Math.round(n));
  if (!group) return v;
  const [int, dec] = v.split(".");
  const gi = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${gi}.${dec}` : gi;
};
const AnimCounter = ({ end, decimals = 0, group = false, suffix = "", prefix = "", duration = 1900 }) => {
  const reduced = usePrefersReducedMotion();
  const [val, setVal] = useState(0);
  const [ref, vis] = useReveal({ threshold: 0.4 });
  const ran = useRef(false);
  useEffect(() => {
    if (!vis || ran.current) return;
    ran.current = true;
    if (reduced) {
      setVal(end);
      return;
    }
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
  return /* @__PURE__ */ jsxs("span", { ref, children: [
    prefix,
    fmtNum(val, decimals, group),
    suffix
  ] });
};
const MagBtn = ({ children, href, variant = "primary", className = "", onClick }) => {
  const reduced = usePrefersReducedMotion();
  const r = useRef(null);
  useCallback((e) => {
    if (reduced) return;
    const b = r.current;
    if (!b) return;
    const rect = b.getBoundingClientRect();
    b.style.transform = `translate(${(e.clientX - rect.left - rect.width / 2) * 0.18}px, ${(e.clientY - rect.top - rect.height / 2) * 0.28}px)`;
  }, [reduced]);
  useCallback(() => {
    if (r.current) r.current.style.transform = "";
  }, []);
  const variants = {
    primary: "px-9 py-4 bg-slate-900 dark:bg-white text-white dark:text-void-900 font-black text-[15px] rounded-full shadow-[0_8px_40px_-8px_rgba(15,23,42,0.35)] dark:shadow-[0_8px_40px_-8px_rgba(255,255,255,0.35)] hover:shadow-[0_0_70px_-6px_rgba(99,102,241,0.45)] dark:hover:shadow-[0_0_70px_-6px_rgba(165,180,252,0.55)]",
    glow: "px-9 py-4 text-white font-black text-[15px] rounded-full vq-cta-glow",
    ghost: "px-8 py-4 bg-slate-900/[0.04] dark:bg-white/[0.04] border border-slate-900/10 dark:border-white/12 text-slate-900 dark:text-white font-bold text-[15px] rounded-full hover:bg-slate-900/[0.08] dark:hover:bg-white/[0.08] hover:border-slate-900/25 dark:hover:border-white/25 backdrop-blur-md",
    accent: "px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-full shadow-xl shadow-indigo-600/25"
  };
  return /* @__PURE__ */ jsx(
    Link,
    {
      ref: r,
      href: href || "/register",
      onClick,
      className: `group/btn relative inline-flex items-center justify-center gap-2.5 transition-[transform,box-shadow,background] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${variants[variant]} ${className}`,
      children
    }
  );
};
const Eyebrow = ({ children, icon: Ic, tone = "indigo" }) => {
  const tones = {
    indigo: "bg-indigo-500/10 border-indigo-400/20 text-indigo-300",
    cyan: "bg-cyan-500/10 border-cyan-400/20 text-cyan-300",
    amber: "bg-amber-500/10 border-amber-400/20 text-amber-300",
    emerald: "bg-emerald-500/10 border-emerald-400/20 text-emerald-300",
    rose: "bg-rose-500/10 border-rose-400/20 text-rose-300",
    violet: "bg-violet-500/10 border-violet-400/20 text-violet-300"
  };
  return /* @__PURE__ */ jsxs("div", { className: `inline-flex items-center gap-2.5 px-4 py-2 rounded-full border ${tones[tone]} text-2xs font-black tracking-[0.32em] uppercase mb-7 backdrop-blur-sm`, children: [
    Ic && /* @__PURE__ */ jsx(Ic, { size: 13 }),
    children
  ] });
};
const Glass = ({ children, className = "", glow = false }) => /* @__PURE__ */ jsxs("div", { className: `relative rounded-[2rem] border border-slate-900/[0.10] dark:border-white/[0.08] bg-white/[0.025] backdrop-blur-xl ${glow ? "shadow-[0_30px_120px_-40px_rgba(99,102,241,0.45)]" : ""} ${className}`, children: [
  /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-t-[2rem]" }),
  children
] });
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const TrueCostCalculator = () => {
  const reduced = usePrefersReducedMotion();
  const [revenue, setRevenue] = useState(8e4);
  const [margin, setMargin] = useState(32);
  const [taxRate, setTaxRate] = useState(15);
  const { taxInflation, costDrift, decisionCost, annual, realMargin } = useMemo(() => {
    const taxInflation2 = revenue * (taxRate / 100) / (1 + taxRate / 100);
    const netRevenue = revenue - taxInflation2;
    const cogs = netRevenue * (1 - margin / 100);
    const costDrift2 = cogs * 0.03;
    const decisionCost2 = costDrift2 * 0.25;
    const monthly = taxInflation2 === 0 ? costDrift2 + decisionCost2 : costDrift2 + decisionCost2;
    const realGross = netRevenue - (cogs + costDrift2);
    return {
      taxInflation: taxInflation2,
      costDrift: costDrift2,
      decisionCost: decisionCost2,
      annual: monthly * 12,
      realMargin: netRevenue > 0 ? realGross / netRevenue * 100 : 0
    };
  }, [revenue, margin, taxRate]);
  const Slider = ({ label, value, onChange, min, max, step, format }) => /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-between mb-2", children: [
      /* @__PURE__ */ jsx("label", { className: "text-2xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400", children: label }),
      /* @__PURE__ */ jsx("span", { className: "text-lg font-black text-slate-900 dark:text-white tabular-nums", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: format(value) })
    ] }),
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "range",
        min,
        max,
        step,
        value,
        onChange: (e) => onChange(Number(e.target.value)),
        "aria-label": label,
        className: "vq-range w-full"
      }
    )
  ] });
  return /* @__PURE__ */ jsx(Glass, { className: "p-7 md:p-10", glow: true, children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-10 items-center", children: [
    /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5 space-y-7", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: "Your numbers." }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 leading-relaxed", children: "Move the sliders. Everything is calculated in your browser — nothing is sent anywhere." })
      ] }),
      /* @__PURE__ */ jsx(
        Slider,
        {
          label: "Monthly revenue",
          value: revenue,
          onChange: setRevenue,
          min: 5e3,
          max: 5e5,
          step: 5e3,
          format: money
        }
      ),
      /* @__PURE__ */ jsx(
        Slider,
        {
          label: "Reported gross margin",
          value: margin,
          onChange: setMargin,
          min: 5,
          max: 70,
          step: 1,
          format: (v) => `${v}%`
        }
      ),
      /* @__PURE__ */ jsx(
        Slider,
        {
          label: "Sales tax / VAT rate",
          value: taxRate,
          onChange: setTaxRate,
          min: 0,
          max: 30,
          step: 1,
          format: (v) => `${v}%`
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-[1.5rem] border border-rose-500/20 bg-rose-500/[0.06] p-7 md:p-8 mb-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xs font-black uppercase tracking-[0.28em] text-rose-500 dark:text-rose-400 mb-3", children: "Cost of wrong numbers · per year" }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `text-4xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums ${reduced ? "" : "transition-all duration-500"}`,
            style: { fontFamily: "'Space Grotesk',sans-serif" },
            children: money(annual)
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed", children: "Not a fee anyone charges you. It is margin that leaks because the books were approximately right instead of exactly right." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [
        {
          v: money(taxInflation),
          l: "Tax counted as revenue",
          m: "per month",
          note: "Money you owe the government, sitting in your top line.",
          tone: "border-amber-500/20 bg-amber-500/[0.05]",
          accent: "text-amber-600 dark:text-amber-400"
        },
        {
          v: money(costDrift),
          l: "Cost basis drift",
          m: "per month",
          note: "COGS stated from averaged costs that overwrote the real ones.",
          tone: "border-rose-500/20 bg-rose-500/[0.05]",
          accent: "text-rose-600 dark:text-rose-400"
        },
        {
          v: `${realMargin.toFixed(1)}%`,
          l: "Your actual margin",
          m: `reported as ${margin}%`,
          note: "The gap between these two is where pricing decisions go wrong.",
          tone: "border-indigo-500/20 bg-indigo-500/[0.05]",
          accent: "text-indigo-600 dark:text-indigo-400"
        }
      ].map((c, i) => /* @__PURE__ */ jsxs("div", { className: `p-5 rounded-2xl border ${c.tone}`, children: [
        /* @__PURE__ */ jsx("div", { className: `text-2xl font-black tracking-tight tabular-nums ${c.accent}`, style: { fontFamily: "'Space Grotesk',sans-serif" }, children: c.v }),
        /* @__PURE__ */ jsx("div", { className: "text-2xs font-black uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300 mt-1.5", children: c.l }),
        /* @__PURE__ */ jsx("div", { className: "text-3xs uppercase tracking-widest text-slate-500 dark:text-slate-500 mt-0.5", children: c.m }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed", children: c.note })
      ] }, i)) })
    ] })
  ] }) });
};
const SALE_STEPS = [
  {
    t: "Customer pays $115",
    typical: { line: "Revenue +$115", ok: false, note: "Tax folded into the top line" },
    venqore: { line: "Revenue +$100 · Tax payable +$15", ok: true, note: "Split at the ledger" }
  },
  {
    t: "Stock leaves the shelf",
    typical: { line: "COGS −$62 (average cost)", ok: false, note: "Basis overwritten 3 purchases ago" },
    venqore: { line: "COGS −$58 (batch #2941, FIFO)", ok: true, note: "The cost you actually paid" }
  },
  {
    t: "Profit is calculated",
    typical: { line: "Gross profit $53", ok: false, note: "Off by $11 — and nothing flags it" },
    venqore: { line: "Gross profit $42", ok: true, note: "Reconciles to the general ledger" }
  },
  {
    t: "Someone edits the sale",
    typical: { line: "Row overwritten silently", ok: false, note: "No trail, no reversal" },
    venqore: { line: "Reversing entry + new entry", ok: true, note: "Both immutable, both visible" }
  }
];
const SameSaleSplit = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView(0.3);
  const [step, setStep] = useState(reduced ? SALE_STEPS.length - 1 : -1);
  useEffect(() => {
    if (reduced) {
      setStep(SALE_STEPS.length - 1);
      return;
    }
    if (!inView) return;
    setStep(-1);
    let i = -1;
    const id = setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= SALE_STEPS.length - 1) clearInterval(id);
    }, 1100);
    return () => clearInterval(id);
  }, [inView, reduced]);
  const Column = ({ side, title, subtitle }) => {
    const isVq = side === "venqore";
    return /* @__PURE__ */ jsxs("div", { className: `rounded-[1.5rem] border p-6 ${isVq ? "border-emerald-500/25 bg-emerald-500/[0.04]" : "border-slate-900/10 dark:border-white/[0.08] bg-slate-900/[0.02] dark:bg-white/[0.02]"}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-5", children: [
        /* @__PURE__ */ jsx(
          "h4",
          {
            className: `text-base font-black tracking-tight ${isVq ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}`,
            style: { fontFamily: "'Space Grotesk',sans-serif" },
            children: title
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 mt-1", children: subtitle })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: SALE_STEPS.map((s, i) => {
        const cell = s[side];
        const shown = i <= step;
        return /* @__PURE__ */ jsx(
          "div",
          {
            className: `p-3.5 rounded-xl border transition-all duration-500 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"} ${cell.ok ? "border-emerald-500/20 bg-emerald-500/[0.06]" : "border-rose-500/20 bg-rose-500/[0.05]"}`,
            children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
              cell.ok ? /* @__PURE__ */ jsx(CheckCircle2, { size: 15, className: "text-emerald-500 shrink-0 mt-0.5" }) : /* @__PURE__ */ jsx(AlertTriangle, { size: 15, className: "text-rose-500 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums", children: cell.line }),
                /* @__PURE__ */ jsx("div", { className: "text-2xs text-slate-500 dark:text-slate-400 mt-0.5", children: cell.note })
              ] })
            ] })
          },
          i
        );
      }) })
    ] });
  };
  return /* @__PURE__ */ jsxs("div", { ref, children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center justify-center gap-2 mb-7", children: SALE_STEPS.map((s, i) => /* @__PURE__ */ jsx(
      "div",
      {
        className: `px-3.5 py-1.5 rounded-full text-2xs font-black uppercase tracking-[0.15em] border transition-all duration-500 ${i <= step ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" : "border-slate-900/10 dark:border-white/[0.08] text-slate-500 dark:text-slate-600"}`,
        children: s.t
      },
      i
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsx(Column, { side: "typical", title: "A typical POS", subtitle: "Numbers that drift" }),
      /* @__PURE__ */ jsx(Column, { side: "venqore", title: "VenQore", subtitle: "Numbers that reconcile" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-center text-sm text-slate-500 dark:text-slate-400 mt-7 max-w-2xl mx-auto leading-relaxed", children: "Same customer. Same $115. One system ends the day $11 wrong on a single sale and cannot tell you why — the other can show you the journal entry." })
  ] });
};
const TAPE_ROWS = [
  { ref: "SL-4471", d: "Cash", c: "Sales revenue", amt: 1240 },
  { ref: "SL-4471", d: "Cost of goods sold", c: "Inventory", amt: 742.16 },
  { ref: "PU-1188", d: "Inventory", c: "Accounts payable", amt: 8600 },
  { ref: "SL-4472", d: "Accounts receivable", c: "Sales revenue", amt: 3175.5 },
  { ref: "SL-4472", d: "Cost of goods sold", c: "Inventory", amt: 1904.3 },
  { ref: "EX-0913", d: "Rent expense", c: "Bank", amt: 2400 },
  { ref: "RT-0221", d: "Sales returns", c: "Cash", amt: 318.75 },
  { ref: "RT-0221", d: "Inventory", c: "Cost of goods sold", amt: 191.25 },
  { ref: "SL-4473", d: "Cash", c: "Sales revenue", amt: 96.4 },
  { ref: "SL-4473", d: "Cash", c: "Tax payable", amt: 14.46 },
  { ref: "TF-0044", d: "Inventory · Branch 2", c: "Inventory · Branch 1", amt: 5120 },
  { ref: "PY-2210", d: "Accounts payable", c: "Bank", amt: 8600 }
];
const LedgerTape = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView(0.25);
  const [head, setHead] = useState(0);
  useEffect(() => {
    if (reduced || !inView) return;
    const id = setInterval(() => setHead((h) => (h + 1) % TAPE_ROWS.length), 1400);
    return () => clearInterval(id);
  }, [inView, reduced]);
  const visible = Array.from({ length: 6 }, (_, i) => {
    const row = TAPE_ROWS[(head + i) % TAPE_ROWS.length];
    return { ...row, key: `${head}-${i}`, fade: i / 6 };
  });
  const totalDr = visible.reduce((s, r) => s + r.amt, 0);
  return /* @__PURE__ */ jsxs("div", { ref, className: "rounded-[1.5rem] border border-slate-900/10 dark:border-white/[0.08] bg-slate-950/[0.03] dark:bg-slate-950/60 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-5 py-3.5 border-b border-slate-900/[0.07] dark:border-white/[0.06]", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 vq-blink" }),
        /* @__PURE__ */ jsx("span", { className: "text-2xs font-black uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400", children: "General ledger · posting live" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "hidden sm:block text-2xs font-mono text-slate-500 dark:text-slate-600", children: "double-entry · DECIMAL(20,4)" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "divide-y divide-slate-900/[0.05] dark:divide-white/[0.04]", children: visible.map((r, i) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: `grid grid-cols-12 gap-2 px-5 py-3 text-xs ${i === 0 && !reduced ? "vq-row-in" : ""}`,
        style: { opacity: 1 - r.fade * 0.75 },
        children: [
          /* @__PURE__ */ jsx("span", { className: "col-span-2 font-mono text-slate-500 dark:text-slate-600", children: r.ref }),
          /* @__PURE__ */ jsx("span", { className: "col-span-4 font-semibold text-slate-700 dark:text-slate-200 truncate", children: r.d }),
          /* @__PURE__ */ jsx("span", { className: "col-span-4 text-slate-500 dark:text-slate-400 truncate", children: r.c }),
          /* @__PURE__ */ jsx("span", { className: "col-span-2 text-right font-bold tabular-nums text-slate-800 dark:text-slate-100", children: r.amt.toFixed(2) })
        ]
      },
      r.key
    )) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 border-t border-slate-900/[0.07] dark:border-white/[0.06]", children: [
      { l: "Total debits", v: totalDr },
      { l: "Total credits", v: totalDr }
    ].map((t, i) => /* @__PURE__ */ jsxs("div", { className: `px-5 py-4 ${i === 0 ? "border-r border-slate-900/[0.07] dark:border-white/[0.06]" : ""}`, children: [
      /* @__PURE__ */ jsx("div", { className: "text-3xs font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500", children: t.l }),
      /* @__PURE__ */ jsx("div", { className: "text-lg font-black tabular-nums text-slate-900 dark:text-white mt-0.5", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: t.v.toFixed(2) })
    ] }, i)) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500/[0.07] border-t border-emerald-500/15", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { size: 14, className: "text-emerald-500" }),
      /* @__PURE__ */ jsx("span", { className: "text-2xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400", children: "Balanced — every entry, every time" })
    ] })
  ] });
};
const _line = (a, b) => ({ len: Math.hypot(b[0] - a[0], b[1] - a[1]), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) });
const _ctrl = (cur, prev, next, rev) => {
  prev = prev || cur;
  next = next || cur;
  const o = _line(prev, next);
  const ang = o.ang + (rev ? Math.PI : 0);
  const len = o.len * 0.16;
  return [cur[0] + Math.cos(ang) * len, cur[1] + Math.sin(ang) * len];
};
const smoothPath = (pts) => pts.reduce((acc, p, i, a) => {
  if (i === 0) return `M ${p[0]},${p[1]}`;
  const cs = _ctrl(a[i - 1], a[i - 2], p, false);
  const ce = _ctrl(p, a[i - 1], a[i + 1], true);
  return `${acc} C ${cs[0]},${cs[1]} ${ce[0]},${ce[1]} ${p[0]},${p[1]}`;
}, "");
const REV_SETS = {
  Today: { s: [140, 132, 150, 128, 142, 120, 130, 110, 124, 104, 116, 92, 102, 84, 92, 70], p: 0.42 },
  Month: { s: [168, 160, 150, 156, 138, 146, 128, 136, 120, 128, 108, 116, 96, 104, 84, 64], p: 0.5 },
  Year: { s: [176, 158, 164, 146, 150, 132, 138, 120, 128, 106, 114, 92, 100, 78, 70, 52], p: 0.46 }
};
const RevenueChart = ({ height = 210, tab = "Month", reduced = false }) => {
  const [ref, inView] = useInView(0.3);
  const W = 520, H = 240;
  const set = REV_SETS[tab] || REV_SETS.Month;
  const ptsS = useMemo(() => set.s.map((y, i) => [i * (W - 16) / (set.s.length - 1) + 8, y]), [tab]);
  const ptsP = useMemo(() => ptsS.map(([x, y]) => [x, Math.min(232, y + 34 + (1 - set.p) * 30)]), [ptsS]);
  const lineS = useMemo(() => smoothPath(ptsS), [ptsS]);
  const lineP = useMemo(() => smoothPath(ptsP), [ptsP]);
  const areaS = `${lineS} L ${ptsS[ptsS.length - 1][0]},${H} L ${ptsS[0][0]},${H} Z`;
  const areaP = `${lineP} L ${ptsP[ptsP.length - 1][0]},${H} L ${ptsP[0][0]},${H} Z`;
  const last = ptsS[ptsS.length - 1];
  const drawn = reduced || inView;
  return /* @__PURE__ */ jsx("div", { ref, className: "relative w-full", children: /* @__PURE__ */ jsxs("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", height, preserveAspectRatio: "none", className: "overflow-visible", children: [
    /* @__PURE__ */ jsxs("defs", { children: [
      /* @__PURE__ */ jsxs("linearGradient", { id: "vqSales", x1: "0", y1: "0", x2: "0", y2: "1", children: [
        /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: vq.indigo[500], stopOpacity: "0.34" }),
        /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: vq.indigo[500], stopOpacity: "0" })
      ] }),
      /* @__PURE__ */ jsxs("linearGradient", { id: "vqProfit", x1: "0", y1: "0", x2: "0", y2: "1", children: [
        /* @__PURE__ */ jsx("stop", { offset: "5%", stopColor: vq.emerald[500], stopOpacity: "0.40" }),
        /* @__PURE__ */ jsx("stop", { offset: "95%", stopColor: vq.emerald[500], stopOpacity: "0.04" })
      ] })
    ] }),
    [60, 120, 180].map((y) => /* @__PURE__ */ jsx("line", { x1: "0", y1: y, x2: W, y2: y, stroke: "rgba(255,255,255,0.05)", strokeDasharray: "3 3", strokeWidth: "1" }, y)),
    /* @__PURE__ */ jsx("path", { d: areaP, fill: "url(#vqProfit)", style: { opacity: drawn ? 1 : 0, transition: "opacity 1s ease 0.5s" } }, `pa-${tab}`),
    /* @__PURE__ */ jsx("path", { d: areaS, fill: "url(#vqSales)", style: { opacity: drawn ? 1 : 0, transition: "opacity 1s ease 0.6s" } }, `sa-${tab}`),
    /* @__PURE__ */ jsx(
      "path",
      {
        d: lineP,
        fill: "none",
        stroke: vq.emerald[500],
        strokeWidth: "2.5",
        strokeLinecap: "round",
        pathLength: "1",
        style: { strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: reduced ? "none" : "stroke-dashoffset 1.7s cubic-bezier(0.65,0,0.35,1) 0.15s" }
      },
      `pl-${tab}`
    ),
    /* @__PURE__ */ jsx(
      "path",
      {
        d: lineS,
        fill: "none",
        stroke: vq.indigo[500],
        strokeWidth: "3",
        strokeLinecap: "round",
        pathLength: "1",
        style: { strokeDasharray: 1, strokeDashoffset: drawn ? 0 : 1, transition: reduced ? "none" : "stroke-dashoffset 1.7s cubic-bezier(0.65,0,0.35,1)", filter: "drop-shadow(0 6px 16px rgba(99,102,241,0.45))" }
      },
      `sl-${tab}`
    ),
    /* @__PURE__ */ jsxs("g", { style: { opacity: drawn ? 1 : 0, transition: "opacity 0.6s ease 1.5s" }, children: [
      /* @__PURE__ */ jsx("circle", { cx: last[0], cy: last[1], r: "9", fill: "rgba(99,102,241,0.2)", className: reduced ? "" : "vq-ping" }),
      /* @__PURE__ */ jsx("circle", { cx: last[0], cy: last[1], r: "4", fill: vq.indigo[400] })
    ] })
  ] }) });
};
const ACTIVITY_POOL = [
  { type: "Sale", ref: "INV-2041", amt: "+ 1,250", dir: "in", tone: "blue" },
  { type: "Purchase", ref: "GRN-118", amt: "- 3,400", dir: "out", tone: "amber" },
  { type: "Payment In", ref: "RCP-330", amt: "+ 5,000", dir: "in", tone: "emerald" },
  { type: "Expense", ref: "Utilities", amt: "- 145", dir: "out", tone: "red" },
  { type: "Return", ref: "CRN-07", amt: "- 220", dir: "out", tone: "rose" },
  { type: "Sale", ref: "INV-2042", amt: "+ 860", dir: "in", tone: "blue" },
  { type: "Transfer", ref: "WT-12", amt: "980", dir: "move", tone: "orange" }
];
const ACT_TONE = {
  blue: "bg-blue-500/20 text-blue-300",
  amber: "bg-amber-500/20 text-amber-300",
  emerald: "bg-emerald-500/20 text-emerald-300",
  red: "bg-red-500/20 text-red-300",
  rose: "bg-rose-500/20 text-rose-300",
  orange: "bg-orange-500/20 text-orange-300"
};
const TIMES = ["just now", "2m ago", "6m ago", "11m ago", "18m ago", "25m ago"];
const ActivityRow = ({ a, fresh, t }) => /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-900/[0.04] dark:hover:bg-white/5 transition-colors ${fresh ? "vq-row-in" : ""}`, children: [
  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [
    /* @__PURE__ */ jsx("div", { className: `w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${ACT_TONE[a.tone]}`, children: a.dir === "in" ? /* @__PURE__ */ jsx(ArrowDownRight, { size: 12 }) : a.dir === "move" ? /* @__PURE__ */ jsx(RefreshCw, { size: 12 }) : /* @__PURE__ */ jsx(ArrowUpRight, { size: 12 }) }),
    /* @__PURE__ */ jsxs("div", { className: "leading-tight min-w-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-1xs font-semibold text-slate-800 dark:text-white/90 truncate", children: [
        a.type,
        " ",
        /* @__PURE__ */ jsxs("span", { className: "text-slate-500 font-mono", children: [
          "· ",
          a.ref
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "text-3xs text-slate-500", children: t })
    ] })
  ] }),
  /* @__PURE__ */ jsx("span", { className: `text-1xs font-bold tabular-nums shrink-0 ${a.dir === "in" ? "text-emerald-600 dark:text-emerald-400" : a.dir === "move" ? "text-orange-300" : "text-slate-600 dark:text-slate-300"}`, children: a.amt })
] });
const ActivityFeed = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView(0.25);
  const [rows, setRows] = useState(() => [0, 1, 2, 3, 4].map((i) => ({ ...ACTIVITY_POOL[i], k: i })));
  const ptr = useRef(5);
  const idk = useRef(100);
  useEffect(() => {
    if (reduced || !inView) return;
    const tm = setInterval(() => {
      const a = { ...ACTIVITY_POOL[ptr.current % ACTIVITY_POOL.length], k: idk.current++ };
      ptr.current++;
      setRows((prev) => [a, ...prev].slice(0, 5));
    }, 2400);
    return () => clearInterval(tm);
  }, [reduced, inView]);
  return /* @__PURE__ */ jsx("div", { ref, className: "space-y-0.5", children: rows.map((a, i) => /* @__PURE__ */ jsx(ActivityRow, { a, fresh: i === 0 && !reduced, t: TIMES[i] }, a.k)) });
};
const railIcons = [Gauge, ShoppingCart, Boxes, Users, BarChart3, Wallet, Cpu];
const HeroDashboard = () => {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef(null);
  const cardRef = useRef(null);
  const chipRefs = useRef([]);
  const [revTab, setRevTab] = useState("Month");
  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => setRevTab((p) => p === "Today" ? "Month" : p === "Month" ? "Year" : "Today"), 4200);
    return () => clearInterval(t);
  }, [reduced]);
  const onMove = useCallback((e) => {
    if (reduced || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    if (cardRef.current) cardRef.current.style.transform = `perspective(1600px) rotateY(${dx * 7}deg) rotateX(${-dy * 7}deg) translateZ(0)`;
    chipRefs.current.forEach((c, i) => {
      if (!c) return;
      const depth = (i % 3 + 1) * 10;
      c.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
    });
  }, [reduced]);
  const onLeave = useCallback(() => {
    if (cardRef.current) cardRef.current.style.transform = "perspective(1600px) rotateY(0) rotateX(0)";
    chipRefs.current.forEach((c) => {
      if (c) c.style.transform = "";
    });
  }, []);
  const setChip = (i) => (el) => {
    chipRefs.current[i] = el;
  };
  return /* @__PURE__ */ jsxs("div", { ref: wrapRef, onMouseMove: onMove, onMouseLeave: onLeave, className: "relative mx-auto w-full max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { ref: setChip(0), className: "hidden md:flex absolute -left-6 top-16 z-20 items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 backdrop-blur-xl shadow-2xl vq-float", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { size: 16, className: "text-emerald-600 dark:text-emerald-400" }),
      /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-emerald-200", children: "Balanced to the cent" })
    ] }),
    /* @__PURE__ */ jsxs("div", { ref: setChip(1), className: "hidden md:flex absolute -right-4 top-32 z-20 items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 backdrop-blur-xl shadow-2xl vq-float-2", children: [
      /* @__PURE__ */ jsx(ScanBarcode, { size: 16, className: "text-indigo-300" }),
      /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-indigo-100", children: "Scan → Journal · 1.2s" })
    ] }),
    /* @__PURE__ */ jsxs("div", { ref: setChip(2), className: "hidden lg:flex absolute -left-10 bottom-24 z-20 items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-xl shadow-2xl vq-float-3", children: [
      /* @__PURE__ */ jsx(Layers, { size: 16, className: "text-cyan-300" }),
      /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-cyan-100", children: "FIFO COGS per batch" })
    ] }),
    /* @__PURE__ */ jsxs("div", { ref: setChip(3), className: "hidden md:flex absolute -right-8 bottom-16 z-20 items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 backdrop-blur-xl shadow-2xl vq-float", children: [
      /* @__PURE__ */ jsx(TrendingUp, { size: 16, className: "text-amber-300" }),
      /* @__PURE__ */ jsx("span", { className: "text-1xs font-bold text-amber-100", children: "+18.4% MoM" })
    ] }),
    /* @__PURE__ */ jsxs("div", { ref: cardRef, className: "relative z-10 rounded-[1.75rem] border border-slate-900/[0.10] dark:border-white/[0.08] bg-slate-950/70 backdrop-blur-2xl shadow-[0_50px_160px_-50px_rgba(99,102,241,0.6)] overflow-hidden transition-transform duration-300 ease-out", children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-5 py-3.5 border-b border-slate-900/[0.08] dark:border-white/[0.06]", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full bg-rose-400/70" }),
          /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full bg-amber-400/70" }),
          /* @__PURE__ */ jsx("span", { className: "w-3 h-3 rounded-full bg-emerald-400/70" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/[0.035] dark:bg-white/[0.04] border border-slate-900/[0.08] dark:border-white/[0.06]", children: [
          /* @__PURE__ */ jsx(Lock, { size: 10, className: "text-slate-500" }),
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-mono text-slate-500 dark:text-slate-400", children: "app.venqore.com/dashboard" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 vq-blink" }),
          /* @__PURE__ */ jsx("span", { className: "text-3xs font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400", children: "Live Sync" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex", children: [
        /* @__PURE__ */ jsx("div", { className: "hidden sm:flex flex-col items-center gap-4 py-5 px-3 border-r border-slate-900/[0.08] dark:border-white/[0.06] bg-white/[0.015]", children: railIcons.map((Ic, i) => /* @__PURE__ */ jsx("div", { className: `w-9 h-9 rounded-xl flex items-center justify-center ${i === 0 ? "bg-indigo-500/20 text-indigo-300" : "text-slate-600"}`, children: /* @__PURE__ */ jsx(Ic, { size: 16 }) }, i)) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 p-4 sm:p-5 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xs font-black uppercase tracking-[0.25em] text-slate-500", children: "VenQore" }),
              /* @__PURE__ */ jsx("div", { className: "text-lg font-black text-slate-900 dark:text-white tracking-tight", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: "Dashboard" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-400/20", children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 12, className: "text-violet-300" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xs font-bold text-violet-200", children: "AI Insight" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-slate-900/[0.02] dark:bg-white/[0.02] p-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300", children: /* @__PURE__ */ jsx(TrendingUp, { size: 14 }) }),
                /* @__PURE__ */ jsx("span", { className: "text-2xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Performance" }),
                /* @__PURE__ */ jsxs("span", { className: "ml-auto inline-flex items-center gap-1 text-3xs font-bold text-slate-500", children: [
                  "Month ",
                  /* @__PURE__ */ jsx(ChevronDown, { size: 10 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 relative", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-0 bottom-0 w-px bg-slate-900/[0.08] dark:bg-white/[0.06]" }),
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-3xs uppercase font-bold text-slate-500 mb-0.5 tracking-wider", children: "Sales" }),
                  /* @__PURE__ */ jsxs("div", { className: "text-sm font-black text-slate-900 dark:text-white tabular-nums", children: [
                    "$",
                    /* @__PURE__ */ jsx(AnimCounter, { end: 1245670, group: true, duration: 2200 })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-3xs uppercase font-bold text-slate-500 mb-0.5 tracking-wider", children: "Gross Profit" }),
                  /* @__PURE__ */ jsxs("div", { className: "text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums", children: [
                    "$",
                    /* @__PURE__ */ jsx(AnimCounter, { end: 772315, group: true, duration: 2400 })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-slate-900/[0.02] dark:bg-white/[0.02] p-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2.5", children: [
                /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-lg bg-orange-500/15 text-orange-300", children: /* @__PURE__ */ jsx(CreditCard, { size: 14 }) }),
                /* @__PURE__ */ jsx("span", { className: "text-2xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Outstanding" }),
                /* @__PURE__ */ jsxs("span", { className: "ml-auto inline-flex items-center gap-1 text-3xs font-bold text-slate-500", children: [
                  "Month ",
                  /* @__PURE__ */ jsx(ChevronDown, { size: 10 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 relative", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-0 bottom-0 w-px bg-slate-900/[0.08] dark:bg-white/[0.06]" }),
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-3xs uppercase font-bold text-slate-500 mb-0.5 tracking-wider", children: "To Receive" }),
                  /* @__PURE__ */ jsxs("div", { className: "text-sm font-black text-slate-900 dark:text-white tabular-nums", children: [
                    "$",
                    /* @__PURE__ */ jsx(AnimCounter, { end: 84200, group: true, duration: 2200 })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-3xs uppercase font-bold text-slate-500 mb-0.5 tracking-wider", children: "To Pay" }),
                  /* @__PURE__ */ jsxs("div", { className: "text-sm font-black text-slate-900 dark:text-white tabular-nums", children: [
                    "$",
                    /* @__PURE__ */ jsx(AnimCounter, { end: 51940, group: true, duration: 2400 })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-slate-900/[0.02] dark:bg-white/[0.02] p-3 relative overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute -right-3 -top-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2.5 relative", children: [
                /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300", children: /* @__PURE__ */ jsx(Wallet, { size: 14 }) }),
                /* @__PURE__ */ jsx("span", { className: "text-2xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Net Profit" }),
                /* @__PURE__ */ jsxs("span", { className: "ml-auto inline-flex items-center gap-1 text-3xs font-bold text-slate-500", children: [
                  "Month ",
                  /* @__PURE__ */ jsx(ChevronDown, { size: 10 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 relative", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute left-1/2 top-0 bottom-0 w-px bg-slate-900/[0.08] dark:bg-white/[0.06]" }),
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-3xs uppercase font-bold text-slate-500 mb-0.5 tracking-wider", children: "Status" }),
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-black text-emerald-600 dark:text-emerald-400", children: "Healthy" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-3xs uppercase font-bold text-slate-500 mb-0.5 tracking-wider", children: "Net" }),
                  /* @__PURE__ */ jsxs("div", { className: "text-sm font-black text-slate-900 dark:text-white tabular-nums", children: [
                    "$",
                    /* @__PURE__ */ jsx(AnimCounter, { end: 184920, group: true, duration: 2400 })
                  ] })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-5 gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "lg:col-span-3 rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-white/[0.015] p-3.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3 flex-wrap gap-2", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300", children: /* @__PURE__ */ jsx(TrendingUp, { size: 14 }) }),
                  /* @__PURE__ */ jsx("span", { className: "text-[13px] font-bold text-slate-900 dark:text-white", children: "Revenue Analytics" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex bg-slate-900/[0.035] dark:bg-white/[0.04] p-0.5 rounded-lg", children: ["Today", "Month", "Year"].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setRevTab(t), className: `px-2.5 py-0.5 text-2xs font-bold rounded-md transition-all ${revTab === t ? "bg-slate-900/[0.05] dark:bg-white/10 text-indigo-300" : "text-slate-500 hover:text-slate-300"}`, children: t }, t)) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-1xs", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-indigo-500" }),
                  /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-500 dark:text-slate-400", children: "Sales" })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-1xs", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500" }),
                  /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-500 dark:text-slate-400", children: "Gross Profit" })
                ] })
              ] }),
              /* @__PURE__ */ jsx(RevenueChart, { height: 168, tab: revTab, reduced })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-void-800 p-3.5 relative overflow-hidden", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute -right-10 -top-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" }),
              /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-between mb-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-slate-900/[0.05] dark:bg-white/10 flex items-center justify-center", children: /* @__PURE__ */ jsx(Wallet, { size: 15, className: "text-slate-900 dark:text-white" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { className: "text-3xs text-slate-500 dark:text-slate-400 font-medium", children: "Total Balance" }),
                    /* @__PURE__ */ jsxs("div", { className: "text-sm font-black text-slate-900 dark:text-white tabular-nums", children: [
                      "$",
                      /* @__PURE__ */ jsx(AnimCounter, { end: 328400, group: true, duration: 2400 })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(MoreHorizontal, { size: 16, className: "text-slate-500" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative grid grid-cols-3 gap-1.5 mb-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300", children: [
                  /* @__PURE__ */ jsx(ArrowDownRight, { size: 14 }),
                  /* @__PURE__ */ jsx("span", { className: "text-4xs font-black tracking-wider", children: "SALE" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-orange-500/10 border border-orange-500/40 text-orange-300", children: [
                  /* @__PURE__ */ jsx(ArrowUpRight, { size: 14 }),
                  /* @__PURE__ */ jsx("span", { className: "text-4xs font-black tracking-wider", children: "PURCHASE" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-1 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/40 text-indigo-300", children: [
                  /* @__PURE__ */ jsx(Plus, { size: 14 }),
                  /* @__PURE__ */ jsx("span", { className: "text-4xs font-black tracking-wider", children: "ACTIONS" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative grid grid-cols-2 gap-1.5 mb-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-slate-900/[0.035] dark:bg-white/[0.04] border border-slate-900/[0.08] dark:border-white/10 p-2.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-1", children: [
                    /* @__PURE__ */ jsx(Wallet, { size: 12, className: "text-emerald-300" }),
                    /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-600 dark:text-slate-300", children: "Cash" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-[12px] font-black text-slate-900 dark:text-white tabular-nums", children: [
                    "$",
                    /* @__PURE__ */ jsx(AnimCounter, { end: 142300, group: true, duration: 2200 })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-2.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-1", children: [
                    /* @__PURE__ */ jsx(Package, { size: 12, className: "text-indigo-300" }),
                    /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-600 dark:text-slate-300", children: "Stock Value" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-[12px] font-black text-slate-900 dark:text-white tabular-nums", children: [
                    "$",
                    /* @__PURE__ */ jsx(AnimCounter, { end: 486100, group: true, duration: 2400 })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative rounded-xl bg-black/30 border border-slate-900/[0.06] dark:border-white/5 p-2.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400", children: "Activity" }),
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-4xs text-slate-500", children: [
                    /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-blue-500" }),
                      "Sale"
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-500" }),
                      "Buy"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(ActivityFeed, {})
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "hidden lg:grid grid-cols-5 gap-3 mt-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "col-span-3 rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-white/[0.015] p-3.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
                /* @__PURE__ */ jsx("span", { className: "w-1.5 h-4 rounded-full bg-emerald-500" }),
                /* @__PURE__ */ jsx("span", { className: "text-[13px] font-bold text-slate-900 dark:text-white", children: "Top Products" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-1", children: [["🥤", "Cola 500ml", "Beverages", "312", "$1,840"], ["🍫", "Dark Choco", "Snacks", "268", "$1,210"], ["🧴", "Hand Wash", "Care", "190", "$980"]].map((r, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-1.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-slate-900/[0.03] dark:bg-white/5 border border-slate-900/[0.08] dark:border-white/10 flex items-center justify-center text-sm", children: r[0] }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-[12px] font-bold text-slate-200 truncate", children: r[1] }),
                    /* @__PURE__ */ jsx("div", { className: "text-3xs text-slate-500", children: r[2] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 shrink-0", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-2xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-900/[0.03] dark:bg-white/5 px-1.5 py-0.5 rounded", children: r[3] }),
                  /* @__PURE__ */ jsx("span", { className: "text-[12px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums w-14 text-right", children: r[4] })
                ] })
              ] }, i)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-2 rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-white/[0.015] p-3.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
                /* @__PURE__ */ jsx("span", { className: "w-1.5 h-4 rounded-full bg-red-500" }),
                /* @__PURE__ */ jsx("span", { className: "text-[13px] font-bold text-slate-900 dark:text-white", children: "Low Stock Alerts" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-2", children: [["SKU-492 · Alpha 12", "5", "20"], ["SKU-781 · Beta 4", "8", "25"]].map((r, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 rounded-xl bg-red-500/[0.06] border border-red-500/15", children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-1xs font-bold text-slate-200 truncate", children: r[0] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-3xs text-red-400 font-bold", children: [
                    "Stock: ",
                    r[1],
                    " / ",
                    r[2]
                  ] })
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-3xs font-black text-slate-500 dark:text-slate-400 bg-slate-900/[0.03] dark:bg-white/5 px-2 py-1 rounded-lg", children: "Order" })
              ] }, i)) })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
const ScanToJournal = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView(0.4);
  const [stage, setStage] = useState(reduced ? 3 : 0);
  useEffect(() => {
    if (reduced || !inView) return;
    const t = setInterval(() => setStage((s) => (s + 1) % 4), 1400);
    return () => clearInterval(t);
  }, [reduced, inView]);
  const active = (s) => stage >= s;
  return /* @__PURE__ */ jsxs("div", { ref, className: "grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 lg:gap-10 items-center", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: `relative w-40 h-28 rounded-2xl border flex items-center justify-center transition-all duration-500 ${active(0) ? "border-indigo-400/40 bg-indigo-500/10" : "border-slate-900/[0.08] dark:border-white/10 bg-slate-900/[0.02] dark:bg-white/[0.02]"}`, children: [
        /* @__PURE__ */ jsx("svg", { viewBox: "0 0 120 60", className: "w-28 h-14", children: [4, 10, 13, 20, 26, 30, 38, 44, 48, 56, 62, 66, 74, 80, 86, 94, 100, 106, 112].map((x, i) => /* @__PURE__ */ jsx(
          "rect",
          {
            x,
            y: "8",
            width: i % 3 === 0 ? 3.5 : 1.8,
            height: "44",
            fill: active(0) ? vq.indigo[200] : vq.slate[600],
            className: "transition-colors duration-500"
          },
          i
        )) }),
        !reduced && active(0) && /* @__PURE__ */ jsx("div", { className: "absolute left-2 right-2 h-0.5 bg-rose-400 shadow-[0_0_12px_2px_rgba(251,113,133,0.8)] vq-scanline" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "text-2xs font-black uppercase tracking-[0.25em] text-slate-500", children: "Barcode Scan" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("div", { className: "hidden lg:flex absolute -left-8 top-1/2 -translate-y-1/2 text-slate-600", children: /* @__PURE__ */ jsx(ArrowRight, { size: 22, className: `transition-all duration-500 ${active(1) ? "text-indigo-600 dark:text-indigo-400 translate-x-1" : ""}` }) }),
      /* @__PURE__ */ jsxs(Glass, { className: `p-5 transition-all duration-700 ${active(2) ? "opacity-100 translate-y-0" : "opacity-40 translate-y-2"}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-2xs font-black uppercase tracking-[0.22em] text-slate-500", children: "Journal Entry · Auto-posted" }),
          /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-3xs font-black uppercase tracking-wider transition-all duration-500 ${active(3) ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-900/[0.03] dark:bg-white/5 text-slate-600"}`, children: [
            /* @__PURE__ */ jsx(CheckCircle2, { size: 11 }),
            " ",
            active(3) ? "Balanced" : "Posting…"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 font-mono text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400", children: "Debit" }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-200", children: [
              /* @__PURE__ */ jsx("span", { children: "Cash" }),
              /* @__PURE__ */ jsx("span", { className: "tabular-nums", children: "1,250.00" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-200", children: [
              /* @__PURE__ */ jsx("span", { children: "COGS" }),
              /* @__PURE__ */ jsx("span", { className: "tabular-nums", children: "742.50" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("div", { className: "text-3xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400", children: "Credit" }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-200", children: [
              /* @__PURE__ */ jsx("span", { children: "Revenue + VAT" }),
              /* @__PURE__ */ jsx("span", { className: "tabular-nums", children: "1,250.00" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-slate-200", children: [
              /* @__PURE__ */ jsx("span", { children: "Inventory (FIFO)" }),
              /* @__PURE__ */ jsx("span", { className: "tabular-nums", children: "742.50" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 pt-3 border-t border-slate-900/[0.08] dark:border-white/[0.06] flex items-center justify-between text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-bold uppercase tracking-wider", children: "Σ Debits = Σ Credits" }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-emerald-300 tabular-nums", children: "1,992.50 = 1,992.50" })
        ] })
      ] })
    ] })
  ] });
};
const INTEGRITY = [
  { t: "Journal Integrity", d: "One controlled gateway. Direct DB tampering blocked at the system level." },
  { t: "Live Balances", d: "Computed from raw entries — never cached numbers that drift out of sync." },
  { t: "Unified Engine", d: "Dashboard, P&L and balance sheet read one source. They always agree." },
  { t: "Scenario Testing", d: "13 end-to-end real-world flows verified automatically on every release." },
  { t: "Statement Alignment", d: "Summary figures reconciled to the general ledger, down to the cent." }
];
const IntegrityPipeline = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView(0.3);
  return /* @__PURE__ */ jsxs("div", { ref, className: "relative", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute left-0 right-0 top-7 h-0.5 bg-slate-900/[0.08] dark:bg-white/[0.06] hidden md:block", children: /* @__PURE__ */ jsx(
      "div",
      {
        className: "h-full bg-gradient-to-r from-indigo-500 via-violet-400 to-cyan-400 origin-left transition-transform duration-[2200ms] ease-out",
        style: { transform: `scaleX(${reduced ? 1 : inView ? 1 : 0})` }
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-3 relative", children: INTEGRITY.map((n, i) => /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsxs("div", { className: "flex md:flex-col items-center md:items-start gap-4 md:gap-0", children: [
      /* @__PURE__ */ jsxs(
        "div",
        {
          className: `relative z-10 w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 md:mb-5 transition-all duration-700 ${reduced || inView ? "bg-indigo-500/15 border-indigo-400/40 text-indigo-200" : "bg-slate-900/[0.02] dark:bg-white/[0.02] border-slate-900/[0.08] dark:border-white/10 text-slate-600"}`,
          style: { transitionDelay: reduced ? "0s" : `${i * 0.28}s` },
          children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg font-black", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: i + 1 }),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center transition-all duration-500 ${reduced || inView ? "scale-100 opacity-100" : "scale-0 opacity-0"}`,
                style: { transitionDelay: reduced ? "0s" : `${i * 0.28 + 0.4}s` },
                children: /* @__PURE__ */ jsx(Check, { size: 11, className: "text-void-900", strokeWidth: 4 })
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "text-2xs font-black uppercase tracking-[0.18em] text-slate-500 mb-1", children: [
          "Layer ",
          i + 1
        ] }),
        /* @__PURE__ */ jsx("h4", { className: "text-slate-900 dark:text-white font-bold text-[15px] tracking-tight mb-1.5", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: n.t }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-[12.5px] leading-relaxed", children: n.d })
      ] })
    ] }) }, i)) })
  ] });
};
const AI_QA = [
  {
    q: "Which customers are about to churn?",
    type: "bars",
    head: "3 high-value accounts dropped 40%+ in order frequency.",
    rows: [["Khan Traders", 82], ["Bilal Mart", 67], ["Noor Wholesale", 54]],
    unit: "% churn risk"
  },
  {
    q: "What will I run out of next week?",
    type: "bars",
    head: "5 SKUs breach safety stock by Tuesday — draft POs ready.",
    rows: [["SKU-492 · Alpha 12", 12], ["SKU-781 · Beta 4", 24], ["SKU-118 · Core", 38]],
    unit: "days of cover"
  },
  {
    q: "Show me last month’s net profit.",
    type: "stat",
    head: "Net profit $184,920 — gross margin 62%, opex $110K.",
    stat: ["$184,920", "+12.6% vs prior month"]
  }
];
const AIChatDemo = () => {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView(0.3);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState("answer");
  useEffect(() => {
    if (reduced || !inView) return;
    let toType, toNext;
    const cycle = () => {
      setPhase("typing");
      toType = setTimeout(() => setPhase("answer"), 1100);
      toNext = setTimeout(() => {
        setIdx((i) => (i + 1) % AI_QA.length);
        cycle();
      }, 4600);
    };
    toNext = setTimeout(cycle, 3200);
    return () => {
      clearTimeout(toType);
      clearTimeout(toNext);
    };
  }, [reduced, inView]);
  const cur = AI_QA[idx];
  return /* @__PURE__ */ jsx("div", { ref, children: /* @__PURE__ */ jsxs(Glass, { className: "p-5 sm:p-6", glow: true, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-900/[0.08] dark:border-white/[0.06]", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Bot, { size: 16, className: "text-violet-300" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-black text-slate-900 dark:text-white tracking-tight", children: "VenQore Assistant" }),
        /* @__PURE__ */ jsxs("div", { className: "text-2xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 vq-blink" }),
          " Reading your ledger"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end mb-4", children: /* @__PURE__ */ jsx("div", { className: "vq-row-in max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-indigo-500/15 border border-indigo-400/20 text-indigo-50 text-sm font-medium", children: cur.q }, `q${idx}`) }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-start", children: phase === "typing" && !reduced ? /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-900/[0.035] dark:bg-white/[0.04] border border-slate-900/[0.08] dark:border-white/[0.06] flex items-center gap-1.5", children: [
      /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-slate-400 vq-dot" }),
      /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-slate-400 vq-dot", style: { animationDelay: "0.15s" } }),
      /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-slate-400 vq-dot", style: { animationDelay: "0.3s" } })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "vq-row-in max-w-[92%] w-full px-4 py-3.5 rounded-2xl rounded-tl-sm bg-slate-900/[0.035] dark:bg-white/[0.04] border border-slate-900/[0.08] dark:border-white/[0.06]", children: [
      /* @__PURE__ */ jsx("p", { className: "text-slate-200 text-sm font-medium mb-3", children: cur.head }),
      cur.type === "bars" && /* @__PURE__ */ jsxs("div", { className: "space-y-2.5", children: [
        cur.rows.map(([name, val], i) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-1xs mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-500 dark:text-slate-400 font-semibold", children: name }),
            /* @__PURE__ */ jsxs("span", { className: "text-slate-500 tabular-nums", children: [
              val,
              cur.unit.includes("%") ? "%" : "d"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-1.5 rounded-full bg-slate-900/[0.08] dark:bg-white/[0.06] overflow-hidden", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "h-full rounded-full bg-gradient-to-r from-violet-500 to-rose-400 origin-left",
              style: { transform: `scaleX(${reduced ? 1 : phase === "answer" ? Math.min(1, val / 100 + 0.12) : 0})`, transition: "transform 1s cubic-bezier(0.22,1,0.36,1)", transitionDelay: `${i * 0.12}s` }
            }
          ) })
        ] }, i)),
        /* @__PURE__ */ jsx("div", { className: "text-2xs font-black uppercase tracking-widest text-slate-600 pt-1", children: cur.unit })
      ] }),
      cur.type === "stat" && /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "text-3xl font-black text-slate-900 dark:text-white", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: cur.stat[0] }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1", children: cur.stat[1] })
      ] })
    ] }, `a${idx}`) })
  ] }) });
};
const MODULES = [
  { ic: Truck, n: "Procurement", d: "POs, supplier credit & intake" },
  { ic: ShoppingCart, n: "POS Checkout", d: "Barcode-fast, keyboard-first" },
  { ic: Receipt, n: "Invoicing & Billing", d: "Wholesale, quotes & pre-sales" },
  { ic: Wallet, n: "Customer Khata", d: "Balances & payment histories" },
  { ic: Banknote, n: "Expense Manager", d: "Overheads & supplier charges" },
  { ic: Warehouse, n: "Multi-Warehouse", d: "Transfers across godowns" },
  { ic: Package, n: "Variant Factory", d: "Color, size, weight & serial" },
  { ic: Factory, n: "Manufacturing", d: "Recipe-based assembly & BOM" },
  { ic: ShieldCheck, n: "SuperAdmin", d: "Platform-wide command center" },
  { ic: BarChart3, n: "Report Factory", d: "40+ reports on demand" },
  { ic: Users, n: "Workforce & Security", d: "Logins, shifts & audit logs" },
  { ic: Globe, n: "E-Commerce Sync", d: "WooCommerce & marketplaces" }
];
const ModuleCard = ({ m, delay }) => /* @__PURE__ */ jsx(Reveal, { delay, children: /* @__PURE__ */ jsxs("div", { className: "group relative h-full p-5 rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-slate-900/[0.02] dark:bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-400/25 transition-all duration-500 hover:-translate-y-1 overflow-hidden", children: [
  /* @__PURE__ */ jsx(
    "div",
    {
      className: "pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500",
      style: { background: "radial-gradient(220px circle at var(--mx,50%) var(--my,0%), rgba(129,140,248,0.12), transparent 70%)" }
    }
  ),
  /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
    /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-xl bg-indigo-500/12 text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500", children: /* @__PURE__ */ jsx(m.ic, { size: 20 }) }),
    /* @__PURE__ */ jsx("h4", { className: "text-slate-900 dark:text-white font-bold text-[15px] tracking-tight mb-1", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: m.n }),
    /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-[12.5px] leading-snug", children: m.d })
  ] })
] }) });
const FaqItem = ({ q, a, open, onClick }) => /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-900/[0.08] dark:border-white/[0.07]", children: [
  /* @__PURE__ */ jsxs("button", { onClick, className: "w-full py-6 flex items-center justify-between text-left group gap-6", children: [
    /* @__PURE__ */ jsx("span", { className: "text-[17px] font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-300 transition-colors", children: q }),
    /* @__PURE__ */ jsx("span", { className: `shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${open ? "rotate-180 border-indigo-400/40 bg-indigo-500/10 text-indigo-300" : "border-slate-900/[0.08] dark:border-white/10 text-slate-600"}`, children: /* @__PURE__ */ jsx(ChevronDown, { size: 16 }) })
  ] }),
  /* @__PURE__ */ jsx("div", { className: `overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "max-h-72 pb-6 opacity-100" : "max-h-0 opacity-0"}`, children: /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 leading-relaxed text-[15px] max-w-3xl", children: a }) })
] });
function LandingPage() {
  const { props } = usePage();
  const settings = props.settings || {};
  const appName = settings.app_name || "VenQore";
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("idle");
  const [newsletterMsg, setNewsletterMsg] = useState("");
  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterStatus("loading");
    setNewsletterMsg("");
    try {
      await axios.post("/subscribe", { email: newsletterEmail, interest: "cloud" });
      setNewsletterStatus("success");
      setNewsletterMsg("Awesome! You have successfully subscribed to our newsletter.");
      setNewsletterEmail("");
    } catch (err) {
      setNewsletterStatus("error");
      setNewsletterMsg(err.response?.data?.errors?.email?.[0] || err.response?.data?.message || "Subscription failed.");
    }
  };
  useEffect(() => {
    setHeroLoaded(true);
  }, []);
  const marquee = ["Retail", "Grocery", "Food & Beverage", "Fashion", "Electronics", "Wholesale", "Pharmacy", "Hardware"];
  const aiBrains = [
    { ic: Repeat, t: "Return Predictor", d: "Forecasts when each customer is due back — so promos land before they lapse.", tone: "indigo" },
    { ic: Boxes, t: "Stock Forecaster", d: "Projects depletion per SKU and drafts purchase orders before you stock out.", tone: "cyan" },
    { ic: AlertTriangle, t: "Churn Detector", d: "Flags high-value accounts losing momentum while there is still time to act.", tone: "rose" }
  ];
  const reports = [
    "Profit & Loss",
    "Balance Sheet",
    "Cash Flow",
    "Trial Balance",
    "Aged Receivables",
    "Stock Valuation",
    "Item-Wise Profit",
    "Day Book"
  ];
  const faqs = [
    { q: "Is VenQore a POS or an accounting system?", a: "Both — and they are the same system, not two apps synced together. The POS posts double-entry journal entries as it runs; the accounting module reads those exact entries to produce auditor-grade statements. No integration layer to drift." },
    { q: "Do I need an accountant to use it?", a: "No. VenQore handles the double-entry mechanics automatically. Every sale, purchase, return, transfer and adjustment writes the correct balanced entry. Your accountant can verify the output — they just won’t need to create it by hand." },
    { q: "How long does setup take?", a: "The Instant Store Creator needs only your store name, then seeds units, taxes and categories for your industry. Most businesses are live in 10–15 minutes, and full historical data can be imported the same day." },
    { q: "Will it work across multiple stores?", a: "Yes. The Multi-Store Hub switches between branches in one click, and granular roles let you be Owner in one store, Manager in another and read-only Viewer in a third — all from a single account." },
    { q: "How accurate is the financial engine, really?", a: "It runs on a DECIMAL(20,4) double-entry core verified by 1,500+ automated tests, 4,000+ integrity checks and 13 end-to-end scenarios. Dashboard figures reconcile to the general ledger down to the cent." },
    { q: "What happens to my data if I cancel?", a: "It’s yours. Export it at any time via the import/export tools. We never hold your data hostage." }
  ];
  return (
    /* The landing page now wears the same shell as every other public
       page — same minimal header, same dropdowns, same footer sitemap.
       MarketingLayout also supplies the scroll progress bar, ambient
       gradient, particle field and spotlight, so the local copies of
       those are no longer rendered here. */
    /* @__PURE__ */ jsxs(
      MarketingLayout,
      {
        title: `${appName} — The Books Are Always Right.`,
        description: "VenQore is the all-in-one POS & ERP built on a real double-entry engine. Every sale, purchase, return and transfer posts a correct journal entry — automatically. 226+ features, 40+ reports, AI growth engine.",
        children: [
          /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("section", { className: "relative px-6 pt-32 md:pt-40 pb-20", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto text-center", children: [
              /* @__PURE__ */ jsxs("div", { className: `transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`, children: [
                /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900/[0.035] dark:bg-white/[0.04] border border-slate-900/[0.08] dark:border-white/10 backdrop-blur-md text-2xs font-black tracking-[0.3em] uppercase mb-10", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 vq-blink" }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-600 dark:text-slate-300", children: "226+ Features · One Source of Truth" })
                ] }),
                /* @__PURE__ */ jsxs("h1", { className: "mb-8 leading-[0.86]", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-[2.75rem] xs:text-[3.25rem] sm:text-7xl lg:text-[8.5rem] font-black tracking-tighter text-slate-900 dark:text-white hero-rise", children: "The last software" }),
                  /* @__PURE__ */ jsx("span", { className: "block text-[2.75rem] xs:text-[3.25rem] sm:text-7xl lg:text-[8.5rem] font-black tracking-tighter -mt-1 md:-mt-4 hero-rise-d", children: /* @__PURE__ */ jsx("span", { className: "vq-headline-grad vq-text-glow", children: "your business will need." }) })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-lg md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10 font-medium hero-fade", children: "Ring up sales, track stock, and see exact profits in real time, all without touching a spreadsheet or opening a ledger." }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 mb-5 hero-fade-2", children: [
                  /* @__PURE__ */ jsxs(MagBtn, { href: "/register", variant: "primary", children: [
                    "Start Free Trial ",
                    /* @__PURE__ */ jsx(ArrowRight, { size: 18, className: "group-hover/btn:translate-x-1 transition-transform" })
                  ] }),
                  /* @__PURE__ */ jsxs(MagBtn, { href: "/demo", variant: "ghost", children: [
                    /* @__PURE__ */ jsx(Play, { size: 15, fill: "currentColor" }),
                    " Launch Live Demo"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-1xs font-bold uppercase tracking-[0.2em] text-slate-600 mb-16 hero-fade-2", children: "14-day free trial · No credit card · Live in 15 minutes" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: `transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] delay-200 ${heroLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`, children: /* @__PURE__ */ jsx(HeroDashboard, {}) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-20 max-w-5xl mx-auto", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-black uppercase tracking-[0.3em] text-slate-600 mb-6", children: "Built for real businesses" }),
                /* @__PURE__ */ jsx("div", { className: "relative overflow-hidden vq-marquee-mask", children: /* @__PURE__ */ jsx("div", { className: "flex gap-10 vq-marquee whitespace-nowrap", children: [...marquee, ...marquee].map((m, i) => /* @__PURE__ */ jsx("span", { className: "text-lg font-black text-slate-700 uppercase tracking-wider shrink-0", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: m }, i)) }) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
              /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "text-center max-w-3xl mx-auto mb-14", children: [
                /* @__PURE__ */ jsx(Eyebrow, { icon: AlertTriangle, tone: "rose", children: "The Uncomfortable Truth" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-slate-900 dark:text-white mb-7 leading-[0.9]", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "Wrong numbers",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-rose-500 to-amber-500 dark:from-rose-400 dark:to-amber-400 bg-clip-text text-transparent italic", children: "have a price." })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-medium", children: [
                  "Your revenue includes tax you owe the government. Your profit uses a cost that was overwritten three purchases ago. Nobody sends you an invoice for that —",
                  /* @__PURE__ */ jsx("span", { className: "text-slate-900 dark:text-white font-semibold", children: " so here is what it actually costs." })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx(Reveal, { delay: 0.08, children: /* @__PURE__ */ jsx(TrueCostCalculator, {}) }),
              /* @__PURE__ */ jsxs("div", { className: "mt-24 md:mt-32", children: [
                /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "text-center max-w-2xl mx-auto mb-12", children: [
                  /* @__PURE__ */ jsx(Eyebrow, { icon: Repeat, tone: "amber", children: "Watch it happen" }),
                  /* @__PURE__ */ jsxs("h3", { className: "text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.95]", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                    "One sale.",
                    /* @__PURE__ */ jsx("br", {}),
                    /* @__PURE__ */ jsx("span", { className: "text-amber-500 dark:text-amber-400", children: "Two very different stories." })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 mt-5 leading-relaxed", children: "A single $115 transaction, posted by both systems at the same time." })
                ] }) }),
                /* @__PURE__ */ jsx(Reveal, { delay: 0.08, children: /* @__PURE__ */ jsx(SameSaleSplit, {}) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-24 md:mt-32 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center", children: [
                /* @__PURE__ */ jsxs(Reveal, { direction: "right", className: "lg:col-span-5", children: [
                  /* @__PURE__ */ jsx(Eyebrow, { icon: ShieldCheck, tone: "emerald", children: "The engine underneath" }),
                  /* @__PURE__ */ jsxs("h3", { className: "text-3xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.95] mb-6", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                    "Debits equal credits.",
                    /* @__PURE__ */ jsx("br", {}),
                    /* @__PURE__ */ jsx("span", { className: "text-emerald-500 dark:text-emerald-400", children: "Always." })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-slate-600 dark:text-slate-400 leading-relaxed mb-6", children: "Every sale, purchase, return, transfer and payment writes a balanced journal entry the instant it happens. Not at month end. Not after an export. Immediately — and the entry is immutable, so a correction posts a reversal instead of quietly rewriting history." }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3", children: [
                    /* @__PURE__ */ jsxs(Link, { href: "/features/accounting", className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/[0.05] dark:bg-white/[0.06] border border-slate-900/10 dark:border-white/10 text-2xs font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200 hover:bg-slate-900/[0.09] dark:hover:bg-white/[0.1] transition-colors", children: [
                      "How the ledger works ",
                      /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                    ] }),
                    /* @__PURE__ */ jsxs(Link, { href: "/features/inventory-management", className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900/[0.05] dark:bg-white/[0.06] border border-slate-900/10 dark:border-white/10 text-2xs font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200 hover:bg-slate-900/[0.09] dark:hover:bg-white/[0.1] transition-colors", children: [
                      "FIFO costing ",
                      /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(Reveal, { direction: "left", delay: 0.1, className: "lg:col-span-7", children: /* @__PURE__ */ jsx(LedgerTape, {}) })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
              /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-14", children: [
                /* @__PURE__ */ jsx(Eyebrow, { icon: ScanBarcode, children: "How it works" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "One scan becomes",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "text-indigo-600 dark:text-indigo-400", children: "balanced accounting." })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-lg max-w-2xl mx-auto mt-6", children: "No exports. No month-end reconstruction. The instant an item is scanned, a correct double-entry posts — and your statements update live." })
              ] }) }),
              /* @__PURE__ */ jsx(Reveal, { delay: 0.12, children: /* @__PURE__ */ jsx(Glass, { className: "p-8 md:p-12", children: /* @__PURE__ */ jsx(ScanToJournal, {}) }) })
            ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
              /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-16", children: [
                /* @__PURE__ */ jsx(Eyebrow, { icon: ShieldCheck, tone: "emerald", children: "Financial Verification" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "Five layers between you",
                  /* @__PURE__ */ jsx("br", {}),
                  "and a wrong number."
                ] })
              ] }) }),
              /* @__PURE__ */ jsx(Reveal, { delay: 0.1, children: /* @__PURE__ */ jsx(IntegrityPipeline, {}) }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto", children: [
                { e: 1500, s: "+", l: "Automated Tests", g: true },
                { e: 4e3, s: "+", l: "Integrity Checks", g: true },
                { e: 13, s: "", l: "E2E Scenarios" },
                { e: 4, s: "", l: "Decimal Precision", disp: "DECIMAL(20,4)" }
              ].map((s, i) => /* @__PURE__ */ jsx(Reveal, { delay: 0.08 * i, children: /* @__PURE__ */ jsxs("div", { className: "text-center p-6 rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-slate-900/[0.02] dark:bg-white/[0.02]", children: [
                /* @__PURE__ */ jsx("div", { className: "text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-1 tracking-tight", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: s.disp ? /* @__PURE__ */ jsx("span", { className: "text-base md:text-lg", children: s.disp }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(AnimCounter, { end: s.e, group: s.g }),
                  s.s
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "text-2xs text-slate-600 font-black uppercase tracking-[0.18em]", children: s.l })
              ] }) }, i)) })
            ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center", children: [
              /* @__PURE__ */ jsxs(Reveal, { direction: "right", children: [
                /* @__PURE__ */ jsx(Eyebrow, { icon: Cpu, tone: "violet", children: "AI Growth Engine" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-6", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "Ask your business",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "text-violet-400", children: "anything." })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-8 max-w-xl", children: "A context-aware assistant reads your live ledger and answers in plain English — no spreadsheets, no SQL. Behind it, three models work continuously so you act before problems do." }),
                /* @__PURE__ */ jsx("div", { className: "space-y-3", children: aiBrains.map((b, i) => /* @__PURE__ */ jsx(Reveal, { delay: 0.08 * i, direction: "right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 p-4 rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-slate-900/[0.02] dark:bg-white/[0.02] hover:bg-white/[0.04] transition-colors", children: [
                  /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${b.tone === "indigo" ? "bg-indigo-500/15 text-indigo-300" : b.tone === "cyan" ? "bg-cyan-500/15 text-cyan-300" : "bg-rose-500/15 text-rose-300"}`, children: /* @__PURE__ */ jsx(b.ic, { size: 18 }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h3", { className: "text-slate-900 dark:text-white font-bold tracking-tight", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: b.t }),
                    /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm leading-snug", children: b.d })
                  ] })
                ] }) }, i)) })
              ] }),
              /* @__PURE__ */ jsx(Reveal, { delay: 0.15, direction: "left", children: /* @__PURE__ */ jsx(AIChatDemo, {}) })
            ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
              /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-14", children: [
                /* @__PURE__ */ jsx(Eyebrow, { icon: Layers, children: "One platform, twelve engines" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "Every part of the business,",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "text-indigo-600 dark:text-indigo-400", children: "one connected system." })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-lg max-w-2xl mx-auto mt-6", children: "From the counter to the godown to the general ledger — twelve modules, no integrations, nothing to sync." })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4", children: MODULES.map((m, i) => /* @__PURE__ */ jsx(ModuleCard, { m, delay: i % 4 * 0.06 }, m.n)) }),
              /* @__PURE__ */ jsx(Reveal, { delay: 0.15, children: /* @__PURE__ */ jsx("div", { className: "text-center mt-12", children: /* @__PURE__ */ jsxs(MagBtn, { href: "/features", variant: "ghost", children: [
                "Explore all 226+ features ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 15 })
              ] }) }) })
            ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
              /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("div", { className: "text-center mb-12 max-w-3xl mx-auto", children: [
                /* @__PURE__ */ jsx(Eyebrow, { icon: Cpu, tone: "violet", children: "Qore — The Intelligence Core" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9]", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "One core.",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "vq-headline-grad", children: "Every module, in sync." })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-lg mt-6", children: "Qore is the engine at the centre of VenQore — continuously coordinating Sales, Inventory, Accounting, AI and every other module so your whole business runs on one live set of numbers." })
              ] }) }),
              /* @__PURE__ */ jsx(Reveal, { delay: 0.12, children: /* @__PURE__ */ jsx(Glass, { className: "p-6 md:p-10 overflow-hidden", glow: true, children: /* @__PURE__ */ jsx(QoreCore3D, {}) }) }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 max-w-4xl mx-auto", children: [
                { ic: RefreshCw, t: "Real-Time Sync", d: "WebSocket-fast, no reloads" },
                { ic: Network, t: "Every Module", d: "12 engines, one system" },
                { ic: ShieldCheck, t: "One Source of Truth", d: "Every number agrees" },
                { ic: Building2, t: "Multi-Store", d: "All branches, one view" }
              ].map((c, i) => /* @__PURE__ */ jsx(Reveal, { delay: 0.06 * i, children: /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-slate-900/[0.02] dark:bg-white/[0.02] text-center hover:border-indigo-400/25 hover:bg-white/[0.04] transition-all duration-500", children: [
                /* @__PURE__ */ jsx(c.ic, { size: 20, className: "text-indigo-300 mb-2 mx-auto" }),
                /* @__PURE__ */ jsx("h3", { className: "text-slate-900 dark:text-white font-bold text-[13px] tracking-tight mb-1", children: c.t }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-1xs leading-snug", children: c.d })
              ] }) }, i)) })
            ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto text-center", children: [
              /* @__PURE__ */ jsxs(Reveal, { children: [
                /* @__PURE__ */ jsx(Eyebrow, { icon: BarChart3, tone: "amber", children: "Report Factory" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-6", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "40+ reports.",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "text-amber-600 dark:text-amber-400", children: "One source of truth." })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-lg max-w-2xl mx-auto mb-12", children: "P&L, balance sheet and cash flow don’t come from separate calculators — they read the same verified ledger, so they always agree." })
              ] }),
              /* @__PURE__ */ jsx(Reveal, { delay: 0.1, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap justify-center gap-3", children: [
                reports.map((r, i) => /* @__PURE__ */ jsx("span", { className: "px-5 py-2.5 rounded-full border border-slate-900/[0.10] dark:border-white/[0.08] bg-slate-900/[0.02] dark:bg-white/[0.025] text-sm font-bold text-slate-600 dark:text-slate-300 hover:border-amber-400/30 hover:text-slate-900 dark:hover:text-white transition-colors", children: r }, r)),
                /* @__PURE__ */ jsx("span", { className: "px-5 py-2.5 rounded-full border border-amber-400/25 bg-amber-500/10 text-sm font-black text-amber-300", children: "+32 more" })
              ] }) })
            ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-20 px-6 border-y border-slate-900/[0.08] dark:border-white/[0.06] bg-white/[0.012]", children: /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10", children: [
              { e: 226, s: "+", l: "Platform Features" },
              { e: 40, s: "+", l: "Business Reports" },
              { e: 1500, s: "+", l: "Automated Tests", g: true },
              { e: 5, s: "", l: "Audit Layers" }
            ].map((s, i) => /* @__PURE__ */ jsx(Reveal, { delay: 0.07 * i, children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-2 vq-headline-grad", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                /* @__PURE__ */ jsx(AnimCounter, { end: s.e }),
                s.s
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-2xs md:text-1xs text-slate-500 font-black uppercase tracking-[0.22em]", children: s.l })
            ] }) }, i)) }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center", children: [
              /* @__PURE__ */ jsxs(Reveal, { direction: "right", children: [
                /* @__PURE__ */ jsx(Eyebrow, { icon: Users, children: "Built for operators" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 leading-[0.9]", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "Real results.",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "text-indigo-600 dark:text-indigo-400", children: "Real operators." })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-500 leading-relaxed mb-8 max-w-md", children: "We built VenQore for the operator who is done guessing. Here’s what changes when the numbers are finally right." }),
                /* @__PURE__ */ jsxs(MagBtn, { href: "/about", variant: "ghost", children: [
                  "Read our story ",
                  /* @__PURE__ */ jsx(ArrowRight, { size: 15 })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "space-y-5", children: [
                { t: "For the first time, my daily revenue matched what my accountant calculated at month-end. We’re not adjusting numbers anymore — they just come out right.", a: "Electronics Retailer · 3 locations" },
                { t: "We process 800+ transactions a day. Keyboard shortcuts and multi-tab checkout mean our cashiers never touch a mouse. Throughput went up 30%.", a: "Supermarket Operator" }
              ].map((q, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 0.12, direction: "left", children: /* @__PURE__ */ jsxs(Glass, { className: "p-7", children: [
                /* @__PURE__ */ jsx(Quote, { size: 26, className: "text-indigo-400/50 mb-4" }),
                /* @__PURE__ */ jsx("p", { className: "text-lg text-slate-200 leading-relaxed mb-5", children: q.t }),
                /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 mb-3", children: [...Array(5)].map((_, k) => /* @__PURE__ */ jsx("span", { className: "text-amber-600 dark:text-amber-400", children: "★" }, k)) }),
                /* @__PURE__ */ jsx("div", { className: "text-1xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]", children: q.a })
              ] }) }, i)) })
            ] }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsx("div", { className: "max-w-5xl mx-auto", children: /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs(Glass, { className: "p-10 md:p-16 text-center overflow-hidden", glow: true, children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 vq-grid opacity-30 pointer-events-none" }),
              /* @__PURE__ */ jsxs("div", { className: "relative z-10", children: [
                /* @__PURE__ */ jsx(Eyebrow, { icon: BadgeCheck, tone: "emerald", children: "Risk-free to start" }),
                /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.9] mb-6", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "Try the whole platform.",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("span", { className: "text-emerald-600 dark:text-emerald-400", children: "Free for 14 days." })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto mb-9", children: "Full access. No credit card. Launch a pre-populated demo store in one click, or start your own and be live in 15 minutes." }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 mb-8", children: [
                  /* @__PURE__ */ jsxs(MagBtn, { href: "/register", variant: "primary", children: [
                    "Start Free Trial ",
                    /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
                  ] }),
                  /* @__PURE__ */ jsx(MagBtn, { href: "/pricing", variant: "ghost", children: "See pricing" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[12px] font-bold text-slate-500", children: ["No credit card", "Cancel anytime", "Export your data", "Free demo store"].map((x) => /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Check, { size: 13, className: "text-emerald-600 dark:text-emerald-400" }),
                  " ",
                  x
                ] }, x)) })
              ] })
            ] }) }) }) }),
            /* @__PURE__ */ jsx("section", { className: "py-24 md:py-32 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
              /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsxs("h2", { className: "text-3xl md:text-5xl font-black text-slate-900 dark:text-white text-center mb-14 tracking-tighter", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                "Common ",
                /* @__PURE__ */ jsx("span", { className: "text-indigo-600 dark:text-indigo-400", children: "questions" })
              ] }) }),
              /* @__PURE__ */ jsx(Reveal, { delay: 0.1, children: /* @__PURE__ */ jsx("div", { children: faqs.map((f, i) => /* @__PURE__ */ jsx(FaqItem, { q: f.q, a: f.a, open: openFaq === i, onClick: () => setOpenFaq(openFaq === i ? -1 : i) }, i)) }) })
            ] }) }),
            /* @__PURE__ */ jsxs("section", { className: "py-24 px-6 border-t border-slate-900/[0.08] dark:border-white/[0.06] relative", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-indigo-500/[0.06] to-transparent pointer-events-none" }),
              /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto relative z-10 text-center", children: [
                /* @__PURE__ */ jsxs(Reveal, { children: [
                  /* @__PURE__ */ jsx(Eyebrow, { icon: Mail, children: "Stay updated" }),
                  /* @__PURE__ */ jsxs("h2", { className: "text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                    "Subscribe to ",
                    /* @__PURE__ */ jsx("span", { className: "text-indigo-600 dark:text-indigo-400", children: "VenQore Insights" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed", children: "Direct news on system upgrades, cloud accounting releases, and platform enhancements." })
                ] }),
                /* @__PURE__ */ jsxs(Reveal, { delay: 0.1, children: [
                  /* @__PURE__ */ jsxs("form", { onSubmit: handleNewsletterSubmit, className: "max-w-md mx-auto flex flex-col sm:flex-row items-center gap-3", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "email",
                        required: true,
                        value: newsletterEmail,
                        onChange: (e) => setNewsletterEmail(e.target.value),
                        placeholder: "Enter your email address",
                        className: "w-full px-5 py-3.5 bg-slate-900/[0.035] dark:bg-white/[0.04] border border-slate-900/[0.10] dark:border-white/[0.08] hover:border-white/15 focus:border-indigo-500/50 rounded-xl text-slate-900 dark:text-white text-sm outline-none transition-all duration-300"
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "submit",
                        disabled: newsletterStatus === "loading",
                        className: "w-full sm:w-auto h-12 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0 shadow-lg shadow-indigo-600/20",
                        children: [
                          newsletterStatus === "loading" ? "Subscribing..." : "Subscribe",
                          /* @__PURE__ */ jsx(ArrowRight, { size: 14 })
                        ]
                      }
                    )
                  ] }),
                  newsletterMsg && /* @__PURE__ */ jsx("p", { className: `text-xs mt-4 font-semibold ${newsletterStatus === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-400"}`, children: newsletterMsg })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("section", { className: "py-28 md:py-40 px-6 text-center overflow-hidden", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto relative", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" }),
              /* @__PURE__ */ jsxs(Reveal, { children: [
                /* @__PURE__ */ jsxs("h2", { className: "text-5xl md:text-8xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.9] relative z-10", style: { fontFamily: "'Space Grotesk',sans-serif" }, children: [
                  "You already suspect",
                  /* @__PURE__ */ jsx("br", {}),
                  "your ",
                  /* @__PURE__ */ jsx("span", { className: "vq-headline-grad", children: "numbers are wrong." })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed relative z-10", children: "The only question is whether you fix it this year — or keep guessing. 14-day free trial, full access, no credit card." }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10", children: [
                  /* @__PURE__ */ jsxs(MagBtn, { href: "/register", variant: "primary", children: [
                    "Start Your Free Trial ",
                    /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
                  ] }),
                  /* @__PURE__ */ jsx(MagBtn, { href: "/contact", variant: "ghost", children: "Talk to Sales" })
                ] })
              ] })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx("style", { children: VQ_CSS })
        ]
      }
    )
  );
}
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

/* Range sliders in the cost calculator — native inputs look wrong in both
   themes, so the track and thumb are drawn explicitly. */
.vq-range { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 999px; background: rgba(15,23,42,0.10); outline: none; cursor: pointer; }
.dark .vq-range { background: rgba(255,255,255,0.10); }
.vq-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 999px; background: #6366f1; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(99,102,241,0.45); cursor: grab; transition: transform .15s ease; }
.dark .vq-range::-webkit-slider-thumb { border-color: #0c0922; }
.vq-range::-webkit-slider-thumb:hover { transform: scale(1.15); }
.vq-range::-webkit-slider-thumb:active { cursor: grabbing; }
.vq-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 999px; background: #6366f1; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(99,102,241,0.45); cursor: grab; }
.dark .vq-range::-moz-range-thumb { border-color: #0c0922; }
.vq-range:focus-visible::-webkit-slider-thumb { outline: 2px solid #818cf8; outline-offset: 2px; }

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
export {
  LandingPage as default
};
