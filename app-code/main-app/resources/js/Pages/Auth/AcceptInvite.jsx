import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    ArrowRight, CheckCircle, Crown, Eye, EyeOff, Loader2, Mail, Store, Users, Zap,
} from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthField, AuthForm, AuthLink, AuthStack } from '@/Components/Auth';

/**
 * Auth/AcceptInvite.jsx — staff invite acceptance, at /invite/{token}.
 *
 * Shown when a staff member clicks the invite link from their email. If the
 * account already exists they just accept; if they are new they set a password
 * here.
 *
 * What went, and why:
 *   · The `void` page ground and a 120px blur cloud, plus the standalone
 *     `/images/logo.png` tile — the shell owns the logo now, and this was the
 *     only auth screen loading the wordmark as a raster.
 *   · **A white-alpha card surface at a `/3` opacity step.** Tailwind has no
 *     `/3` step, so that utility compiled to nothing and the card has been
 *     rendering with no surface at all — a border floating on the page ground.
 *     It is the clearest argument in the whole family for not writing surfaces
 *     by hand.
 *   · The inputs, which were the odd ones out twice over: a 28px corner where
 *     every sibling used the 36px step, and `focus:ring-1` where every sibling
 *     moved its border. Both replaced by the one ds input.
 *   · `placeholder-slate-600` — a grey from outside the palette.
 *   · The teal-500 → plum-600 CTA gradient (already folded into the
 *     `bg-gradient-brand` alias by an earlier pass): teal on one end, plum on
 *     the other. Now a plain primary.
 *   · `join as a{''}` and `VenQore's{''}` — an empty expression where a space
 *     was meant, which rendered "join as aAdmin" and "VenQore'sTerms". Real
 *     spaces now.
 *
 * The role ramps replace the five hand-picked hues: amber → warning, teal →
 * brand, blue → info, emerald → success, and viewer takes plain ink.
 *
 * Behaviour is untouched: same `useForm` fields, same POST to /invite/accept,
 * same `id` hooks on the two fields and the submit button.
 */
const ROLE_INFO = {
    owner:   { label: 'Owner',   icon: Crown, tone: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-300' },
    admin:   { label: 'Admin',   icon: Zap,   tone: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' },
    manager: { label: 'Manager', icon: Users, tone: 'bg-info-50 text-info-700 dark:bg-info-500/10 dark:text-info-300' },
    cashier: { label: 'Cashier', icon: Store, tone: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300' },
    viewer:  { label: 'Viewer',  icon: Users, tone: 'bg-sunken text-ink-secondary' },
};

export default function AcceptInvite({ token, invite_email, store_name, role }) {
    const [showPass, setShowPass] = useState(false);
    const roleInfo = ROLE_INFO[role] ?? ROLE_INFO.viewer;
    const RoleIcon = roleInfo.icon;

    const { data, setData, post, processing, errors } = useForm({
        token,
        name: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/invite/accept', {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthLayout
            title={`Join ${store_name} — VenQore`}
            heading={store_name ? `Join ${store_name}` : "You're invited!"}
            subheading={
                <>
                    You&apos;ve been invited to join as a{' '}
                    <strong className="font-semibold text-ink">{roleInfo.label}</strong>.
                </>
            }
            footer={
                <>
                    By joining, you agree to VenQore&apos;s{' '}
                    <AuthLink href="/terms">Terms of Service</AuthLink>. If you weren&apos;t
                    expecting this invite, you can safely close this page.
                </>
            }
        >
            <AuthStack gap={6}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${roleInfo.tone}`}>
                        <RoleIcon size={14} />
                        {roleInfo.label}
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
                        <Mail size={12} />
                        Sent to: <span className="text-ink-secondary">{invite_email}</span>
                    </span>
                </div>

                <AuthForm onSubmit={submit}>
                    <input type="hidden" value={token} name="token" />

                    <AuthField
                        id="invite-name"
                        label="Your name"
                        type="text"
                        name="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="How should we call you?"
                        autoComplete="name"
                        required
                        autoFocus
                        error={errors.name}
                    />

                    <AuthField
                        id="invite-password"
                        label="Set a password"
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        hint="Skip if you already have an account."
                        suffix={<RevealToggle shown={showPass} onToggle={() => setShowPass((v) => !v)} />}
                        error={errors.password}
                    />

                    <AuthButton
                        id="accept-invite-submit"
                        type="submit"
                        disabled={processing || !data.name}
                        icon={processing ? null : <CheckCircle size={16} />}
                        iconAfter={processing ? null : <ArrowRight size={16} />}
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Joining…
                            </>
                        ) : (
                            'Accept & Enter Store'
                        )}
                    </AuthButton>
                </AuthForm>
            </AuthStack>
        </AuthLayout>
    );
}

/** Same reveal as StaffLogin: a bare button because it sits in the input's 48px suffix slot. */
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
