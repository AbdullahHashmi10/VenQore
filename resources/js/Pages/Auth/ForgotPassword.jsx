import { Link, useForm } from '@inertiajs/react';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthField, AuthForm, AuthNotice, AuthStack } from '@/Components/Auth';

/**
 * Request a password reset link.
 *
 * What went, and why:
 *   · The dark centred card on the dark void ground, its two 160px ambient
 *     blur blobs and the inline radial-dot `backgroundImage`. §13: no hero art
 *     on an auth page.
 *   · The standalone logo tile — a 64px white-alpha square holding
 *     `/images/logo.png`. The shell puts a 32px wordmark above the card, which
 *     is what §13 asks for, so the tile was a second logo on the same screen.
 *   · The bespoke green status panel. `AuthNotice tone="success"` is the same
 *     message on the semantic pair, so a confirmation here and a confirmation
 *     on Login cannot drift to two different greens.
 *   · The "Back to Sign In" secondary button inside the form. A navigation link
 *     is not a form action; it moved to the shell's footer slot.
 *   · `<style>{'* { font-family: Inter }'}</style>`.
 *
 * The `settings` prop this file used to destructure only fed the logo tile, and
 * `PasswordResetLinkController::create()` never passed it. It is gone with the
 * tile.
 */
export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout
            title="Reset your password"
            heading="Reset your password"
            subheading="We'll send you a secure reset link."
            footer={
                <>
                    Remembered it?{' '}
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
                {status ? <AuthNotice tone="success">{status}</AuthNotice> : null}

                <AuthForm onSubmit={submit}>
                    <AuthField
                        label="Email address"
                        type="email"
                        name="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="you@company.com"
                        autoComplete="username"
                        autoFocus
                        required
                        prefix={<Mail size={16} />}
                        error={errors.email}
                    />

                    <AuthButton
                        type="submit"
                        disabled={processing}
                        iconAfter={processing ? null : <ArrowRight size={16} />}
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Sending…
                            </>
                        ) : (
                            'Send reset link'
                        )}
                    </AuthButton>
                </AuthForm>
            </AuthStack>
        </AuthLayout>
    );
}
