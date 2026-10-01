import { useEffect, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthField, AuthForm, AuthLink, AuthNotice, AuthStack } from '@/Components/Auth';

/**
 * AUTH-01 (2026-09-10) — "Enter the code we emailed you".
 *
 * Shown after sign-up, after every email/password sign-in, and when a Google
 * account is linked to an existing account for the first time. No session
 * exists until this code is accepted.
 *
 * The field accepts paste and one-time-code autofill; non-digits are stripped.
 * The resend button counts down from the server's cooldown so the page never
 * offers a resend the server will refuse.
 */
const HEADINGS = {
    signup: { heading: 'Confirm your email', sub: 'One last step to create your account' },
    link_google: { heading: 'Link your Google account', sub: 'Confirm it is really you' },
    login: { heading: 'Check your email', sub: 'Enter your sign-in code' },
};

export default function VerifyCode({ purpose = 'login', maskedEmail = '', ttlMinutes = 5, resendIn = 60, status, devCode = null }) {
    const { data, setData, post, processing, errors, reset } = useForm({ code: '' });
    const [wait, setWait] = useState(Math.max(0, Number(resendIn) || 0));
    const [resending, setResending] = useState(false);
    const copy = HEADINGS[purpose] || HEADINGS.login;
    /* Local testing: the server accepts a short master code (e.g. 0000), so the
       button must not insist on six digits. Real codes are always six. */
    const minLength = devCode ? Math.min(6, String(devCode).length) : 6;

    useEffect(() => {
        setWait(Math.max(0, Number(resendIn) || 0));
    }, [resendIn]);

    useEffect(() => {
        if (wait <= 0) return undefined;
        const t = window.setTimeout(() => setWait((w) => Math.max(0, w - 1)), 1000);
        return () => window.clearTimeout(t);
    }, [wait]);

    const submit = (e) => {
        e.preventDefault();
        post(route('otp.verify'), { onError: () => reset('code') });
    };

    const resend = () => {
        setResending(true);
        router.post(route('otp.resend'), {}, {
            preserveScroll: true,
            onFinish: () => setResending(false),
        });
    };

    const cancel = (e) => {
        e.preventDefault();
        router.post(route('otp.cancel'));
    };

    return (
        <AuthLayout title={`${copy.heading} — VenQore`} heading={copy.heading} subheading={copy.sub} back={false}>
            <AuthStack gap={6}>
                <p className="flex items-start gap-2 text-sm text-ink-secondary">
                    <Mail size={16} className="mt-0.5 shrink-0 text-accent-text" aria-hidden="true" />
                    <span>
                        We sent a 6-digit code to{' '}
                        <strong className="font-semibold text-ink">{maskedEmail || 'your email'}</strong>.
                        It expires in {ttlMinutes} minutes and works once.
                    </span>
                </p>

                <AuthNotice tone="success">{status}</AuthNotice>

                {devCode && (
                    <p className="rounded-md border border-dashed border-line-strong bg-sunken px-3 py-2 text-xs text-ink-secondary">
                        Local testing: enter <strong className="font-mono text-ink">{devCode}</strong> — no email needed.
                    </p>
                )}

                <AuthForm onSubmit={submit}>
                    <AuthField
                        id="otp-code"
                        label="6-digit code"
                        type="text"
                        name="code"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern={devCode ? undefined : '[0-9]{6}'}
                        maxLength={6}
                        className="text-center tracking-[0.5em]"
                        error={errors.code}
                        required
                        autoFocus
                    />

                    <AuthButton
                        type="submit"
                        disabled={processing || data.code.length < minLength}
                        iconAfter={processing ? null : <ArrowRight size={16} />}
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Checking…
                            </>
                        ) : (
                            'Continue'
                        )}
                    </AuthButton>
                </AuthForm>

                <div className="flex flex-col gap-2 text-sm text-ink-muted">
                    <p aria-live="polite">
                        Didn&apos;t get it? Check spam, or{' '}
                        {wait > 0 ? (
                            <span>request a new code in {wait}s.</span>
                        ) : (
                            <button
                                type="button"
                                onClick={resend}
                                disabled={resending}
                                className="font-semibold text-accent-text underline-offset-2 hover:underline disabled:opacity-60"
                            >
                                {resending ? 'sending…' : 'send a new code'}
                            </button>
                        )}
                    </p>
                    <p>
                        Wrong email?{' '}
                        <AuthLink href="#" onClick={cancel}>
                            Start again
                        </AuthLink>
                    </p>
                </div>
            </AuthStack>
        </AuthLayout>
    );
}
