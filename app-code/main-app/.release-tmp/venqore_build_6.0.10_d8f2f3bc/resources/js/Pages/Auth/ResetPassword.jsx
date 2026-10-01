import { useForm } from '@inertiajs/react';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthField, AuthForm } from '@/Components/Auth';

/**
 * Set a new password from a reset link.
 *
 * What went, and why:
 *   · The dark card on the dark void ground, the two ambient blur blobs and
 *     the inline radial-dot `backgroundImage`. §13: no hero art. One of those
 *     blobs asked for an emerald tint at `/8` opacity — `/8` is not a Tailwind
 *     step, so the class compiled to nothing and the blob had been painting
 *     un-tinted for as long as it had been there.
 *   · The standalone logo tile; the shell owns the logo.
 *   · The ShieldCheck badge beside the heading. §13's card is a heading, a
 *     line of copy and the form.
 *   · The password reveal toggle — no ds primitive, and the exemplar's
 *     password field does not carry one.
 *   · `<style>{'* { font-family: Inter }'}</style>`.
 *
 * `token` and `email` arrive from `NewPasswordController::create()` and stay in
 * `useForm`; the token has no field because there is nothing for a user to do
 * with it, and the email keeps its read-only field so a person landing here
 * from a mail client can see which account they are about to change.
 */
export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token, email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/reset-password', {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Choose a new password"
            heading="Choose a new password"
            subheading="Choose a strong password for your account."
        >
            <AuthForm onSubmit={submit}>
                <AuthField
                    label="Email"
                    type="email"
                    name="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    readOnly
                    prefix={<Mail size={16} />}
                    error={errors.email}
                />

                <AuthField
                    label="New password"
                    type="password"
                    name="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    autoComplete="new-password"
                    autoFocus
                    required
                    prefix={<Lock size={16} />}
                    error={errors.password}
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

                <AuthButton
                    type="submit"
                    disabled={processing}
                    iconAfter={processing ? null : <ArrowRight size={16} />}
                >
                    {processing ? (
                        <>
                            <Loader2 size={16} className="animate-spin" /> Resetting…
                        </>
                    ) : (
                        'Reset password'
                    )}
                </AuthButton>
            </AuthForm>
        </AuthLayout>
    );
}
