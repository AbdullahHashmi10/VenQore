import { useEffect, useRef, useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { ArrowRight, Check, ClipboardPaste, Loader2, Mail } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthForm, AuthLink, AuthNotice, AuthStack } from '@/Components/Auth';

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
    const [activeIndex, setActiveIndex] = useState(0);
    const inputs = useRef([]);
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

    const focusInput = (index) => {
        const next = Math.max(0, Math.min(index, 5));
        setActiveIndex(next);
        inputs.current[next]?.focus();
    };

    const updateCode = (value, index) => {
        const digits = value.replace(/\D/g, '').slice(0, 6);
        if (!digits) return;

        const nextCode = data.code.split('');
        digits.split('').forEach((digit, offset) => {
            if (index + offset < 6) nextCode[index + offset] = digit;
        });
        const code = nextCode.join('').slice(0, 6);
        setData('code', code);
        const nextIndex = Math.min(index + digits.length, 5);
        focusInput(nextIndex);
        if (code.length === 6 && !processing) {
            post(route('otp.verify'), { onError: () => reset('code') });
        }
    };

    const handleKeyDown = (event, index) => {
        if (event.key === 'Backspace' && !data.code[index] && index > 0) {
            const nextCode = data.code.slice(0, index - 1) + data.code.slice(index);
            setData('code', nextCode);
            focusInput(index - 1);
        }
        if (event.key === 'ArrowLeft') focusInput(index - 1);
        if (event.key === 'ArrowRight') focusInput(index + 1);
    };

    const handlePaste = (event) => {
        event.preventDefault();
        updateCode(event.clipboardData.getData('text'), activeIndex);
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
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                            <label htmlFor="otp-digit-0" className="text-sm font-medium text-ink-secondary">
                                6-digit code
                            </label>
                            <span className="text-xs text-ink-muted">One-time code</span>
                        </div>

                        <fieldset
                            className="grid grid-cols-6 gap-2 border-0 p-0 sm:gap-3"
                            onPaste={handlePaste}
                            aria-label="6-digit verification code"
                        >
                            {Array.from({ length: 6 }, (_, index) => (
                                <input
                                    key={index}
                                    ref={(element) => { inputs.current[index] = element; }}
                                    id={`otp-digit-${index}`}
                                    name={index === 0 ? 'code' : undefined}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                    value={data.code[index] || ''}
                                    onFocus={() => setActiveIndex(index)}
                                    onChange={(event) => updateCode(event.target.value, index)}
                                    onKeyDown={(event) => handleKeyDown(event, index)}
                                    onPaste={handlePaste}
                                    maxLength={6}
                                    aria-label={`Digit ${index + 1} of 6`}
                                    className={`h-14 w-full rounded-xl border bg-sunken text-center font-display text-2xl font-semibold text-ink shadow-sm outline-none transition-all duration-fast focus:border-accent-text focus:ring-2 focus:ring-focus/30 ${errors.code ? 'border-danger-500' : 'border-line-strong'}`}
                                    required
                                />
                            ))}
                        </fieldset>

                        {errors.code ? (
                            <p role="alert" className="text-sm text-danger-600">{errors.code}</p>
                        ) : (
                            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                                <ClipboardPaste size={13} aria-hidden="true" />
                                Paste the full code to fill it instantly.
                            </p>
                        )}
                    </div>

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

                {data.code.length === 6 && !processing && !errors.code ? (
                    <output className="flex items-center justify-center gap-1.5 text-sm font-medium text-success-700">
                        <Check size={16} aria-hidden="true" /> Code ready to verify
                    </output>
                ) : null}

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
