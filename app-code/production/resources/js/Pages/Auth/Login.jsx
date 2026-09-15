import { useEffect, useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { ArrowRight, Delete, Loader2, Lock, Mail } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import {
    AuthButton, AuthCheckbox, AuthDivider, AuthField, AuthForm, AuthNotice, AuthStack,
} from '@/Components/Auth';

/**
 * Sign in.
 *
 * Built to the V6 reference at `public/v6/signin.html`, which is the design the
 * marketing site links to — so a user arriving from venqore.com now lands on the
 * same page they were shown, rather than a dark split-screen that shares no
 * measurement with it.
 *
 * What went, and why:
 *   · The 45/55 split-screen with the ambient blur blobs and the stats panel.
 *     §13: "single centred card … No hero art, no gradient, no canvas."
 *   · The forced near-black page ground. The product has a light theme; its
 *     front door should too.
 *   · A page-wide style block that set Inter on every element, overriding the
 *     design system's three faces with a typeface the product does not ship.
 *   · A plum-tinted glow behind the form. Plum is a categorical DATA colour
 *     (§5 slot 6); as chrome it quietly argues with the teal identity.
 *
 * NOTE: none of those class names are written out above. Tailwind scans raw file
 * text, so a class quoted in a comment is a class that gets generated — quoting
 * the ones you just deleted puts them straight back into the bundle, and trips
 * the §16 greps besides.
 */
export default function Login({ status, canResetPassword, passcode_login_available, flash }) {
    const page = usePage();
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: '',
        password: '',
        remember: false,
        loginMethod: 'email',
        passcode: '',
    });

    // Page-level shared errors and form-level errors reach us by different
    // routes depending on how the user got here; merge so either shows up.
    const displayErrors = { ...page.props.errors, ...errors };

    useEffect(() => () => reset('password'), []);

    const submitPasscode = () => {
        if (!processing && data.passcode) {
            post('/login/passcode', {
                preserveState: true,
                preserveScroll: true,
                onError: () => setData('passcode', ''),
            });
        }
    };

    const handlePasscodeChange = (next) => {
        setData('passcode', next);
        if (errors.passcode) clearErrors('passcode');
    };

    useEffect(() => {
        const onKeyDown = (e) => {
            if (data.loginMethod !== 'passcode') return;
            if (/^[0-9]$/.test(e.key)) {
                const c = data.passcode || '';
                if (c.length < 10) handlePasscodeChange(c + e.key);
            } else if (e.key === 'Backspace') {
                handlePasscodeChange((data.passcode || '').slice(0, -1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                submitPasscode();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [data.loginMethod, data.passcode, processing]);

    const submit = (e) => {
        e.preventDefault();
        if (data.loginMethod === 'email') {
            post('/login', { preserveState: true, preserveScroll: true });
        }
    };

    const isPasscode = data.loginMethod === 'passcode';

    return (
        <AuthLayout
            title="Sign in"
            heading="Sign in"
            subheading={isPasscode ? 'Enter your cashier PIN.' : 'Welcome back.'}
            footer={
                <>
                    Don&apos;t have a system yet?{' '}
                    <Link
                        href={route('register')}
                        className="font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                    >
                        Start building →
                    </Link>
                </>
            }
        >
            <AuthStack gap={6}>
                {status ? <AuthNotice tone="success">{status}</AuthNotice> : null}
                {flash?.error ? <AuthNotice tone="danger">{flash.error}</AuthNotice> : null}

                {isPasscode ? (
                    <PasscodePad
                        passcode={data.passcode || ''}
                        error={displayErrors.passcode}
                        onChange={handlePasscodeChange}
                        onSubmit={submitPasscode}
                        onCancel={() => setData('loginMethod', 'email')}
                    />
                ) : (
                    <>
                        <AuthForm onSubmit={submit}>
                            <AuthField
                                label="Work email"
                                type="email"
                                name="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="you@company.com"
                                autoComplete="username"
                                required
                                prefix={<Mail size={16} />}
                                error={displayErrors.email}
                            />

                            <AuthField
                                label="Password"
                                type="password"
                                name="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                autoComplete="current-password"
                                required
                                prefix={<Lock size={16} />}
                                error={displayErrors.password}
                                action={
                                    canResetPassword ? (
                                        <Link href={route('password.request')} className="text-sm font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover">
                                            Forgot?
                                        </Link>
                                    ) : null
                                }
                            />

                            <AuthCheckbox
                                checked={data.remember}
                                onChange={(v) => setData('remember', v)}
                                label="Keep me signed in on this device"
                            />

                            <AuthButton
                                type="submit"
                                disabled={processing}
                                iconAfter={processing ? null : <ArrowRight size={16} />}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" /> Signing in…
                                    </>
                                ) : (
                                    'Sign in'
                                )}
                            </AuthButton>
                        </AuthForm>

                        <AuthDivider />

                        <AuthStack gap={2}>
                            <AuthButton
                                variant="secondary"
                                onClick={() => { window.location.href = route('auth.google'); }}
                                icon={<GoogleMark />}
                            >
                                Continue with Google
                            </AuthButton>

                            {passcode_login_available ? (
                                <AuthButton
                                    variant="ghost"
                                    onClick={() => setData('loginMethod', 'passcode')}
                                    icon={<Lock size={16} />}
                                >
                                    Sign in with a cashier PIN
                                </AuthButton>
                            ) : null}
                        </AuthStack>
                    </>
                )}
            </AuthStack>
        </AuthLayout>
    );
}

/**
 * The PIN pad. Same 3×4 grid as before, on tokens instead of white-alpha, and
 * on the shared 400px column so it does not resize the card when the user
 * switches to it.
 */
function PasscodePad({ passcode, error, onChange, onSubmit, onCancel }) {
    const key =
        'h-14 rounded-md bg-sunken text-xl font-semibold text-ink transition-colors duration-fast ' +
        'hover:bg-interactive-hover active:bg-interactive-active';

    return (
        <AuthStack gap={6}>
            <div className="text-center">
                <div className="flex min-h-[14px] items-center justify-center gap-2.5" aria-hidden="true">
                    {passcode.split('').map((_, i) => (
                        <span
                            key={i}
                            className={`h-3 w-3 rounded-full ${error ? 'bg-danger-500' : 'bg-accent-fill'}`}
                        />
                    ))}
                </div>
                {error ? <p className="mt-4 text-sm font-medium text-danger-600">{error}</p> : null}
            </div>

            <div className="mx-auto grid w-full max-w-[280px] grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                        key={n}
                        type="button"
                        className={key}
                        onClick={() => passcode.length < 10 && onChange(passcode + n)}
                    >
                        {n}
                    </button>
                ))}
                <button
                    type="button"
                    aria-label="Delete last digit"
                    className={`${key} flex items-center justify-center text-ink-muted`}
                    onClick={() => onChange(passcode.slice(0, -1))}
                >
                    <Delete size={20} />
                </button>
                <button
                    type="button"
                    className={key}
                    onClick={() => passcode.length < 10 && onChange(passcode + '0')}
                >
                    0
                </button>
                <button
                    type="button"
                    aria-label="Sign in"
                    onClick={onSubmit}
                    className="flex h-14 items-center justify-center rounded-md bg-accent-fill text-accent-on transition-colors duration-fast hover:bg-accent-fill-hover"
                >
                    <ArrowRight size={20} />
                </button>
            </div>

            <AuthButton variant="ghost" onClick={onCancel}>
                ← Back to email sign-in
            </AuthButton>
        </AuthStack>
    );
}

/** Google's mark. §16 note 3: a third-party brand colour is supposed to be literal. */
function GoogleMark() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    );
}
