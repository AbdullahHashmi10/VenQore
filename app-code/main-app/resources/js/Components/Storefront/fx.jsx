import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';

/** Fine pointer + motion allowed: the only case where hover effects make sense. */
const fancy = () => typeof window !== 'undefined' && window.matchMedia
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cards lean toward the pointer and catch a moving glare. Pure CSS variables, no layout cost. */
export function useTilt(ref, max = 7) {
    useEffect(() => {
        const el = ref.current;
        if (!el || !fancy()) return undefined;
        let raf = 0;
        const move = (e) => {
            const r = el.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height;
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
                el.style.setProperty('--rx', `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
                el.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
                el.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
            });
        };
        const leave = () => { cancelAnimationFrame(raf); el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
        el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
        return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
    }, [ref, max]);
}

/** Fades a section up as it scrolls into view. Content is visible without JS-driven observers (reduced motion, old browsers). */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
    const ref = useRef(null);
    const [on, setOn] = useState(() => typeof IntersectionObserver === 'undefined');
    useEffect(() => {
        const el = ref.current;
        if (!el || on) return undefined;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setOn(true); return undefined; }
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
        io.observe(el);
        return () => io.disconnect();
    }, [on]);
    return <Tag ref={ref} className={`sf-reveal ${on ? 'in' : ''} ${className}`} style={{ '--d': `${delay}ms` }} {...rest}>{children}</Tag>;
}

/** A little copy of the product flies into the cart icon. */
export function flyToCart(srcEl) {
    try {
        if (!srcEl || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
        const target = document.querySelector('.sf-nav-cart') || document.querySelector('.vq-sh-bagbtn');
        if (!target) return;
        const a = srcEl.getBoundingClientRect(); const b = target.getBoundingClientRect();
        if (!a.width || !b.width) return;
        const ghost = srcEl.cloneNode(true);
        Object.assign(ghost.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, margin: 0, zIndex: 9999, pointerEvents: 'none', borderRadius: '18px', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(0,0,0,.45)', transformOrigin: 'center' });
        document.body.appendChild(ghost);
        const dx = b.left + b.width / 2 - (a.left + a.width / 2); const dy = b.top + b.height / 2 - (a.top + a.height / 2);
        const anim = ghost.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 70}px) scale(.55)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${dx}px, ${dy}px) scale(.08)`, opacity: 0.2 },
        ], { duration: 720, easing: 'cubic-bezier(.5,0,.3,1)' });
        anim.onfinish = () => { ghost.remove(); target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' }); };
    } catch { /* decoration only */ }
}

/** Home hero: a live WebGL scene when the device can run it; the CSS collage otherwise. */
export function HeroScene({ heroRef, artRef, items, onActive, hrefFor }) {
    const canvasRef = useRef(null);
    const [tip, setTip] = useState(null);
    useEffect(() => {
        const host = heroRef.current; const canvas = canvasRef.current;
        if (!host || !canvas || items.length < 2) return undefined;
        let api = null; let dead = false;
        import('@/lib/store3d').then((m) => {
            if (dead || !m.canUse3D()) return;
            try {
                api = m.mountHero({
                    canvas, host, items, accent: m.readAccent(host), backdrop: !host.style.backgroundImage,
                    anchor: () => {
                        const h = host.getBoundingClientRect(); const a = artRef.current?.getBoundingClientRect() || h;
                        return { cx: a.left - h.left + a.width / 2, cy: a.top - h.top + a.height / 2, w: a.width, h: a.height };
                    },
                    onHover: (t) => setTip((p) => (t ? { i: t.i, x: Math.round(t.x), y: Math.round(t.y), it: t.it } : (p ? null : p))),
                    onPick: (it) => router.visit(hrefFor(it)),
                });
                onActive?.(true);
            } catch { onActive?.(false); }
        }).catch(() => onActive?.(false));
        return () => { dead = true; api?.destroy(); onActive?.(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items.map((i) => i.id).join(',')]);
    return (
        <>
            <canvas ref={canvasRef} className="sf-hero-canvas" aria-hidden="true" />
            {tip && <span className="sf-3d-tip" style={{ left: tip.x, top: tip.y }}><b>{tip.it.name}</b><i>{tip.it.priceLabel}</i></span>}
        </>
    );
}

/** Product page: the photo as a lit, tilting card on an aurora stage. The normal image stays underneath as the fallback. */
export function ProductStage({ imageUrl, name, children, className = '' }) {
    const hostRef = useRef(null); const canvasRef = useRef(null); const apiRef = useRef(null);
    const [ready, setReady] = useState(false);
    useEffect(() => {
        const host = hostRef.current; const canvas = canvasRef.current;
        if (!host || !canvas) return undefined;
        let dead = false;
        import('@/lib/store3d').then((m) => {
            if (dead || !m.canUse3D()) return;
            try { apiRef.current = m.mountStage({ canvas, host, imageUrl, name, accent: m.readAccent(host), onReady: () => !dead && setReady(true) }); } catch { /* keep the plain image */ }
        }).catch(() => {});
        return () => { dead = true; apiRef.current?.destroy(); apiRef.current = null; setReady(false); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { apiRef.current?.setImage(imageUrl, name); }, [imageUrl, name]);
    return (
        <div ref={hostRef} className={`sf-stage ${ready ? 'is-3d' : ''} ${className}`}>
            <div className="sf-stage-fallback">{children}</div>
            <canvas ref={canvasRef} className="sf-stage-canvas" aria-hidden="true" />
            {ready && <span className="sf-stage-hint">Drag to tilt</span>}
        </div>
    );
}
