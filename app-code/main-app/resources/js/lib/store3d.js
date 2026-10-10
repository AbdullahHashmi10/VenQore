/**
 * WebGL scenes for the public store (three.js). Loaded on demand and only when the device can afford it,
 * so a shopper on a weak phone gets the plain CSS version instead. Everything here is decoration:
 * links, prices and the cart never depend on it.
 */
import {
    WebGLRenderer, Scene, PerspectiveCamera, Mesh, PlaneGeometry, ShaderMaterial, Group, Points, BufferGeometry,
    BufferAttribute, Raycaster, Vector2, Color, TextureLoader, CanvasTexture, SRGBColorSpace, AdditiveBlending,
} from 'three';

export function canUse3D() {
    try {
        if (typeof window === 'undefined') return false;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
        const c = navigator.connection;
        if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ''))) return false;
        if ((navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2) return false;
        const cv = document.createElement('canvas');
        return !!(cv.getContext('webgl2') || cv.getContext('webgl'));
    } catch { return false; }
}

/** "#0BAA8F" or "rgb(…)" from a CSS variable → THREE.Color */
export function readAccent(el) {
    const cs = getComputedStyle(el);
    const get = (n, d) => (cs.getPropertyValue(n).trim() || d);
    return { a: new Color(get('--sf-a', '#23C4A6')), b: new Color(get('--sf-b', '#0BAA8F')) };
}

const FULL_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

const NOISE = `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; } return v; }`;

// A slow, mouse-lit aurora in the store's own colours.
const AURORA_FRAG = `
uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform vec3 uA; uniform vec3 uB; uniform vec2 uFocus; uniform float uStrength;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 asp = vec2(uRes.x / uRes.y, 1.0);
  vec2 p = (vUv - 0.5) * asp * 1.7;
  float t = uTime * 0.07;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7, 9.2) + t*1.5), fbm(p + 3.0*q + vec2(8.3, 2.8) - t));
  float f = fbm(p + 3.0*r);
  vec2 m = (uMouse - 0.5) * asp * 1.7;
  float spot = exp(-3.2 * length(p - m));
  float focus = smoothstep(1.15, 0.05, length((vUv - uFocus) * asp));
  vec3 col = mix(uA, uB, clamp(f * 1.5, 0.0, 1.0)) * (0.55 + f);
  float a = (0.10 + 0.62 * f * f + 0.55 * spot) * (0.35 + 0.65 * focus) * uStrength;
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.95));
  #include <colorspace_fragment>
}`;

const CARD_FRAG = `
uniform sampler2D uTex; uniform float uAspect; uniform float uHover; uniform float uTime; uniform vec2 uTilt;
uniform float uMode; uniform vec3 uColor; uniform float uAlpha;
varying vec2 vUv;
float sdRound(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 p = vUv - 0.5;
  float d = sdRound(p, vec2(0.5), 0.085);
  float mask = 1.0 - smoothstep(0.0, 0.006, d);
  if (mask < 0.01) discard;
  vec4 col;
  if (uMode > 0.5) {
    col = vec4(uColor, mask * uAlpha);
  } else {
    vec2 uv = vUv;
    if (uAspect > 1.0) uv.x = (uv.x - 0.5) / uAspect + 0.5; else uv.y = (uv.y - 0.5) * uAspect + 0.5;
    uv += uTilt * 0.012;
    vec3 c = texture2D(uTex, uv).rgb;
    float diag = vUv.x + vUv.y * 0.65;
    float pos = fract(uTime * 0.09 + uHover * 0.2) * 2.6 - 0.45;
    float sweep = smoothstep(0.34, 0.0, abs(diag - pos));
    c += sweep * (0.10 + 0.22 * uHover);
    vec2 g = vUv - (0.5 + uTilt * 0.5);
    c += exp(-6.0 * dot(g, g)) * 0.10;
    c *= 0.93 + 0.07 * (1.0 - vUv.y);
    float rim = 1.0 - smoothstep(0.0, 0.014, abs(d + 0.007));
    c = mix(c, vec3(1.0), rim * (0.30 + 0.35 * uHover));
    col = vec4(c, mask * uAlpha);
  }
  gl_FragColor = col;
  #include <colorspace_fragment>
}`;

const DUST_VERT = `
uniform float uTime; uniform float uH; uniform float uPx; attribute float aSeed; varying float vA;
void main(){
  vec3 pos = position;
  pos.y = mod(pos.y + uTime * (0.05 + aSeed * 0.16) + uH * 0.5, uH) - uH * 0.5;
  pos.x += sin(uTime * 0.4 + aSeed * 40.0) * 0.08;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = (1.6 + aSeed * 4.2) * uPx * (7.0 / -mv.z);
  vA = 0.25 + aSeed * 0.55;
  gl_Position = projectionMatrix * mv;
}`;
const DUST_FRAG = `
uniform vec3 uColor; varying float vA;
void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vA; gl_FragColor = vec4(uColor, a);
#include <colorspace_fragment>
}`;

const ease = (x) => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;
const lerp = (a, b, k) => a + (b - a) * k;

function initialsOf(name = '') { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '·'; }

function fallbackTexture(name, ca, cb) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 512;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, `#${ca.getHexString(SRGBColorSpace)}`); g.addColorStop(1, `#${cb.getHexString(SRGBColorSpace)}`);
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    x.fillStyle = 'rgba(255,255,255,.88)'; x.font = '800 180px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(initialsOf(name), 256, 272);
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace;
    return { tex: t, aspect: 1 };
}

function loadTexture(url, name, accent) {
    return new Promise((resolve) => {
        if (!url) { resolve(fallbackTexture(name, accent.a, accent.b)); return; }
        const loader = new TextureLoader(); loader.setCrossOrigin('anonymous');
        loader.load(url, (tex) => {
            tex.colorSpace = SRGBColorSpace; tex.anisotropy = 4;
            resolve({ tex, aspect: tex.image.width / Math.max(1, tex.image.height) });
        }, undefined, () => resolve(fallbackTexture(name, accent.a, accent.b)));
    });
}

function cardMaterial(tex, aspect, mode, color) {
    return new ShaderMaterial({
        vertexShader: VERT, fragmentShader: CARD_FRAG, transparent: true, depthWrite: mode === 0,
        uniforms: { uTex: { value: tex }, uAspect: { value: aspect }, uHover: { value: 0 }, uTime: { value: 0 }, uTilt: { value: new Vector2() }, uMode: { value: mode }, uColor: { value: color || new Color(0x000000) }, uAlpha: { value: 0 } },
    });
}

function makeRenderer(canvas) {
    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    return renderer;
}

function aurora(accent, strength) {
    return new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
        vertexShader: FULL_VERT, fragmentShader: AURORA_FRAG, transparent: true, depthTest: false, depthWrite: false,
        uniforms: { uTime: { value: 0 }, uRes: { value: new Vector2(1, 1) }, uMouse: { value: new Vector2(0.7, 0.5) }, uA: { value: accent.a }, uB: { value: accent.b }, uFocus: { value: new Vector2(0.72, 0.5) }, uStrength: { value: strength } },
    }));
}

function dust(accent, count) {
    const geo = new BufferGeometry();
    const pos = new Float32Array(count * 3); const seed = new Float32Array(count);
    for (let i = 0; i < count; i += 1) { pos[i * 3] = (Math.random() - 0.5) * 12; pos[i * 3 + 1] = (Math.random() - 0.5) * 6; pos[i * 3 + 2] = -3 + Math.random() * 4; seed[i] = Math.random(); }
    geo.setAttribute('position', new BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    const mat = new ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, blending: AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uH: { value: 6 }, uPx: { value: Math.min(window.devicePixelRatio || 1, 1.75) }, uColor: { value: accent.a.clone().lerp(new Color(0xffffff), 0.35) } } });
    const pts = new Points(geo, mat); pts.frustumCulled = false;
    return pts;
}

/** Runs `frame(t, dt)` while the host is on screen and the tab is visible. */
function loop(host, frame) {
    let raf = 0; let visible = true; let last = performance.now(); let t = 0; let dead = false;
    const run = (now) => {
        if (dead) return;
        const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
        if (visible && !document.hidden) frame(t, dt);
        raf = requestAnimationFrame(run);
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(host); raf = requestAnimationFrame(run);
    return () => { dead = true; cancelAnimationFrame(raf); io.disconnect(); };
}

/* ───────────────────────── Home hero ───────────────────────── */
export function mountHero({ canvas, host, anchor, items, accent, backdrop = true, onHover, onPick }) {
    const renderer = makeRenderer(canvas);
    const scene = new Scene();
    const camera = new PerspectiveCamera(32, 1, 0.1, 60); camera.position.z = 9;
    const small = window.innerWidth < 700;
    const bg = backdrop ? aurora(accent, 1) : null; if (bg) { bg.renderOrder = -10; scene.add(bg); }
    const motes = dust(accent, small ? 46 : 110); scene.add(motes);
    const rig = new Group(); scene.add(rig);
    const slabColor = accent.b.clone().multiplyScalar(0.35);

    const cards = items.slice(0, 5).map((it, i) => {
        const group = new Group(); const geo = new PlaneGeometry(1, 1);
        const slabs = [2, 1].map((k) => { const m = new Mesh(geo, cardMaterial(null, 1, 1, slabColor)); m.position.z = -0.025 * k; m.scale.setScalar(1 - 0.012 * k); m.material.uniforms.uAlpha.value = 0; group.add(m); return m; });
        const front = new Mesh(geo, cardMaterial(null, 1, 0)); front.userData.index = i; group.add(front);
        rig.add(group);
        const card = { it, group, front, slabs, hover: 0, tex: null };
        loadTexture(it.image_url, it.name, accent).then(({ tex, aspect }) => { card.tex = tex; front.material.uniforms.uTex.value = tex; front.material.uniforms.uAspect.value = aspect; });
        return card;
    });

    const SLOTS = [
        { x: -0.22, y: 0.04, z: 0.35, r: -0.09, k: 1.0, d: 0.0 },
        { x: 0.58, y: 0.34, z: -0.25, r: 0.07, k: 0.8, d: 0.12 },
        { x: 0.44, y: -0.58, z: 0.6, r: -0.05, k: 0.7, d: 0.22 },
        { x: -0.78, y: -0.52, z: -0.55, r: 0.1, k: 0.56, d: 0.32 },
        { x: -0.06, y: 0.78, z: -0.9, r: -0.06, k: 0.5, d: 0.4 },
    ];
    let W = 1; let H = 1; let upp = 0.01; let S = 1; let cx = 0; let cy = 0;
    const layout = () => {
        const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
        renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
        const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z; upp = visH / H;
        const a = anchor(); S = Math.min(a.h * 0.56, a.w * 0.52) * upp;
        cx = (a.cx - W / 2) * upp; cy = (H / 2 - a.cy) * upp;
        if (bg) { bg.material.uniforms.uRes.value.set(W, H); bg.material.uniforms.uFocus.value.set(a.cx / W, 1 - a.cy / H); }
        motes.material.uniforms.uH.value = visH; motes.position.set(0, 0, 0);
    };
    layout();
    const ro = new ResizeObserver(layout); ro.observe(host);

    const mouse = new Vector2(0.5, 0.5); const smooth = new Vector2(0.5, 0.5); let inside = false; let hovered = -1;
    const ray = new Raycaster(); const ndc = new Vector2();
    const move = (e) => {
        const r = host.getBoundingClientRect();
        mouse.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height); inside = true;
        if (bg) bg.material.uniforms.uMouse.value.copy(smooth);
        if (e.target !== canvas) { if (hovered !== -1) { hovered = -1; onHover?.(null); canvas.style.cursor = ''; } return; }
        ndc.set(mouse.x * 2 - 1, mouse.y * 2 - 1); ray.setFromCamera(ndc, camera);
        const hit = ray.intersectObjects(cards.map((c) => c.front), false)[0];
        const idx = hit ? hit.object.userData.index : -1;
        if (idx !== hovered) { hovered = idx; canvas.style.cursor = idx >= 0 ? 'pointer' : ''; }
    };
    const leave = () => { inside = false; hovered = -1; onHover?.(null); canvas.style.cursor = ''; };
    const click = (e) => { if (e.target === canvas && hovered >= 0) onPick?.(cards[hovered].it); };
    host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave); host.addEventListener('click', click);

    const v = new Vector2();
    const stop = loop(host, (t) => {
        smooth.lerp(inside ? mouse : new Vector2(0.62, 0.5), 0.06);
        const px = (smooth.x - 0.5) * 2; const py = (smooth.y - 0.5) * 2;
        if (bg) { bg.material.uniforms.uTime.value = t; bg.material.uniforms.uMouse.value.copy(smooth); }
        motes.material.uniforms.uTime.value = t;
        rig.rotation.y = lerp(rig.rotation.y, px * 0.2, 0.06); rig.rotation.x = lerp(rig.rotation.x, -py * 0.12, 0.06);
        let tip = null;
        cards.forEach((c, i) => {
            const s = SLOTS[i]; const born = c.tex ? ease((t - 0.15 - s.d * 1.5) / 1.1) : 0;
            c.hover = lerp(c.hover, hovered === i ? 1 : 0, 0.12);
            const k = S * s.k * (0.62 + 0.38 * born) * (1 + c.hover * 0.09);
            const bob = Math.sin(t * 0.7 + i * 1.7) * 0.05 * S;
            c.group.position.set(cx + s.x * S, cy + s.y * S + bob - (1 - born) * 0.9 * S, s.z + c.hover * 0.7);
            c.group.rotation.set(Math.sin(t * 0.5 + i) * 0.03, Math.sin(t * 0.4 + i * 2) * 0.07 + px * 0.12 * (1 + s.z * 0.3), s.r + Math.sin(t * 0.45 + i) * 0.02 + c.hover * (-s.r * 0.6));
            c.group.scale.setScalar(k);
            const u = c.front.material.uniforms; u.uTime.value = t + i * 3; u.uHover.value = c.hover; u.uAlpha.value = born; u.uTilt.value.set(px * 0.5 * (1 - s.z * 0.2), py * 0.5);
            c.slabs.forEach((m) => { m.material.uniforms.uAlpha.value = born * 0.85; });
            if (hovered === i) { v.set(c.group.position.x, c.group.position.y); tip = { i, x: 0, y: 0, it: c.it }; }
        });
        if (tip) {
            const c = cards[tip.i]; const p = c.group.position.clone().project(camera);
            tip.x = (p.x * 0.5 + 0.5) * W; tip.y = (1 - (p.y * 0.5 + 0.5)) * H - (S * c.group.scale.y * 0.5 / upp) * 0.0;
            onHover?.(tip);
        }
        renderer.render(scene, camera);
    });

    return {
        resize: layout,
        destroy() {
            stop(); ro.disconnect();
            host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave); host.removeEventListener('click', click);
            cards.forEach((c) => { c.tex?.dispose(); c.front.material.dispose(); c.slabs.forEach((m) => m.material.dispose()); });
            scene.traverse((o) => { o.geometry?.dispose?.(); });
            renderer.dispose(); renderer.forceContextLoss?.();
        },
    };
}

/* ───────────────────────── Product stage ───────────────────────── */
export function mountStage({ canvas, host, imageUrl, name, accent, onReady }) {
    const renderer = makeRenderer(canvas);
    const scene = new Scene();
    const camera = new PerspectiveCamera(30, 1, 0.1, 40); camera.position.z = 6;
    const bg = aurora(accent, 1.15); bg.material.uniforms.uFocus.value.set(0.5, 0.5); bg.renderOrder = -10; scene.add(bg);
    const motes = dust(accent, window.innerWidth < 700 ? 40 : 90); scene.add(motes);
    const group = new Group(); scene.add(group);
    const geo = new PlaneGeometry(1, 1);
    const slabColor = accent.b.clone().multiplyScalar(0.3);
    const slabs = [3, 2, 1].map((k) => { const m = new Mesh(geo, cardMaterial(null, 1, 1, slabColor)); m.position.z = -0.03 * k; m.scale.setScalar(1 - 0.01 * k); group.add(m); return m; });
    const front = new Mesh(geo, cardMaterial(null, 1, 0)); group.add(front);
    // soft contact shadow under the card
    const shadow = new Mesh(new PlaneGeometry(1, 1), new ShaderMaterial({
        transparent: true, depthWrite: false, vertexShader: VERT,
        fragmentShader: 'varying vec2 vUv; void main(){ float d = length((vUv - 0.5) * vec2(1.0, 2.4)); gl_FragColor = vec4(0.0, 0.0, 0.0, smoothstep(0.5, 0.0, d) * 0.5); }',
    }));
    shadow.rotation.x = -Math.PI / 2; scene.add(shadow);

    let tex = null; let swapped = 0; let first = true;
    const setImage = (url, label) => loadTexture(url, label || name, accent).then(({ tex: t2, aspect }) => {
        tex?.dispose(); tex = t2; front.material.uniforms.uTex.value = t2; front.material.uniforms.uAspect.value = aspect; swapped = 1;
        if (first) { first = false; onReady?.(); }
    });
    setImage(imageUrl);

    let W = 1; let H = 1; let size = 2;
    const layout = () => {
        const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
        renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
        const visH = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z; const visW = visH * camera.aspect;
        size = Math.min(visH * 0.7, visW * 0.7);
        bg.material.uniforms.uRes.value.set(W, H); motes.material.uniforms.uH.value = visH * 1.2;
        shadow.scale.set(size * 1.1, size * 0.9, 1); shadow.position.set(0, -size * 0.62, 0);
    };
    layout(); const ro = new ResizeObserver(layout); ro.observe(host);

    const target = new Vector2(); const cur = new Vector2(); let dragging = false; let dragFrom = null; let rot = new Vector2(); let inside = false;
    const norm = (e) => { const r = host.getBoundingClientRect(); return new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)); };
    const down = (e) => { dragging = true; dragFrom = norm(e); host.setPointerCapture?.(e.pointerId); };
    const move = (e) => { const n = norm(e); inside = true; if (dragging) { rot.set(Math.max(-0.7, Math.min(0.7, rot.x + (n.x - dragFrom.x) * 1.4)), Math.max(-0.4, Math.min(0.4, rot.y + (n.y - dragFrom.y) * 0.9))); dragFrom = n; } else { target.copy(n); } bg.material.uniforms.uMouse.value.set(n.x * 0.5 + 0.5, n.y * 0.5 + 0.5); };
    const up = () => { dragging = false; };
    const leave = () => { inside = false; dragging = false; target.set(0, 0); };
    host.addEventListener('pointerdown', down); host.addEventListener('pointermove', move); host.addEventListener('pointerup', up); host.addEventListener('pointerleave', leave); host.addEventListener('pointercancel', up);

    const stop = loop(host, (t) => {
        if (!dragging) { rot.x = lerp(rot.x, 0, 0.05); rot.y = lerp(rot.y, 0, 0.05); }
        cur.lerp(inside && !dragging ? target : new Vector2(Math.sin(t * 0.35) * 0.35, Math.cos(t * 0.28) * 0.18), 0.07);
        const born = tex ? ease(t / 1.1) : 0; swapped = Math.max(0, swapped - 0.03);
        group.position.y = Math.sin(t * 0.8) * 0.05 + (1 - born) * -0.6;
        group.rotation.y = cur.x * 0.32 + rot.x; group.rotation.x = -cur.y * 0.2 - rot.y; group.rotation.z = Math.sin(t * 0.5) * 0.015;
        const s = size * (0.7 + 0.3 * born) * (1 + swapped * 0.06); group.scale.setScalar(s);
        const u = front.material.uniforms; u.uTime.value = t; u.uHover.value = inside ? 0.6 : 0.2; u.uAlpha.value = born; u.uTilt.value.set(cur.x + rot.x, cur.y + rot.y);
        slabs.forEach((m) => { m.material.uniforms.uAlpha.value = born * 0.9; });
        shadow.material.opacity = born; shadow.position.y = -size * 0.62 - group.position.y * 0.3;
        bg.material.uniforms.uTime.value = t; motes.material.uniforms.uTime.value = t;
        renderer.render(scene, camera);
    });

    return {
        setImage,
        destroy() {
            stop(); ro.disconnect();
            ['pointerdown', 'pointermove', 'pointerup', 'pointerleave', 'pointercancel'].forEach((n) => host.removeEventListener(n, { pointerdown: down, pointermove: move, pointerup: up, pointerleave: leave, pointercancel: up }[n]));
            tex?.dispose(); front.material.dispose(); slabs.forEach((m) => m.material.dispose()); shadow.material.dispose(); geo.dispose();
            renderer.dispose(); renderer.forceContextLoss?.();
        },
    };
}
