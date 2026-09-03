import { useEffect, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthCheckbox, AuthField, AuthForm, AuthNotice, AuthStack } from '@/Components/Auth';

/**
 * Staff sign-in — the platform-staff door, at /staff-login.
 *
 * Same shell as every other auth screen now. It is the same act as signing in
 * to a store account, so it has no business looking like a different product.
 *
 * What went, and why:
 *   · The 45/55 split-screen: the "Staff Hub." slab, the two `ShieldCheck`
 *     reassurance chips, three ambient 140px blur clouds and an inline
 *     50px grid pattern. §13: "single centred card … No hero art, no gradient,
 *     no canvas."
 *   · The deep `void` page ground. Its two siblings sat one stop darker on the
 *     same family — one shade apart for no reason anyone could name, which is
 *     exactly the drift the shared shell exists to end. Both grounds are gone;
 *     the shell is on `bg-app`.
 *   · The plum theme. This screen was `violet` end to end — label, focus
 *     border, focus wash, the badge, the selection colour. A codemod had
 *     already renamed the classes to `brand-*`, but it could not see inside the
 *     arbitrary-value hover shadow, whose rgba triplet spelled out plum-500 by
 *     hand — so the submit button was still throwing a plum glow. Gone with the
 *     rest.
 *   · The white-on-void submit button with `uppercase tracking-[0.1em]`, which
 *     was the only inverted primary in the product.
 *   · `<style>{'* { font-family: Inter }'}</style>`, the same page-wide font
 *     override Login.jsx carried.
 *   · An `axios` import the file never used.
 *
 * Behaviour is untouched: same `useForm` fields, same POST to /staff-login,
 * same password reveal, same link back to the store login.
 */
export default function StaffLogin({ status, flash }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => () => reset('password'), []);

    const submit = (e) => {
        e.preventDefault();
        post('/staff-login', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout
            title="Staff sign-in"
            heading="Staff sign-in"
            subheading="Please authenticate using your credentials to enter the cockpit."
            footer={
                <Link
                    href={route('login')}
                    className="font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                >
                    ← Regular store account login
                </Link>
            }
        >
            <AuthStack gap={6}>
                {status ? <AuthNotice tone="success">{status}</AuthNotice> : null}
                {flash?.error ? <AuthNotice tone="danger">{flash.error}</AuthNotice> : null}

                <AuthForm onSubmit={submit}>
                    <AuthField
                        label="Email address"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="yourname@venqore.com"
                        autoComplete="username"
                        autoFocus
                        prefix={<Mail size={16} />}
                        error={errors.email}
                    />

                    <AuthField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        prefix={<Lock size={16} />}
                        suffix={<RevealToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
                        error={errors.password}
                    />

                    <AuthCheckbox
                        checked={data.remember}
                        onChange={(v) => setData('remember', v)}
                        label="Remember me"
                    />

                    <AuthButton
                        type="submit"
                        disabled={processing}
                        iconAfter={processing ? null : <ArrowRight size={16} />}
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Authorizing…
                            </>
                        ) : (
                            'Enter Staff Hub'
                        )}
                    </AuthButton>
                </AuthForm>
            </AuthStack>
        </AuthLayout>
    );
}

/**
 * The password reveal. It is a bare <button> rather than a ds `Button` because
 * it lives inside the input's 48px suffix slot, where a control with its own
 * 22px padding and 20px radius does not fit. It carries no chrome of its own —
 * only the two ink tokens the ds input already uses for its affordances — and
 * it exists because deleting it would be a behaviour change, not a restyle.
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
