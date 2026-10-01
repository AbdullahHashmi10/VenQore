import { useForm } from '@inertiajs/react';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthField, AuthForm } from '@/Components/Auth';

/**
 * Re-confirm the password before a protected action.
 *
 * What went, and why:
 *   · The dark card on the dark void ground, its two ambient blur blobs and
 *     the inline radial-dot `backgroundImage`. §13: no hero art.
 *   · The standalone logo tile; the shell owns the logo.
 *   · The amber ShieldCheck badge and its "Secure area — re-enter your
 *     password" caption, which said the same thing as the paragraph below it.
 *     The paragraph survives, as the shell's subheading.
 *   · The password reveal toggle and the gradient focus underline.
 *   · `<style>{'* { font-family: Inter }'}</style>`.
 *
 * `back={false}`: this screen is only ever reached from inside the app, on the
 * way to something the user asked for. "← Back to venqore.com" would be an exit
 * out of the product rather than out of the step.
 */
export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({ password: '' });

    const submit = (e) => {
        e.preventDefault();
        post('/confirm-password', {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Confirm your password"
            heading="Confirm your password"
            subheading="This is a protected section of the application. Please confirm your password before continuing."
            back={false}
        >
            <AuthForm onSubmit={submit}>
                <AuthField
                    label="Password"
                    type="password"
                    name="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                    required
                    prefix={<Lock size={16} />}
                    error={errors.password}
                />

                <AuthButton
                    type="submit"
                    disabled={processing}
                    iconAfter={processing ? null : <ArrowRight size={16} />}
                >
                    {processing ? (
                        <>
                            <Loader2 size={16} className="animate-spin" /> Confirming…
                        </>
                    ) : (
                        'Confirm'
                    )}
                </AuthButton>
            </AuthForm>
        </AuthLayout>
    );
}
