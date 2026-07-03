import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
   THE LEDGER ENGINE — VenQore's one signature 3D moment (home hero only).

   Motion that explains: transaction cubes stream into the Qore (an echo of
   the VenQore logo — a lattice cube) and every one that enters comes out as
   TWO — a debit and a credit — settling onto two columns whose heights are
   always exactly equal. A brass beam rests dead level across both. That is
   double-entry, shown instead of told.

   Engineering notes:
   - Loaded lazily (dynamic import) only on capable devices; never in the
     main bundle. See useEnhancedCapability() in MarketingLayout.
   - Fully procedural: primitives + light. No downloaded models or textures.
   - Deterministic timeline (pure function of elapsed time) → no drift, no
     state bugs, trivial pause/resume.
   - One InstancedMesh for every transaction cube. DPR capped at 1.75.
   - `active=false` (hero off-screen / tab hidden) freezes the frameloop.
   ═══════════════════════════════════════════════════════════════════════════ */

const MINT = new THREE.Color('#7FE9CE');
const MINT_DIM = new THREE.Color('#3fbc9d');
const TEAL = new THREE.Color('#1E7E82');
const BRASS = new THREE.Color('#C4A468');

/* Composition */
const SPAWN = new THREE.Vector3(7.6, 3.3, -1.4);   // transactions arrive from the right (the till)
const CORE = new THREE.Vector3(1.85, 1.95, 0);      // the Qore
const DEBIT_X = -3.55;                              // left column (Dr)
const CREDIT_X = -1.75;                             // right column (Cr)
const STACK_TOP_Y = 3.15;                           // new pairs land here, then sink
const STACK_Z = 0;
const UNIT = 0.66;                                  // vertical pitch of the stack
const ROWS = 7;                                     // visible rows per column
const P = 1.15;                                     // seconds between transactions
const F = 1.35;                                     // fly-in duration
const S = 0.95;                                     // split/settle duration
const CUBE = 0.46;                                  // cube edge

const easeInOut = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();

/* All moving transaction cubes, driven by one clock */
function TransactionCubes() {
    const ref = useRef();
    const COUNT = ROWS * 2 + 18; // stack + in-flight headroom

    const { geometry, material } = useMemo(() => ({
        geometry: new THREE.BoxGeometry(CUBE, CUBE, CUBE),
        material: new THREE.MeshStandardMaterial({
            color: MINT_DIM, emissive: MINT, emissiveIntensity: 0.38,
            roughness: 0.32, metalness: 0.15,
        }),
    }), []);
    useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);

    useFrame(({ clock }) => {
        const mesh = ref.current;
        if (!mesh) return;
        const t = clock.getElapsedTime() + (F + S) + P * (ROWS + 1); // pre-warm: stack starts populated
        let i = 0;

        const kNewest = Math.floor(t / P);               // newest spawned transaction
        const sCont = (t - F - S) / P;                    // continuous "absorbed" count → conveyor
        const kOldest = Math.max(0, Math.ceil(sCont - ROWS) - 1);

        for (let k = kOldest; k <= kNewest && i < COUNT - 2; k++) {
            const tk = t - k * P;                         // age of transaction k
            if (tk < 0) continue;

            if (tk < F) {
                /* Phase 1 — fly toward the Qore */
                const u = easeInOut(tk / F);
                _p.lerpVectors(SPAWN, CORE, u);
                _p.y += Math.sin(u * Math.PI) * 0.85;     // gentle arc
                _e.set(tk * 2.1, tk * 2.7, 0);
                _q.setFromEuler(_e);
                const sc = 0.55 + 0.45 * Math.min(1, u * 3);
                _s.setScalar(sc);
                _m.compose(_p, _q, _s);
                mesh.setMatrixAt(i++, _m);
            } else if (tk < F + S) {
                /* Phase 2 — one in, two out: debit & credit settle on the columns */
                const u = easeOut((tk - F) / S);
                for (const x of [DEBIT_X, CREDIT_X]) {
                    _p.set(
                        CORE.x + (x - CORE.x) * u,
                        CORE.y + (STACK_TOP_Y - CORE.y) * u + Math.sin(u * Math.PI) * 1.15,
                        CORE.z + (STACK_Z - CORE.z) * u
                    );
                    _e.set(0, (1 - u) * 1.8, 0);
                    _q.setFromEuler(_e);
                    _s.setScalar(0.72 + 0.28 * u);
                    _m.compose(_p, _q, _s);
                    mesh.setMatrixAt(i++, _m);
                }
            } else {
                /* Phase 3 — on the stack; the whole ledger sinks as business flows in */
                const depth = sCont - k;                  // 0 = just landed (top)
                if (depth > ROWS) continue;
                const y = STACK_TOP_Y - depth * UNIT;
                const fade = depth > ROWS - 1 ? Math.max(0, 1 - (depth - (ROWS - 1))) : 1;
                if (fade <= 0.01) continue;
                _q.identity();
                _s.setScalar(fade);
                for (const x of [DEBIT_X, CREDIT_X]) {
                    _p.set(x, y, STACK_Z);
                    _m.compose(_p, _q, _s);
                    mesh.setMatrixAt(i++, _m);
                }
            }
        }

        /* park unused instances out of sight */
        _s.setScalar(0.0001);
        _q.identity();
        _p.set(0, -100, 0);
        _m.compose(_p, _q, _s);
        for (; i < COUNT; i++) mesh.setMatrixAt(i, _m);

        mesh.instanceMatrix.needsUpdate = true;
    });

    return <instancedMesh ref={ref} args={[geometry, material, COUNT]} frustumCulled={false} />;
}

/* The Qore — lattice cube echoing the VenQore logo, slowly turning */
function Qore() {
    const group = useRef();
    const { boxGeo, edgeGeo, faceMat, coreMat, edgeMat } = useMemo(() => {
        const bg = new THREE.BoxGeometry(0.34, 0.34, 0.34);
        const outer = new THREE.BoxGeometry(1.7, 1.7, 1.7);
        return {
            boxGeo: bg,
            edgeGeo: new THREE.EdgesGeometry(outer),
            faceMat: new THREE.MeshStandardMaterial({ color: TEAL, roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.85 }),
            coreMat: new THREE.MeshStandardMaterial({ color: MINT, emissive: MINT, emissiveIntensity: 1.1 }),
            edgeMat: new THREE.LineBasicMaterial({ color: MINT, transparent: true, opacity: 0.5 }),
        };
    }, []);
    useEffect(() => () => { boxGeo.dispose(); edgeGeo.dispose(); faceMat.dispose(); coreMat.dispose(); edgeMat.dispose(); }, []);

    const cells = useMemo(() => {
        const out = [];
        for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
            if (Math.abs(x) + Math.abs(y) + Math.abs(z) === 3) out.push([x * 0.5, y * 0.5, z * 0.5]); // corners only — open lattice
        }
        return out;
    }, []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (group.current) {
            group.current.rotation.y = t * 0.35;
            group.current.rotation.x = Math.sin(t * 0.22) * 0.12;
        }
    });

    return (
        <group ref={group} position={CORE.toArray()}>
            {cells.map((p, idx) => <mesh key={idx} geometry={boxGeo} material={faceMat} position={p} />)}
            <mesh geometry={boxGeo} material={coreMat} scale={1.35} />
            <lineSegments geometry={edgeGeo} material={edgeMat} />
        </group>
    );
}

/* The brass beam — always dead level across both columns */
function Beam() {
    const ref = useRef();
    const mat = useMemo(() => new THREE.MeshStandardMaterial({
        color: BRASS, roughness: 0.25, metalness: 0.75,
        emissive: BRASS, emissiveIntensity: 0.08,
    }), []);
    useEffect(() => () => mat.dispose(), [mat]);
    useFrame(({ clock }) => {
        if (ref.current) ref.current.position.y = STACK_TOP_Y + 0.75 + Math.sin(clock.getElapsedTime() * 0.8) * 0.045;
    });
    const cx = (DEBIT_X + CREDIT_X) / 2;
    return (
        <group>
            <mesh ref={ref} position={[cx, STACK_TOP_Y + 0.75, STACK_Z]} material={mat}>
                <boxGeometry args={[Math.abs(DEBIT_X - CREDIT_X) + 1.5, 0.075, 0.075]} />
            </mesh>
            {/* one slim plinth under both columns — mirrors the beam */}
            <mesh position={[cx, STACK_TOP_Y - ROWS * UNIT - 0.18, STACK_Z]} material={mat}>
                <boxGeometry args={[Math.abs(DEBIT_X - CREDIT_X) + 1.5, 0.075, 0.55]} />
            </mesh>
        </group>
    );
}

/* Camera rig — pointer parallax + faint scroll orbit. All gentle. */
function Rig() {
    const target = useMemo(() => new THREE.Vector3(-0.4, 1.6, 0), []);
    useFrame(({ camera, pointer }) => {
        const scroll = typeof window !== 'undefined' ? Math.min(1, window.scrollY / (window.innerHeight || 1)) : 0;
        const gx = pointer.x * 0.55 + scroll * 1.2;
        const gy = 2.3 + pointer.y * 0.35 + scroll * 0.8;
        camera.position.x += (gx - camera.position.x) * 0.045;
        camera.position.y += (gy - camera.position.y) * 0.045;
        camera.lookAt(target);
    });
    return null;
}

export default function LedgerEngineScene({ active = true }) {
    return (
        <Canvas
            frameloop={active ? 'always' : 'never'}
            dpr={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.75) : 1}
            gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
            camera={{ position: [0, 2.3, 10.2], fov: 42 }}
            style={{ width: '100%', height: '100%' }}
            aria-hidden="true"
        >
            <fog attach="fog" args={['#071614', 12, 24]} />
            <ambientLight intensity={0.55} color="#bfe9df" />
            <directionalLight position={[6, 9, 6]} intensity={0.9} color="#eafff7" />
            <pointLight position={[2.3, 2.6, 2.2]} intensity={14} color="#7FE9CE" distance={9} decay={2} />
            <pointLight position={[-2.6, 4.4, 2.5]} intensity={6} color="#C4A468" distance={8} decay={2} />
            <TransactionCubes />
            <Qore />
            <Beam />
            <Rig />
        </Canvas>
    );
}
