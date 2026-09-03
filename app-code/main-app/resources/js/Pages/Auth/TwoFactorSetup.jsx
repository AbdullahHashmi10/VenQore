import { useForm } from '@inertiajs/react';
import { ArrowRight, KeyRound, Loader2 } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthField, AuthForm, AuthStack } from '@/Components/Auth';

/**
 * Two-factor setup — scan the QR, confirm with a code.
 *
 * This was one of the two screens (with TwoFactorVerify) that had **no logo
 * block at all**, so a user sent here mid-session lost every signal of which
 * product they were in. The shell supplies it now, for free.
 *
 * What went, and why:
 *   · The `void` page ground, two ambient 160px blur clouds and an inline 30px
 *     dot pattern — §13 and §14 both forbid the lot.
 *   · The 2%-white glass card with `backdrop-blur-sm`, and the responsive radius
 *     — 28px on a phone, 36px above it — that made the card a different shape
 *     on the two.
 *   · Two arbitrary-value glows written as literal rgba — a 20px one on the
 *     focused field, a 30px one under the button on hover. Both triplets are
 *     raw **indigo**: the pre-teal brand colour, left behind by the rebrand and
 *     still glowing on the screen that guards the account.
 *   · A left-to-right teal-600 → plum-600 gradient on the primary, i.e. the
 *     old brand and the new one blended into each other. It is a plain primary
 *     now. (A codemod had already folded it into the `bg-gradient-brand` alias;
 *     the alias goes with it.)
 *   · The hand-rolled field wrapper with its own focus state, replaced by the
 *     ds input, which already implements §13's focus contract.
 *
 * `back={false}`: this screen is reached from inside the app, and "Back to
 * venqore.com" is not the escape hatch a half-enrolled user wants.
 *
 * The QR and the shared key both stay — they are the two ways to enrol an
 * authenticator, and dropping either strands anyone whose camera is refused.
 * The key is set in `font-numeric`, the face the design system reserves for
 * characters that get read out and typed in one at a time.
 */
export default function TwoFactorSetup({ secret, qrCodeUrl }) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/2fa/confirm');
    };

    return (
        <AuthLayout
            title="Setup Two-Factor Authentication"
            heading="Secure your account"
            subheading="Enable two-factor authentication"
            back={false}
        >
            <AuthStack gap={6}>
                <p className="text-sm text-ink-secondary">
                    To protect your store and financial data, 2FA is required for your role.
                </p>

                {/* The QR block. `bg-surface` + a hairline rather than the old
                    white-alpha wash, so it reads as a panel in both modes —
                    and the code image keeps its own quiet zone. */}
                <div className="flex flex-col items-center gap-4 rounded-md border border-line bg-surface p-6">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="h-48 w-48 rounded-md" />
                    <span className="select-all text-center text-xs text-ink-muted">
                        Key:{' '}
                        <code className="rounded-sm bg-sunken px-2 py-1 font-numeric text-ink">{secret}</code>
                    </span>
                </div>

                <p className="text-xs leading-relaxed text-ink-muted">
                    Scan the QR code with an authenticator app (Google Authenticator, Authy, etc.),
                    then enter the 6-digit code below to confirm setup.
                </p>

                <AuthForm onSubmit={submit}>
                    <AuthField
                        label="Verification code"
                        type="text"
                        name="code"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="tracking-widest"
                        prefix={<KeyRound size={16} />}
                        error={errors.code}
                        required
                        autoFocus
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
                            'Confirm & Enable'
                        )}
                    </AuthButton>
                </AuthForm>
            </AuthStack>
        </AuthLayout>
    );
}
