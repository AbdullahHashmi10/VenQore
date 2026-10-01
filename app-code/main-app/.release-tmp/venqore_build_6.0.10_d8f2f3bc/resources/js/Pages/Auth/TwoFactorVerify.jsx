import { useForm } from '@inertiajs/react';
import { ArrowRight, KeyRound, Loader2 } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthField, AuthForm, AuthStack } from '@/Components/Auth';

/**
 * Two-factor verify — the challenge on the way in.
 *
 * The other logo-less screen. Same fixes as TwoFactorSetup, which it was a
 * near-copy of:
 *
 *   · The `void` page ground, two 160px blur clouds, the inline dot pattern and
 *     the 2%-white glass card, all gone.
 *   · The same two leftover **indigo** glows — an arbitrary-value shadow on
 *     focus and another under the button on hover, both rgba triplets typed out
 *     by hand — which survived the teal rebrand because a colour written inside
 *     an arbitrary class is invisible to a class-level find-and-replace.
 *   · The teal→plum gradient primary, now a plain primary.
 *   · The amber `ShieldAlert` tile, which coloured a routine step as a warning.
 *
 * `back={false}`: mid-session, same as setup.
 *
 * ── Why this is a text field and not Login.jsx's `PasscodePad` ──────────────
 *
 * The pad is the right pattern for a numeric PIN, and this looks like one. It
 * is not. `TwoFactorController::verify()` accepts either a 6-digit TOTP **or**
 * a recovery code, and recovery codes are `bin2hex(random_bytes(5))` — ten
 * characters of 0-9a-f. A 0-9 keypad cannot type one, so replacing this field
 * with a pad would lock out exactly the user who has lost their phone and has
 * nothing left but the recovery code. One field, both codes, as before.
 */
export default function TwoFactorVerify() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/2fa/verify');
    };

    return (
        <AuthLayout
            title="Two-Factor Authentication Verify"
            heading="Verification required"
            subheading="Two-factor authentication code"
            back={false}
        >
            <AuthStack gap={6}>
                <p className="text-sm text-ink-secondary">
                    Please enter the 6-digit authentication code from your authenticator app,
                    or a secure recovery code.
                </p>

                <AuthForm onSubmit={submit}>
                    <AuthField
                        label="Authentication code"
                        type="text"
                        name="code"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                        placeholder="000000"
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
                                <Loader2 size={16} className="animate-spin" /> Verifying…
                            </>
                        ) : (
                            'Verify Code'
                        )}
                    </AuthButton>
                </AuthForm>
            </AuthStack>
        </AuthLayout>
    );
}
