import React, { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { money } from '@/lib/commerce';
import { tone } from '@/Components/Commerce/shop';
import '../../../css/commerce-marketplace.css';

/** Soft floating orbs behind the showcase, drawn with three.js (loaded on demand, off for reduced-motion). */
function Orbs({ color = '#0BAA8F' }) {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return undefined;
        let stop = () => {};
        let dead = false;
        (async () => {
            const THREE = await import('three');
            if (dead) return;
            const w = () => el.clientWidth || 600; const h = () => el.clientHeight || 300;
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            renderer.setSize(w(), h());
            el.appendChild(renderer.domElement);
            const scene = new THREE.Scene();
            const cam = new THREE.PerspectiveCamera(45, w() / h(), 0.1, 100);
            cam.position.z = 12;
            scene.add(new THREE.AmbientLight(0xffffff, 0.9));
            const key = new THREE.PointLight(0xffffff, 60, 40); key.position.set(4, 6, 8); scene.add(key);
            const base = new THREE.Color(color);
            const orbs = Array.from({ length: 9 }, (_, i) => {
                const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 + Math.random() * 1.1, 3), new THREE.MeshStandardMaterial({ color: base.clone().offsetHSL((i % 3) * 0.04 - 0.04, 0, (i % 4) * 0.05), roughness: 0.25, metalness: 0.1, transparent: true, opacity: 0.55 }));
                m.position.set((Math.random() - 0.5) * 16, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4 - 1);
                m.userData = { s: 0.2 + Math.random() * 0.5, p: Math.random() * 6.28 };
                scene.add(m);
                return m;
            });
            let raf = 0; let on = true;
            const tick = (t) => {
                if (!on) return;
                orbs.forEach((o) => { o.position.y += Math.sin(t / 1000 * o.userData.s + o.userData.p) * 0.004; o.rotation.x += 0.002; o.rotation.y += 0.003; });
                renderer.render(scene, cam);
                raf = requestAnimationFrame(tick);
            };
            const resize = () => { renderer.setSize(w(), h()); cam.aspect = w() / h(); cam.updateProjectionMatrix(); };
            const vis = () => { on = !document.hidden; if (on) { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); } };
            window.addEventListener('resize', resize); document.addEventListener('visibilitychange', vis);
            raf = requestAnimationFrame(tick);
            stop = () => {
                on = false; cancelAnimationFrame(raf);
                window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', vis);
                orbs.forEach((o) => { o.geometry.dispose(); o.material.dispose(); });
                renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
            };
        })().catch(() => {});
        return () => { dead = true; stop(); };
    }, [color]);
    return <div ref={ref} className="sc-orbs" aria-hidden="true" />;
}

function Prod({ it, sym, canAdd, onAdd, onDetail, rank }) {
    const t = tone(it.id);
    return (
        <div className="mp-prod sc-prod">
            {rank && <span className="sc-rank">{rank}</span>}
            <button type="button" className="im sc-im" style={it.image_url ? { backgroundImage: `url(${it.image_url})` } : { background: t.bg }} onClick={() => onDetail(it)} aria-label={`View ${it.name}`} />
            <div className="tx">
                <b>{it.name}</b>
                {it.sold > 0 && <small>{it.sold} sold recently</small>}
                <span className="mp-price">{money(it.price, sym)}{it.was_price ? <span className="mp-was">{money(it.was_price, sym)}</span> : null}</span>
            </div>
            {canAdd && it.stock !== 'out' && <button type="button" className="sc-add" onClick={() => onAdd(it)} aria-label={`Add ${it.name}`}><Plus size={18} /></button>}
        </div>
    );
}

export default function StoreShowcase({ showcase, sym, canAdd, add, onDetail, onCategory, brand }) {
    if (!showcase) return null;
    const { featured = [], best_sellers: best = [], top_categories: cats = [], offers = [] } = showcase;
    if (!featured.length && !best.length && cats.length < 2 && !offers.length) return null;
    return (
        <div className="sc-wrap">
            <Orbs color={brand || '#0BAA8F'} />
            {offers.length > 0 && (
                <div className="mp-rail sc-offers" aria-label="Offers">
                    {offers.map((o) => <span key={o.name} className="sc-offer"><b>{o.label}</b> {o.name}</span>)}
                </div>
            )}
            {cats.length > 1 && (
                <section className="sc-sec">
                    <div className="mp-sech"><h2>Top categories</h2></div>
                    <div className="mp-rail">
                        {cats.map((c) => (
                            <button key={c.id} type="button" className="sc-cat" onClick={() => onCategory(c.id)} style={c.image_url ? { backgroundImage: `linear-gradient(180deg,transparent 35%,rgb(0 0 0/.7)),url(${c.image_url})` } : { background: tone(c.id).bg, color: tone(c.id).fg }}>
                                <b>{c.name}</b><small>{c.count} item{c.count === 1 ? '' : 's'}</small>
                            </button>
                        ))}
                    </div>
                </section>
            )}
            {featured.length > 0 && (
                <section className="sc-sec">
                    <div className="mp-sech"><h2>Featured</h2><span>Picked by the shop</span></div>
                    <div className="mp-rail">{featured.map((it) => <div key={it.id} style={{ width: 200 }}><Prod it={it} sym={sym} canAdd={canAdd} onAdd={add} onDetail={onDetail} /></div>)}</div>
                </section>
            )}
            {best.length > 0 && (
                <section className="sc-sec">
                    <div className="mp-sech"><h2>Best sellers</h2><span>Most ordered lately</span></div>
                    <div className="mp-rail">{best.map((it, i) => <div key={it.id} style={{ width: 200 }}><Prod it={it} sym={sym} canAdd={canAdd} onAdd={add} onDetail={onDetail} rank={i + 1} /></div>)}</div>
                </section>
            )}
        </div>
    );
}
