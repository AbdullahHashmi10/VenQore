import { useState, useEffect, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Lock, Mail, ArrowRight, Shield, Eye, EyeOff, AlertCircle, Delete, Hash } from 'lucide-react';

// ─── CSS ───────────────────────────────────────────────────────────────────
const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes float-orb {
        0%, 100% { transform: scale(1) translate(0,0); opacity: 0.6; }
        33% { transform: scale(1.08) translate(20px,-30px); opacity: 1; }
        66% { transform: scale(0.95) translate(-15px,20px); opacity: 0.7; }
    }
    @keyframes float-particle {
        0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
        50% { transform: translateY(-28px) translateX(14px) scale(1.15); opacity: 0.7; }
    }
    @keyframes slide-up {
        from { opacity: 0; transform: translateY(28px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes glow-pulse {
        0%,100% { opacity: 0.5; }
        50%      { opacity: 1; }
    }
    @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%     { transform: translateX(-8px); }
        40%     { transform: translateX(8px); }
        60%     { transform: translateX(-5px); }
        80%     { transform: translateX(5px); }
    }
    @keyframes pin-bounce {
        0%  { transform: scale(0.5); opacity: 0; }
        70% { transform: scale(1.2); }
        100%{ transform: scale(1); opacity: 1; }
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    .hq-input {
        width: 100%;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 14px;
        padding: 13px 16px 13px 48px;
        color: #f1f5f9;
        font-size: 15px;
        font-family: 'Inter', sans-serif;
        outline: none;
        transition: all 0.25s;
    }
    .hq-input::placeholder { color: rgba(148,163,184,0.55); }
    .hq-input:focus {
        border-color: rgba(99,102,241,0.7);
        background: rgba(99,102,241,0.07);
        box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .hq-input.err { border-color: rgba(239,68,68,0.6); animation: shake 0.4s ease; }
    .hq-input.pr  { padding-right: 48px; }

    .hq-btn {
        width: 100%; padding: 14px;
        border-radius: 14px; border: none;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #7c3aed 100%);
        color: #fff; font-size: 15px; font-weight: 700;
        font-family: 'Inter', sans-serif;
        cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
        transition: all 0.25s; letter-spacing: 0.02em;
        box-shadow: 0 6px 28px rgba(99,102,241,0.4);
        position: relative; overflow: hidden;
    }
    .hq-btn:hover:not(:disabled) {
        box-shadow: 0 10px 36px rgba(99,102,241,0.55);
        transform: translateY(-1px);
    }
    .hq-btn:active:not(:disabled) { transform: scale(0.98); }
    .hq-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
    .hq-btn::after {
        content: ''; position: absolute;
        top: -50%; left: -60%; width: 50%; height: 200%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
        transform: skewX(-20deg); transition: left 0.6s;
    }
    .hq-btn:hover::after { left: 120%; }

    .pin-key {
        height: 58px; border-radius: 14px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.09);
        color: #f1f5f9; font-size: 20px; font-weight: 700;
        font-family: 'Inter', sans-serif;
        cursor: pointer; transition: all 0.15s;
        display: flex; align-items: center; justify-content: center;
    }
    .pin-key:hover {
        background: rgba(99,102,241,0.18);
        border-color: rgba(99,102,241,0.4);
        transform: scale(1.04);
    }
    .pin-key:active { transform: scale(0.95); }
    .pin-key.del {
        background: rgba(239,68,68,0.06);
        border-color: rgba(239,68,68,0.15);
        color: rgba(239,68,68,0.7);
    }
    .pin-key.del:hover {
        background: rgba(239,68,68,0.14);
        border-color: rgba(239,68,68,0.35);
        color: #ef4444;
    }
    .pin-key.submit {
        background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.25));
        border-color: rgba(99,102,241,0.5);
        color: #a5b4fc;
    }
    .pin-key.submit:hover {
        background: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4));
        color: #fff;
    }

    .toggle-mode {
        background: none; border: none; cursor: pointer;
        font-family: 'Inter', sans-serif;
        color: rgba(148,163,184,0.6); font-size: 12px; font-weight: 600;
        letter-spacing: 0.04em; transition: color 0.2s;
        display: flex; align-items: center; gap: 6px;
        padding: 6px 0;
    }
    .toggle-mode:hover { color: #a5b4fc; }

    .mode-tab {
        flex: 1; padding: 9px; border-radius: 10px; border: none;
        font-size: 13px; font-weight: 700; cursor: pointer;
        font-family: 'Inter', sans-serif;
        transition: all 0.2s;
    }
    .mode-tab.active {
        background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2));
        color: #a5b4fc; border: 1px solid rgba(99,102,241,0.35);
    }
    .mode-tab.inactive {
        background: transparent; color: rgba(148,163,184,0.5);
        border: 1px solid transparent;
    }
    .mode-tab.inactive:hover { color: rgba(148,163,184,0.8); }
`;

// ─── Particle Field ─────────────────────────────────────────────────────────
function ParticleField() {
    const particles = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        size: Math.random() * 3 + 2,
        top: Math.random() * 100,
        left: Math.random() * 100,
        duration: Math.random() * 8 + 6,
        delay: -(Math.random() * 8),
        color: Math.random() > 0.5 ? '99,102,241' : '139,92,246',
    }));
    return (
        <>
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute',
                    width: p.size + 'px', height: p.size + 'px',
                    borderRadius: '50%',
                    background: `rgba(${p.color},${Math.random() * 0.4 + 0.15})`,
                    top: p.top + '%', left: p.left + '%',
                    animation: `float-particle ${p.duration}s ease-in-out infinite`,
                    animationDelay: `${p.delay}s`,
                    filter: 'blur(0.5px)',
                    pointerEvents: 'none',
                }} />
            ))}
        </>
    );
}

// ─── PIN Dot Display ────────────────────────────────────────────────────────
function PinDots({ value, maxLen = 8, hasError }) {
    const filled = Math.min(value.length, maxLen);
    return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, minHeight: 20 }}>
            {Array.from({ length: maxLen }, (_, i) => (
                <div key={i} style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: i < filled
                        ? (hasError ? '#ef4444' : '#6366f1')
                        : 'rgba(255,255,255,0.1)',
                    border: i < filled
                        ? (hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(99,102,241,0.5)')
                        : '1px solid rgba(255,255,255,0.15)',
                    transition: 'all 0.2s',
                    transform: i < filled ? 'scale(1.15)' : 'scale(1)',
                    animation: i === filled - 1 && filled > 0 ? 'pin-bounce 0.25s ease' : 'none',
                }} />
            ))}
        </div>
    );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PlatformOwnerLogin({ status, has_pin_enabled = false }) {
    const [mode, setMode] = useState(has_pin_enabled ? 'pin' : 'password');
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(null);
    const [mounted, setMounted] = useState(false);
    const emailRef = useRef(null);

    // Password login form
    const pwForm = useForm({ email: '', password: '', remember: true });

    // PIN login form
    const pinForm = useForm({ pin: '' });

    useEffect(() => {
        setMounted(true);
        if (mode === 'password') {
            setTimeout(() => emailRef.current?.focus(), 600);
        }
    }, []);

    useEffect(() => {
        if (mode === 'password') {
            setTimeout(() => emailRef.current?.focus(), 200);
        }
    }, [mode]);

    const submitPassword = (e) => {
        e.preventDefault();
        pwForm.post(route('platform.login.store'));
    };

    const submitPin = () => {
        if (pinForm.data.pin.length < 4) return;
        pinForm.post(route('platform.login.pin'), {
            onError: () => pinForm.setData('pin', ''),
        });
    };

    const handlePinKey = (key) => {
        if (key === 'del') {
            pinForm.setData('pin', pinForm.data.pin.slice(0, -1));
        } else if (pinForm.data.pin.length < 8) {
            const next = pinForm.data.pin + key;
            pinForm.setData('pin', next);
            if (next.length >= 4) {
                // Auto-submit if user presses ⏎ or manually presses more than needed
            }
        }
    };

    const hasError = pwForm.errors.email || pwForm.errors.password || pinForm.errors.pin;

    return (
        <div style={{
            minHeight: '100vh', width: '100%',
            background: 'radial-gradient(ellipse at 20% 50%, rgba(25,15,55,0.95) 0%, #06080f 55%, #020304 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
            position: 'relative', overflow: 'hidden',
            padding: '20px',
        }}>
            <Head title="VenQore — Secure Access" />
            <style>{css}</style>

            {/* Background */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', top: '-15%', left: '-10%',
                    width: '55%', height: '55%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                    animation: 'float-orb 12s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-15%', right: '-5%',
                    width: '45%', height: '45%', borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    animation: 'float-orb 16s ease-in-out infinite',
                    animationDelay: '-5s',
                }} />
                {/* Grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)`,
                    backgroundSize: '64px 64px',
                }} />
                <ParticleField />
            </div>

            {/* Card */}
            <div style={{
                position: 'relative', width: '100%', maxWidth: 440,
                opacity: mounted ? 1 : 0,
                animation: mounted ? 'slide-up 0.65s cubic-bezier(0.16,1,0.3,1) forwards' : 'none',
            }}>
                {/* Glow border */}
                <div style={{
                    position: 'absolute', inset: -1, borderRadius: 28,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.45), rgba(139,92,246,0.2), rgba(99,102,241,0.1))',
                    filter: 'blur(1px)',
                    animation: 'glow-pulse 4s ease-in-out infinite',
                }} />

                <div style={{
                    position: 'relative',
                    background: 'rgba(8, 10, 24, 0.88)',
                    backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
                    borderRadius: 28,
                    border: '1px solid rgba(99,102,241,0.18)',
                    padding: '44px 40px',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)',
                }}>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 70, height: 70, borderRadius: 20, marginBottom: 20,
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                            border: '1px solid rgba(99,102,241,0.35)',
                            boxShadow: '0 0 28px rgba(99,102,241,0.2)',
                        }}>
                            <img src="/images/logo.png" alt="VenQore"
                                style={{ width: 42, height: 42, objectFit: 'contain' }}
                                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                            <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={30} color="#6366f1" />
                            </div>
                        </div>

                        <div style={{
                            fontSize: 10, fontWeight: 800, letterSpacing: '0.2em',
                            textTransform: 'uppercase', color: 'rgba(99,102,241,0.8)',
                            marginBottom: 9,
                        }}>VenQore Platform HQ</div>

                        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 6 }}>
                            Welcome back, Abdullah
                        </h1>
                        <p style={{ fontSize: 13, color: 'rgba(148,163,184,0.65)', lineHeight: 1.5 }}>
                            Secure access to your command center
                        </p>
                    </div>

                    {/* Mode Switch Tabs */}
                    {has_pin_enabled && (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 13, padding: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <button className={`mode-tab ${mode === 'pin' ? 'active' : 'inactive'}`}
                                onClick={() => setMode('pin')} type="button">
                                # &nbsp;PIN Login
                            </button>
                            <button className={`mode-tab ${mode === 'password' ? 'active' : 'inactive'}`}
                                onClick={() => setMode('password')} type="button">
                                <Lock style={{ display: 'inline', width: 12, height: 12, marginRight: 5 }} />
                                Password
                            </button>
                        </div>
                    )}

                    {/* Status */}
                    {status && (
                        <div style={{
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                            borderRadius: 12, padding: '11px 16px', marginBottom: 20,
                            fontSize: 13, color: '#34d399', display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            {status}
                        </div>
                    )}

                    {/* Error */}
                    {hasError && (
                        <div style={{
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
                            borderRadius: 12, padding: '11px 16px', marginBottom: 20,
                            fontSize: 13, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8,
                            animation: 'fade-in 0.3s ease',
                        }}>
                            <AlertCircle size={15} style={{ flexShrink: 0 }} />
                            {pwForm.errors.email || pwForm.errors.password || pinForm.errors.pin}
                        </div>
                    )}

                    {/* ── PIN Mode ── */}
                    {mode === 'pin' && (
                        <div style={{ animation: 'fade-in 0.3s ease' }}>
                            <div style={{ marginBottom: 24, textAlign: 'center' }}>
                                <p style={{ fontSize: 12, color: 'rgba(100,116,139,0.8)', marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 700 }}>
                                    Enter your PIN
                                </p>
                                <PinDots value={pinForm.data.pin} hasError={!!pinForm.errors.pin} />
                            </div>

                            {/* Number Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
                                {[1,2,3,4,5,6,7,8,9].map(n => (
                                    <button key={n} type="button" className="pin-key"
                                        onClick={() => handlePinKey(String(n))}>
                                        {n}
                                    </button>
                                ))}
                                {/* Row 4 */}
                                <button type="button" className="pin-key del"
                                    onClick={() => handlePinKey('del')}>
                                    <Delete size={20} />
                                </button>
                                <button type="button" className="pin-key"
                                    onClick={() => handlePinKey('0')}>
                                    0
                                </button>
                                <button type="button"
                                    className={`pin-key submit ${pinForm.data.pin.length >= 4 ? '' : ''}`}
                                    onClick={submitPin}
                                    disabled={pinForm.data.pin.length < 4 || pinForm.processing}
                                    style={{ opacity: pinForm.data.pin.length < 4 ? 0.35 : 1 }}>
                                    {pinForm.processing ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                                            <path d="M21 12a9 9 0 11-6.219-8.56" />
                                        </svg>
                                    ) : <ArrowRight size={20} />}
                                </button>
                            </div>

                            {!has_pin_enabled && (
                                <button type="button" className="toggle-mode"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    onClick={() => setMode('password')}>
                                    <Lock size={12} /> Use password instead
                                </button>
                            )}
                        </div>
                    )}

                    {/* ── Password Mode ── */}
                    {mode === 'password' && (
                        <form onSubmit={submitPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fade-in 0.3s ease' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Email Address
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)',
                                        color: focused === 'email' ? '#6366f1' : 'rgba(100,116,139,0.7)',
                                        transition: 'color 0.2s', pointerEvents: 'none',
                                    }}>
                                        <Mail size={17} />
                                    </div>
                                    <input ref={emailRef} type="email"
                                        className={`hq-input ${pwForm.errors.email ? 'err' : ''}`}
                                        value={pwForm.data.email}
                                        onChange={e => pwForm.setData('email', e.target.value)}
                                        onFocus={() => setFocused('email')}
                                        onBlur={() => setFocused(null)}
                                        placeholder="your@email.com"
                                        autoComplete="email" />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'rgba(148,163,184,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                                    Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)',
                                        color: focused === 'password' ? '#6366f1' : 'rgba(100,116,139,0.7)',
                                        transition: 'color 0.2s', pointerEvents: 'none',
                                    }}>
                                        <Lock size={17} />
                                    </div>
                                    <input type={showPassword ? 'text' : 'password'}
                                        className={`hq-input pr ${pwForm.errors.password ? 'err' : ''}`}
                                        value={pwForm.data.password}
                                        onChange={e => pwForm.setData('password', e.target.value)}
                                        onFocus={() => setFocused('password')}
                                        onBlur={() => setFocused(null)}
                                        placeholder="••••••••••••"
                                        autoComplete="current-password" />
                                    <button type="button" onClick={() => setShowPassword(v => !v)}
                                        style={{
                                            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'rgba(100,116,139,0.65)', padding: 4, display: 'flex', alignItems: 'center',
                                        }} tabIndex={-1}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: 4 }}>
                                <button type="submit" disabled={pwForm.processing} className="hq-btn">
                                    {pwForm.processing ? (
                                        <>
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                                                <path d="M21 12a9 9 0 11-6.219-8.56" />
                                            </svg>
                                            Authenticating…
                                        </>
                                    ) : (<>Enter Command Center <ArrowRight size={17} /></>)}
                                </button>
                            </div>

                            {has_pin_enabled && (
                                <button type="button" className="toggle-mode"
                                    style={{ justifyContent: 'center', width: '100%' }}
                                    onClick={() => setMode('pin')}>
                                    <Hash size={12} /> Switch to PIN login
                                </button>
                            )}
                        </form>
                    )}

                    {/* Footer */}
                    <div style={{
                        marginTop: 28, paddingTop: 22,
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                        <Shield size={12} color="rgba(100,116,139,0.45)" />
                        <span style={{ fontSize: 11, color: 'rgba(100,116,139,0.45)', letterSpacing: '0.02em' }}>
                            Rate-limited · Session-encrypted · Platform-restricted
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
