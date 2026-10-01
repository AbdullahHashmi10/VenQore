import { useEffect, useRef, useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    ArrowRight, Delete, Eye, EyeOff, Hash, Loader2, Lock, Mail, Shield,
} from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import {
    AuthButton, AuthField, AuthForm, AuthNotice, AuthStack,
} from '@/Components/Auth';
import { Button } from '@/Components/ds/core/Button';

/**
 * PlatformOwner/Login.jsx — the platform owner's door, at /VenQore-login.
 *
 * Two ways in: the credential form, and a PIN for the owner who has set one.
 * This is an internal operations screen, so it carries no route back to the
 * marketing site.
 *
 * ── What this file was ──────────────────────────────────────────────────────
 *
 * Layout E of the five the auth family used to have, and the reason the shell
 * exists. Six hundred lines, of which roughly four hundred were a template
 * string of CSS injected into the document as a style tag, plus inline style
 * objects on nearly every element. It shared no measurement, no colour and no
 * typeface with any other screen in the product.
 *
 * What went, and why:
 *   · **A web-font import for a typeface the product does not ship, written
 *     inside the CSS-in-JS.** The repo bans font-CDN imports, but the check
 *     only reads the stylesheet and Blade directories, so an import buried in a
 *     JavaScript template string slipped past it and pulled a third-party font
 *     on every load of this page. The design system already ships three faces;
 *     the shell uses them.
 *   · Every colour in the file was typed by hand — the page ground, the card,
 *     the borders, the button, the keypad, the focus states, the dots. Roughly
 *     twenty of them spelled out the pre-teal brand hue as a colour triplet,
 *     which is why this screen stayed on the old identity through the rebrand:
 *     a colour written inside a string is invisible to a class-level rename.
 *     Zero design-system tokens in six hundred lines. All of it is tokens now.
 *   · The animated background: a field of eighteen drifting particles, two
 *     floating orbs, a ruled overlay, a pulsing glow around the card and a
 *     slide-up entrance. §14 forbids ambient motion inside the product outright,
 *     and §13 forbids hero art on an auth screen specifically.
 *   · The logo tile. The shell places the wordmark above the card.
 *   · The hand-rolled field pair and their shake-on-error keyframes, the
 *     hand-rolled gradient submit with a sweeping highlight on hover, and the
 *     two hand-rolled mode tabs. All ds components now.
 *   · The combined error banner. Each error now shows against the control it
 *     belongs to — the two credential fields carry their own, and the PIN error
 *     sits under the dots, which is where the PIN's only control is.
 *
 * NOTE: none of the class or colour names behind those descriptions are written
 * out above. Tailwind scans raw file text, so a class quoted in a comment is a
 * class that gets generated.
 *
 * ── What stayed ─────────────────────────────────────────────────────────────
 *
 * Both `useForm` shapes, both POST targets, the mode switch and its default,
 * the physical-keyboard handling for the PIN, the visually-hidden numeric input
 * that brings up a phone keypad, the four-digit minimum before submit, the
 * eight-digit ceiling, the password reveal, and every line of operations copy.
 *
 * One substitution: the email field used to be focused through a ref. The
 * shared field component is not a ref-forwarding wrapper, so the two timed
 * focus calls now look the field up by its `id`. Same element, same delays.
 */
const EMAIL_FIELD_ID = 'hq-email';

export default function PlatformOwnerLogin({ status, has_pin_enabled = false, flash }) {
    const [mode, setMode] = useState(has_pin_enabled ? 'pin' : 'password');
    const [showPassword, setShowPassword] = useState(false);
    const pinInputRef = useRef(null);
    const submitPinRef = useRef(null);
    const pinValueRef = useRef('');

    // Password login form
    const pwForm = useForm({ email: '', password: '', remember: true });

    // PIN login form
    const pinForm = useForm({ pin: '' });

    const focusEmail = () => document.getElementById(EMAIL_FIELD_ID)?.focus();

    useEffect(() => {
        if (mode === 'password') {
            setTimeout(focusEmail, 600);
        }
    }, []);

    useEffect(() => {
        if (mode === 'password') {
            setTimeout(focusEmail, 200);
        }
    }, [mode]);

    // ── Physical-keyboard support for PIN mode (Roadmap T1.8) ───────────────
    // PIN mode previously only accepted on-screen button taps. Mirror the
    // working pattern from PasscodeModal / SecurityPinModal: digits fill the
    // PIN, Backspace deletes, Enter submits. Also autofocus the hidden input.
    useEffect(() => {
        if (mode !== 'pin') return;

        // Focus the hidden numeric input (helps mobile bring up the keypad).
        setTimeout(() => pinInputRef.current?.focus(), 150);

        const onKeyDown = (e) => {
            const current = pinValueRef.current;
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                if (current.length < 8) pinForm.setData('pin', current + e.key);
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                pinForm.setData('pin', current.slice(0, -1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                submitPinRef.current?.();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    const submitPassword = (e) => {
        e.preventDefault();
        pwForm.post('/VenQore-login', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const submitPin = () => {
        if (pinForm.data.pin.length < 4) return;
        pinForm.post('/VenQore-login/pin', {
            preserveState: true,
            preserveScroll: true,
            onError: () => pinForm.setData('pin', ''),
        });
    };

    // Keep stable refs to the latest submitPin + pin value so the keydown
    // listener (registered once per mode) always sees current state.
    useEffect(() => {
        submitPinRef.current = submitPin;
        pinValueRef.current = pinForm.data.pin;
    });

    const handlePinKey = (key) => {
        if (key === 'del') {
            pinForm.setData('pin', pinForm.data.pin.slice(0, -1));
        } else if (pinForm.data.pin.length < 8) {
            const next = pinForm.data.pin + key;
            pinForm.setData('pin', next);
        }
    };

    return (
        <AuthLayout
            title="VenQore — Secure Access"
            heading="Welcome back, Abdullah"
            subheading="Secure access to your command center"
            back={false}
            footer={
                <span className="inline-flex items-center gap-2">
                    <Shield size={12} />
                    Rate-limited · Session-encrypted · Platform-restricted
                </span>
            }
        >
            <AuthStack gap={6}>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-quiet px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-text">
                    <Shield size={12} />
                    VenQore Platform HQ
                </span>

                {/* The mode switch. Two ds buttons at the 42px size rather than
                    the 48px auth button, so the pair reads as a switch above the
                    form rather than as two more things to submit. */}
                {has_pin_enabled && (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Button
                                full
                                type="button"
                                variant={mode === 'pin' ? 'soft' : 'ghost'}
                                onClick={() => setMode('pin')}
                                icon={<Hash size={14} />}
                            >
                                PIN Login
                            </Button>
                        </div>
                        <div className="flex-1">
                            <Button
                                full
                                type="button"
                                variant={mode === 'password' ? 'soft' : 'ghost'}
                                onClick={() => setMode('password')}
                                icon={<Lock size={14} />}
                            >
                                Password
                            </Button>
                        </div>
                    </div>
                )}

                {status ? <AuthNotice tone="success">{status}</AuthNotice> : null}
                {flash?.error ? <AuthNotice tone="danger">{flash.error}</AuthNotice> : null}

                {mode === 'pin' ? (
                    <PinPad
                        pin={pinForm.data.pin}
                        error={pinForm.errors.pin}
                        processing={pinForm.processing}
                        inputRef={pinInputRef}
                        onKey={handlePinKey}
                        onChange={(digits) => pinForm.setData('pin', digits)}
                        onSubmit={submitPin}
                        onUsePassword={has_pin_enabled ? null : () => setMode('password')}
                    />
                ) : (
                    <AuthForm onSubmit={submitPassword}>
                        <AuthField
                            id={EMAIL_FIELD_ID}
                            label="Email Address"
                            type="email"
                            name="email"
                            value={pwForm.data.email}
                            onChange={(e) => pwForm.setData('email', e.target.value)}
                            placeholder="your@email.com"
                            autoComplete="email"
                            prefix={<Mail size={16} />}
                            error={pwForm.errors.email}
                        />

                        <AuthField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={pwForm.data.password}
                            onChange={(e) => pwForm.setData('password', e.target.value)}
                            placeholder="••••••••••••"
                            autoComplete="current-password"
                            prefix={<Lock size={16} />}
                            suffix={<RevealToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
                            error={pwForm.errors.password}
                        />

                        <AuthButton
                            type="submit"
                            disabled={pwForm.processing}
                            iconAfter={pwForm.processing ? null : <ArrowRight size={16} />}
                        >
                            {pwForm.processing ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" /> Authenticating…
                                </>
                            ) : (
                                'Enter Command Center'
                            )}
                        </AuthButton>

                        {has_pin_enabled && (
                            <AuthButton
                                variant="ghost"
                                onClick={() => setMode('pin')}
                                icon={<Hash size={14} />}
                            >
                                Switch to PIN login
                            </AuthButton>
                        )}
                    </AuthForm>
                )}
            </AuthStack>
        </AuthLayout>
    );
}

/**
 * The PIN pad — the same 3×4 grid, dot row and key treatment as the cashier
 * pad on Auth/Login.jsx, so the two numeric doors into the product are one
 * pattern rather than two.
 *
 * Three things it keeps that the cashier pad does not have, because they are
 * behaviour rather than decoration: the visually-hidden numeric input, which is
 * what raises a keypad on a phone and gives the pad a real focus target; the
 * four-digit minimum before the submit key becomes usable; and the spinner
 * while the PIN is in flight.
 */
function PinPad({ pin, error, processing, inputRef, onKey, onChange, onSubmit, onUsePassword }) {
    const key =
        'h-14 rounded-md bg-sunken text-xl font-semibold text-ink transition-colors duration-fast ' +
        'hover:bg-interactive-hover active:bg-interactive-active';

    return (
        <AuthStack gap={6}>
            <div className="text-center">
                <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Enter your PIN
                </p>

                <div className="flex min-h-[14px] items-center justify-center gap-2.5" aria-hidden="true">
                    {pin.split('').map((_, i) => (
                        <span
                            key={i}
                            className={`h-3 w-3 rounded-full ${error ? 'bg-danger-500' : 'bg-accent-fill'}`}
                        />
                    ))}
                </div>

                {/* Visually hidden, still focusable: brings up the mobile keypad
                    and gives the PIN area a real focus target. Desktop typing is
                    handled by the window keydown listener on the page. */}
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label="Enter your PIN"
                    className="sr-only"
                    value={pin}
                    onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                />

                {error ? <p className="mt-4 text-sm font-medium text-danger-600">{error}</p> : null}
            </div>

            <div className="mx-auto grid w-full max-w-[280px] grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                        key={n}
                        type="button"
                        className={key}
                        onClick={() => onKey(String(n))}
                    >
                        {n}
                    </button>
                ))}
                <button
                    type="button"
                    aria-label="Delete last digit"
                    className={`${key} flex items-center justify-center text-ink-muted`}
                    onClick={() => onKey('del')}
                >
                    <Delete size={20} />
                </button>
                <button
                    type="button"
                    className={key}
                    onClick={() => onKey('0')}
                >
                    0
                </button>
                <button
                    type="button"
                    aria-label="Sign in"
                    onClick={onSubmit}
                    disabled={pin.length < 4 || processing}
                    className="flex h-14 items-center justify-center rounded-md bg-accent-fill text-accent-on transition-colors duration-fast hover:bg-accent-fill-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {processing ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                </button>
            </div>

            {onUsePassword ? (
                <AuthButton variant="ghost" onClick={onUsePassword} icon={<Lock size={14} />}>
                    Use password instead
                </AuthButton>
            ) : null}
        </AuthStack>
    );
}

/**
 * The password reveal. A bare <button> rather than a ds Button because it lives
 * inside the input's 48px suffix slot, where a control with its own padding and
 * radius does not fit. It carries no chrome of its own — only the two ink
 * tokens the ds input already uses for its affordances.
 */
function RevealToggle({ shown, onToggle }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={shown ? 'Hide password' : 'Show password'}
            className="flex items-center text-ink-muted transition-colors duration-fast hover:text-ink-secondary"
        >
            {shown ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
    );
}
