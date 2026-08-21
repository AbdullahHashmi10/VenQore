import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Gauge, BarChart3, ShoppingCart, ScanBarcode, Truck, Boxes,
    Warehouse, Factory, Users, Calculator, Bot, Network,
} from 'lucide-react';
import { useTheme } from '@/Contexts/ThemeContext';

/* ════════════════════════════════════════════════════════════════════════════
   QORE — THE INTELLIGENCE CORE (real 3D, zero dependencies)

   A hand-written 3D renderer on a 2D canvas. No Three.js, no WebGL, nothing
   added to the bundle — which matters because this sits on the landing page,
   the one route where payload directly costs us search ranking.

   What makes it genuinely 3D rather than a 2D fake:
     · Perspective projection — everything is a real (x,y,z) point divided by
       camera distance, so nodes grow as they swing toward you and shrink as
       they fall away.
     · Painter's-algorithm depth sorting — anything behind the core is drawn
       first and dimmed, so the orb genuinely occludes what passes behind it.
     · Directional lighting — one light at the upper-left produces a terminator
       across the sphere, a rim/fresnel edge, and a specular hotspot; node
       brightness is computed from its own facing angle.
     · Great-circle wireframe on the sphere surface, depth-faded per vertex, so
       the orb reads as a volume rather than a flat disc.

   Performance guards:
     · One rAF loop, paused entirely when the section is off-screen or the tab
       is hidden.
     · Device pixel ratio capped at 2.
     · Labels are real DOM (crisp text, real icons) positioned by mutating
       style directly — never React state — so the loop causes zero re-renders.
     · prefers-reduced-motion renders one static frame and stops.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── module definitions, laid out on three tilted orbital shells ───────────── */
const RINGS = [
    // radius (in core radii) · tilt about X · yaw about Y · angular speed (rad/s)
    { r: 2.55, tilt: 0.32, yaw: 0.0, speed: 0.130 },
    { r: 3.15, tilt: -0.42, yaw: 0.9, speed: -0.098 },
    { r: 3.70, tilt: 0.14, yaw: 1.9, speed: 0.074 },
];

const MODULES = [
    { n: 'Dashboard', ic: Gauge, ring: 0, a: 0 },
    { n: 'Reports', ic: BarChart3, ring: 0, a: Math.PI / 2 },
    { n: 'Sales', ic: ShoppingCart, ring: 0, a: Math.PI },
    { n: 'POS', ic: ScanBarcode, ring: 0, a: (3 * Math.PI) / 2 },

    { n: 'Inventory', ic: Boxes, ring: 1, a: 0.4 },
    { n: 'Purchases', ic: Truck, ring: 1, a: 0.4 + Math.PI / 2 },
    { n: 'Warehouses', ic: Warehouse, ring: 1, a: 0.4 + Math.PI },
    { n: 'Manufacturing', ic: Factory, ring: 1, a: 0.4 + (3 * Math.PI) / 2 },

    { n: 'Accounting', ic: Calculator, ring: 2, a: 0.85 },
    { n: 'CRM', ic: Users, ring: 2, a: 0.85 + Math.PI / 2 },
    { n: 'AI Assistant', ic: Bot, ring: 2, a: 0.85 + Math.PI },
    { n: 'Multi-Store', ic: Network, ring: 2, a: 0.85 + (3 * Math.PI) / 2 },
];

/* Camera distance in core radii. Must exceed the outermost ring or points
   would cross behind the camera and invert. */
const CAM = 8.2;

/* ── tiny vector helpers ──────────────────────────────────────────────────── */
const rotX = (p, t) => {
    const c = Math.cos(t), s = Math.sin(t);
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
};
const rotY = (p, t) => {
    const c = Math.cos(t), s = Math.sin(t);
    return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
};

/* Palettes. Light mode is not a dimmed copy: on white the orb needs deeper,
   more saturated pigment or it washes out into a grey smudge. */
const PALETTE = {
    dark: {
        line: [129, 140, 248],
        packet: [34, 211, 238],
        node: [165, 180, 252],
        wire: [199, 210, 254],
        coreIn: '#e9d5ff', coreMid: '#a78bfa', coreOut: '#5b21b6',
        rim: [196, 181, 253],
        halo: 'rgba(139,92,246,',
        dust: [148, 163, 184],
        lineA: 0.42, wireA: 0.30, dustA: 0.40,
    },
    light: {
        line: [79, 70, 229],
        packet: [8, 145, 178],
        node: [79, 70, 229],
        wire: [99, 102, 241],
        coreIn: '#ddd6fe', coreMid: '#7c3aed', coreOut: '#3730a3',
        rim: [139, 92, 246],
        halo: 'rgba(109,74,226,',
        dust: [100, 116, 139],
        lineA: 0.34, wireA: 0.26, dustA: 0.30,
    },
};

export default function QoreCore3D() {
    const wrapRef = useRef(null);
    const canvasRef = useRef(null);
    const labelRefs = useRef([]);
    const pointerRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
    const [reduced, setReduced] = useState(false);
    const [active, setActive] = useState(false);   // in viewport
    const { isDarkMode } = useTheme();

    /* reduced motion */
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const on = () => setReduced(mq.matches);
        on();
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);

    /* only run while visible */
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.08 });
        io.observe(el);
        return () => io.disconnect();
    }, []);

    /* pointer parallax — the whole scene leans toward the cursor */
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
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const P = isDarkMode ? PALETTE.dark : PALETTE.light;
        const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

        let w = 0, h = 0, dpr = 1, raf = 0, running = true;
        let cx = 0, cy = 0, R = 0;          // screen centre + core radius in px
        const start = performance.now();

        /* ambient dust, in scene space so it parallaxes correctly */
        const DUST = Array.from({ length: 70 }, () => {
            const th = Math.random() * Math.PI * 2;
            const ph = Math.acos(2 * Math.random() - 1);
            const rr = 4.5 + Math.random() * 3.5;
            return {
                x: rr * Math.sin(ph) * Math.cos(th),
                y: rr * Math.sin(ph) * Math.sin(th) * 0.65,
                z: rr * Math.cos(ph),
                s: 0.4 + Math.random() * 1.1,
                tw: Math.random() * Math.PI * 2,
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
            R = Math.min(w, h) * 0.113;      // core radius in px
        };

        /* world -> screen. Returns null when the point is behind the camera. */
        const project = (p) => {
            const d = CAM - p.z;
            if (d <= 0.15) return null;
            const k = CAM / d;                       // perspective divide
            return { x: cx + p.x * R * k, y: cy + p.y * R * k, k, z: p.z };
        };

        /* a module's world position at time t, including scene tilt */
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

        /* ── the core sphere: gradient body + terminator + rim + specular ──── */
        const drawCore = (t, sceneX, sceneY) => {
            // Light direction, upper-left-front.
            const LX = -0.42, LY = -0.46;

            // Atmospheric halo
            const halo = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 4.2);
            halo.addColorStop(0, `${P.halo}0.34)`);
            halo.addColorStop(0.35, `${P.halo}0.11)`);
            halo.addColorStop(1, `${P.halo}0)`);
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(cx, cy, R * 4.2, 0, Math.PI * 2);
            ctx.fill();

            // Sphere body — gradient origin offset toward the light gives the
            // lit hemisphere and a natural terminator on the far side.
            const body = ctx.createRadialGradient(
                cx + LX * R * 0.75, cy + LY * R * 0.75, R * 0.06,
                cx, cy, R * 1.02,
            );
            body.addColorStop(0, P.coreIn);
            body.addColorStop(0.42, P.coreMid);
            body.addColorStop(1, P.coreOut);
            ctx.fillStyle = body;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();

            // Surface wireframe: latitude + longitude great circles, clipped to
            // the sphere and faded per-vertex by depth. This is what stops it
            // reading as a flat disc.
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, R * 0.995, 0, Math.PI * 2);
            ctx.clip();

            const spin = t * 0.16;
            const SEG = 54;
            // longitudes
            for (let m = 0; m < 8; m++) {
                const lon = (m / 8) * Math.PI * 2 + spin;
                ctx.beginPath();
                let started = false;
                for (let i = 0; i <= SEG; i++) {
                    const lat = -Math.PI / 2 + (i / SEG) * Math.PI;
                    let p = {
                        x: Math.cos(lat) * Math.cos(lon),
                        y: Math.sin(lat),
                        z: Math.cos(lat) * Math.sin(lon),
                    };
                    p = rotY(p, sceneY);
                    p = rotX(p, sceneX + 0.28);
                    const s = project(p);
                    if (!s) { started = false; continue; }
                    if (!started) { ctx.moveTo(s.x, s.y); started = true; }
                    else ctx.lineTo(s.x, s.y);
                }
                ctx.strokeStyle = rgba(P.wire, P.wireA * 0.5);
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
            // latitudes
            for (let m = 1; m < 6; m++) {
                const lat = -Math.PI / 2 + (m / 6) * Math.PI;
                ctx.beginPath();
                let started = false;
                for (let i = 0; i <= SEG; i++) {
                    const lon = (i / SEG) * Math.PI * 2 + spin;
                    let p = {
                        x: Math.cos(lat) * Math.cos(lon),
                        y: Math.sin(lat),
                        z: Math.cos(lat) * Math.sin(lon),
                    };
                    p = rotY(p, sceneY);
                    p = rotX(p, sceneX + 0.28);
                    const s = project(p);
                    if (!s) { started = false; continue; }
                    if (!started) { ctx.moveTo(s.x, s.y); started = true; }
                    else ctx.lineTo(s.x, s.y);
                }
                ctx.strokeStyle = rgba(P.wire, P.wireA * 0.42);
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
            ctx.restore();

            // Rim / fresnel: brightest where the surface turns away from us.
            const rim = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.03);
            rim.addColorStop(0, rgba(P.rim, 0));
            rim.addColorStop(0.75, rgba(P.rim, 0.16));
            rim.addColorStop(1, rgba(P.rim, 0.55));
            ctx.fillStyle = rim;
            ctx.beginPath();
            ctx.arc(cx, cy, R * 1.03, 0, Math.PI * 2);
            ctx.fill();

            // Specular hotspot
            const spec = ctx.createRadialGradient(
                cx + LX * R * 0.55, cy + LY * R * 0.55, 0,
                cx + LX * R * 0.55, cy + LY * R * 0.55, R * 0.42,
            );
            spec.addColorStop(0, 'rgba(255,255,255,0.55)');
            spec.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = spec;
            ctx.beginPath();
            ctx.arc(cx + LX * R * 0.55, cy + LY * R * 0.55, R * 0.42, 0, Math.PI * 2);
            ctx.fill();
        };

        /* ── an orbit path, split into the half behind the core and in front ─ */
        const drawOrbit = (ring, sceneX, sceneY, behind) => {
            const SEG = 96;
            ctx.beginPath();
            let started = false;
            for (let i = 0; i <= SEG; i++) {
                const a = (i / SEG) * Math.PI * 2;
                let p = { x: Math.cos(a) * ring.r, y: 0, z: Math.sin(a) * ring.r };
                p = rotX(p, ring.tilt);
                p = rotY(p, ring.yaw);
                p = rotY(p, sceneY);
                p = rotX(p, sceneX);
                const isBehind = p.z < 0;
                const s = project(p);
                if (!s || isBehind !== behind) { started = false; continue; }
                if (!started) { ctx.moveTo(s.x, s.y); started = true; }
                else ctx.lineTo(s.x, s.y);
            }
            ctx.strokeStyle = rgba(P.line, behind ? P.lineA * 0.20 : P.lineA * 0.42);
            ctx.lineWidth = behind ? 0.7 : 1;
            ctx.setLineDash([3, 7]);
            ctx.stroke();
            ctx.setLineDash([]);
        };

        /* ── spoke from core to a module, plus its travelling data packets ─── */
        const drawSpoke = (m, p, s, t, i) => {
            const behind = p.z < 0;
            const depth = (p.z + RINGS[m.ring].r) / (2 * RINGS[m.ring].r); // 0 far .. 1 near
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

            // Two packets per spoke, travelling opposite directions at
            // different rates so the traffic never looks metronomic.
            for (let k = 0; k < 2; k++) {
                const period = 2.4 + ((i + k * 3) % 5) * 0.42;
                const phase = ((t / period) + (i * 0.17) + k * 0.5) % 1;
                const u = k % 2 ? 1 - phase : phase;
                // Interpolate in WORLD space, then project — a 2D lerp between
                // endpoints would visibly cut the corner under perspective.
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

        /* ── the glowing bead that sits at each module's position ───────────── */
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

        /* ── one frame ──────────────────────────────────────────────────────── */
        const frame = (now) => {
            const t = reduced ? 6.2 : (now - start) / 1000;

            // ease the scene tilt toward the pointer
            const pr = pointerRef.current;
            pr.x += (pr.tx - pr.x) * 0.055;
            pr.y += (pr.ty - pr.y) * 0.055;
            const sceneY = (reduced ? 0 : t * 0.055) + pr.x * 0.30;
            const sceneX = -0.16 + pr.y * -0.20;

            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'lighter';

            drawDust(t, sceneX, sceneY);

            // Everything gets a world position, then is drawn back-to-front so
            // the core actually occludes the nodes passing behind it.
            const placed = MODULES.map((m, i) => {
                const p = nodeAt(m, t, sceneX, sceneY);
                return { m, i, p, s: project(p) };
            }).filter((o) => o.s);

            const behind = placed.filter((o) => o.p.z < 0).sort((a, b) => a.p.z - b.p.z);
            const front = placed.filter((o) => o.p.z >= 0).sort((a, b) => a.p.z - b.p.z);

            RINGS.forEach((ring) => drawOrbit(ring, sceneX, sceneY, true));
            behind.forEach((o) => { drawSpoke(o.m, o.p, o.s, t, o.i); drawNode(o.p, o.s, RINGS[o.m.ring]); });

            ctx.globalCompositeOperation = 'source-over';
            drawCore(t, sceneX, sceneY);
            ctx.globalCompositeOperation = 'lighter';

            RINGS.forEach((ring) => drawOrbit(ring, sceneX, sceneY, false));
            front.forEach((o) => { drawSpoke(o.m, o.p, o.s, t, o.i); drawNode(o.p, o.s, RINGS[o.m.ring]); });

            ctx.globalCompositeOperation = 'source-over';

            // Position the HTML labels. Direct style mutation — putting these
            // in React state would re-render twelve components sixty times a
            // second for no reason.
            placed.forEach((o) => {
                const el = labelRefs.current[o.i];
                if (!el) return;
                const ring = RINGS[o.m.ring];
                const depth = (o.p.z + ring.r) / (2 * ring.r);
                const scale = 0.74 + o.s.k * 0.30;
                el.style.transform = `translate3d(${o.s.x}px, ${o.s.y}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
                el.style.opacity = (0.34 + depth * 0.66).toFixed(3);
                el.style.zIndex = String(1000 + Math.round(o.p.z * 100));
            });

            if (!reduced && running) raf = requestAnimationFrame(frame);
        };

        resize();
        raf = requestAnimationFrame(frame);

        const ro = new ResizeObserver(() => { resize(); if (reduced) requestAnimationFrame(frame); });
        ro.observe(wrap);

        const onVis = () => {
            running = !document.hidden && active && !reduced;
            cancelAnimationFrame(raf);
            if (running) raf = requestAnimationFrame(frame);
        };
        document.addEventListener('visibilitychange', onVis);
        running = active && !reduced;
        if (!running && !reduced) cancelAnimationFrame(raf);

        return () => {
            running = false;
            cancelAnimationFrame(raf);
            ro.disconnect();
            document.removeEventListener('visibilitychange', onVis);
        };
    }, [isDarkMode, reduced, active]);

    return (
        <div
            ref={wrapRef}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className="relative w-full max-w-4xl mx-auto aspect-[4/3] select-none"
            role="img"
            aria-label="Qore, the VenQore intelligence core: twelve product modules orbiting a single shared engine — Dashboard, Reports, Sales, POS, Inventory, Purchases, Warehouses, Manufacturing, Accounting, CRM, AI Assistant and Multi-Store."
        >
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />

            {/* Core wordmark — real text, so it stays crisp and selectable */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-toast text-center pointer-events-none">
                <div
                    className="font-bold tracking-tight text-lg sm:text-2xl text-white drop-shadow-[0_2px_12px_rgba(76,29,149,0.9)]"
                    style={{ fontFamily: "'Space Grotesk',sans-serif" }}
                >
                    QORE
                </div>
                <div className="text-[7px] sm:text-4xs font-bold uppercase tracking-[0.3em] text-violet-100/90 drop-shadow-[0_1px_6px_rgba(76,29,149,0.9)]">
                    Intelligence Core
                </div>
            </div>

            {/* Module labels, positioned each frame from their projected 3D point */}
            {MODULES.map((m, i) => (
                <div
                    key={m.n}
                    ref={(el) => { labelRefs.current[i] = el; }}
                    className="absolute left-0 top-0 will-change-transform pointer-events-none"
                    style={{ opacity: 0 }}
                >
                    <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white/90 dark:bg-app border border-line dark:border-white/10 backdrop-blur-md shadow-lg">
                        <m.ic size={13} className="text-brand-600 dark:text-brand-300 shrink-0" />
                        <span className="hidden sm:inline text-2xs font-bold text-ink-secondary dark:text-ink whitespace-nowrap">
                            {m.n}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
