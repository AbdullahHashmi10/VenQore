import { router, useForm } from '@inertiajs/react';
import { Loader2, LogOut, RefreshCw } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthNotice, AuthStack } from '@/Components/Auth';

/**
 * The wait-for-the-link screen.
 *
 * What went, and why:
 *   · The dark card on the dark void ground, its two ambient blur blobs and
 *     the inline 60px grid `backgroundImage`. §13: no hero art.
 *   · The standalone logo tile and the Mail badge above the heading — the
 *     shell's wordmark is the only mark this page needs.
 *   · The bespoke green "link sent" panel, now `AuthNotice tone="success"`.
 *   · `<style>{'* { font-family: Inter }'}</style>`.
 *
 * There is no form here — nothing is typed and nothing is validated — so the
 * body is an `AuthStack` of two buttons rather than an `AuthForm`. Both keep
 * the request they always made: a POST to
 * `/email/verification-notification`, and a POST to `route('logout')`. Log out
 * goes through `router.post` instead of `<Link method="post" as="button">`
 * because a link styled as a button is exactly the drift the shared primitives
 * exist to stop; the method and the URL are unchanged.
 *
 * `back={false}`: the user is signed in and one step from being done. The exit
 * that belongs here is the log-out button, not a trip to the marketing site.
 */
export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = () => {
        post('/email/verification-notification', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout
            title="Verify your email"
            heading="Verify your email"
            subheading="We've sent a verification link to your email address. Click the link to activate your account and get started."
            back={false}
            footer="Didn't receive the email? Check your spam folder or try resending."
        >
            <AuthStack gap={6}>
                {status === 'verification-link-sent' ? (
                    <AuthNotice tone="success">
                        A new verification link has been sent!
                    </AuthNotice>
                ) : null}

                <AuthStack gap={2}>
                    <AuthButton
                        disabled={processing}
                        onClick={submit}
                        icon={processing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    >
                        {processing ? 'Sending…' : 'Resend verification email'}
                    </AuthButton>

                    <AuthButton
                        variant="ghost"
                        onClick={() => router.post(route('logout'))}
                        icon={<LogOut size={16} />}
                    >
                        Log out
                    </AuthButton>
                </AuthStack>
            </AuthStack>
        </AuthLayout>
    );
}
