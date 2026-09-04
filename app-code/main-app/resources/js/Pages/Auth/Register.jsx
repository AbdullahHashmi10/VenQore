import { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { ArrowRight, Loader2, Lock, Mail, User } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import {
    AuthButton, AuthCheckbox, AuthDivider, AuthField, AuthForm, AuthStack,
} from '@/Components/Auth';

/**
 * Sign up.
 *
 * Built to the V6 reference at `public/v6/register.html` — its heading, its
 * field order, its help text and its footer — on the shared auth shell, so the
 * page a visitor reaches from the marketing site is measurably the same page
 * they were shown.
 *
 * What went, and why:
 *   · The 45/55 split-screen: the benefits panel, the four feature tiles, the
 *     grid pattern and the three 140px ambient blur blobs. §13: "single
 *     centred card … No hero art, no gradient, no canvas."
 *   · The dark void page ground, and every white-alpha fill and hairline built
 *     on it. The card is `bg-surface`; the fields are the ds Input.
 *   · The local `AuthInput` — a hand-rolled field with an uppercase
 *     `tracking-[0.25em]` label and a gradient underline that animated on
 *     focus. §13 asks for a 13px sentence-case label above a 48px field.
 *   · `<style>{'* { font-family: Inter }'}</style>`, which overrode the design
 *     system's three faces for the whole page.
 *   · The password reveal toggle. There is no ds primitive for it, and the
 *     exemplar's password field does not carry one.
 *
 * What stayed: every `useForm` field, the `/register` POST, the 8-character
 * client guard, the terms gate on the submit button, and Google.
 *
 * The V6 reference also asks for a country select. `useForm` does not post one
 * and `RegisteredUserController::store()` does not validate one, so it is not
 * here — a field that goes nowhere is worse than a missing field.
 */
export default function Register() {
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const { data, setData, post, processing, errors, setError, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        shared_catalog_opt_in: false,
    });

    const submit = (e) => {
        e.preventDefault();
        if (data.password.length < 8) {
            setError('password', 'Password must be at least 8 characters.');
            return;
        }
        post('/register', {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Create your system"
            heading="Create your system"
            subheading="14 days, the full product, no card. You will see what it becomes before you decide anything."
            footer={
                <>
                    Already have a system?{' '}
                    <Link
                        href={route('login')}
                        className="font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                    >
                        Sign in →
                    </Link>
                </>
            }
        >
            <AuthStack gap={6}>
                <AuthForm onSubmit={submit}>
                    <AuthField
                        label="Your name"
                        type="text"
                        name="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        autoComplete="name"
                        autoFocus
                        required
                        prefix={<User size={16} />}
                        error={errors.name}
                    />

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
                        error={errors.email}
                        hint="We'll send the login link here."
                    />

                    {/* The reference says ten characters; the controller and the
                        guard above both say eight. The copy follows the rule the
                        server actually enforces. */}
                    <AuthField
                        label="Password"
                        type="password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                        prefix={<Lock size={16} />}
                        error={errors.password}
                        hint="At least 8 characters. This is the account that owns your ledger — make it a real one."
                    />

                    <AuthField
                        label="Confirm password"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        required
                        prefix={<Lock size={16} />}
                        error={errors.password_confirmation}
                    />

                    {/* Shared Product Catalogue Consent (Unticked by default) */}
                    <div className="rounded-xl border border-line bg-app/50 p-3 text-xs text-ink-muted">
                        <AuthCheckbox
                            id="shared-catalog-checkbox"
                            checked={data.shared_catalog_opt_in}
                            onChange={(checked) => setData('shared_catalog_opt_in', checked)}
                            label={
                                <div className="space-y-1">
                                    <span className="font-semibold text-ink">Help build the shared product catalogue</span>
                                    <p className="text-2xs text-ink-secondary leading-relaxed">
                                        Get thousands of common products pre-filled in your catalogue, confirmed by other shops. In return, product names you confirm are added to the shared pool.
                                    </p>
                                    <p className="text-2xs text-ink-faint">
                                        <strong className="text-ink-muted">Never shared:</strong> your prices, costs, stock, margins, customers, suppliers, or your business identity.
                                    </p>
                                </div>
                            }
                        />
                    </div>

                    {/* stopPropagation on the two links: the ds Checkbox wraps
                        its label in a <label>, so a click on anything inside it
                        is forwarded to the box. Without this, reading the Terms
                        silently un-ticks the thing you were agreeing to. */}
                    <AuthCheckbox
                        id="terms-checkbox"
                        checked={agreedToTerms}
                        onChange={setAgreedToTerms}
                        label={
                            <span>
                                I agree to the{' '}
                                <Link
                                    href={route('terms')}
                                    target="_blank"
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                                >
                                    Terms
                                </Link>{' '}
                                and the{' '}
                                <Link
                                    href={route('privacy')}
                                    target="_blank"
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                                >
                                    Privacy Policy
                                </Link>
                                .
                            </span>
                        }
                    />

                    <AuthButton
                        id="register-submit"
                        type="submit"
                        disabled={processing || !agreedToTerms}
                        iconAfter={processing ? null : <ArrowRight size={16} />}
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Creating your system…
                            </>
                        ) : (
                            'Create my system'
                        )}
                    </AuthButton>

                    <p className="text-center text-sm text-ink-muted">
                        No card required. We'll remind you before the trial ends.
                    </p>
                </AuthForm>

                <AuthDivider />

                <AuthButton
                    variant="secondary"
                    onClick={() => { window.location.href = route('auth.google'); }}
                    icon={<GoogleMark />}
                >
                    Continue with Google
                </AuthButton>
            </AuthStack>
        </AuthLayout>
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
