import { router, useForm } from '@inertiajs/react';
import { Briefcase, Building2, CheckCircle, User, XCircle } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthStack } from '@/Components/Auth';

/**
 * Invite/Accept.jsx — the magic-link invite (Path A), at GET /invite/accept.
 *
 * The screen a store admin's invitee lands on. It confirms three facts — which
 * store, which person, which roles — and offers accept or decline.
 *
 * What went, and why:
 *   · **The full-page gradient** — a bottom-right ink → teal → ink ramp, the
 *     only auth screen in the product painting a gradient across the whole
 *     viewport. §13 for auth is explicit: "no hero
 *     art, no gradient, no canvas", and §14 keeps gradients on marketing pages.
 *   · The plum accents: a 30%-plum wash on the icon tiles and a plum-400 ink
 *     on the icons themselves. Both are the accent now.
 *     (An earlier codemod had renamed the classes to `brand-*`; the change here
 *     is that they stop being white-alpha tiles with an alpha-toned icon and
 *     become an accent-quiet tile with accent-text ink, which is the one thing
 *     that works in both modes.)
 *   · The 5%-white `backdrop-blur-xl` glass card and its `shadow-2xl`, and the
 *     standalone teal logo tile with the `Shield` glyph — the shell has the
 *     logo.
 *   · Every 36px corner, down to §7's ladder: `md` for the info rows and icon
 *     tiles, `xl` for the card the shell draws.
 *
 * Behaviour is untouched: the same `useForm({ token })` POST to /invite/accept
 * and the same `router.post` to /invite/decline, both still preserving state
 * and scroll.
 */
const ROLE_LABELS = {
    admin: 'Admin', manager: 'Manager', cashier: 'Cashier',
    inventory_staff: 'Inventory Staff', accountant: 'Accountant',
    support: 'Support', custom: 'Custom', viewer: 'Viewer',
};

export default function InviteAccept({ invitation, store, admin_name, token }) {
    const { post, processing } = useForm({ token });

    const accept = () => post('/invite/accept', { preserveState: true, preserveScroll: true });
    const decline = () => router.post('/invite/decline', { token }, { preserveState: true, preserveScroll: true });

    const roles = invitation?.roles || ['cashier'];

    return (
        <AuthLayout
            title="Accept Invitation — VenQore"
            heading="You're invited!"
            subheading={
                <>
                    <strong className="font-semibold text-ink">{admin_name}</strong> has invited you
                    to join their store on VenQore.
                </>
            }
        >
            <AuthStack gap={6}>
                <AuthStack gap={3}>
                    <InfoRow icon={<Building2 size={18} />} label="Store">
                        <p className="text-base font-semibold leading-tight text-ink">{store?.name}</p>
                    </InfoRow>

                    <InfoRow icon={<User size={18} />} label="Invited as">
                        <p className="text-base font-semibold leading-tight text-ink">{invitation?.invitee_name}</p>
                        <p className="mt-0.5 text-xs leading-tight text-ink-muted">{invitation?.invitee_email}</p>
                    </InfoRow>

                    <InfoRow icon={<Briefcase size={18} />} label="Your role(s)">
                        <div className="mt-1 flex flex-wrap gap-2">
                            {roles.map((r) => (
                                <span
                                    key={r}
                                    className="rounded-full bg-accent-quiet px-3 py-1 text-xs font-semibold text-accent-text"
                                >
                                    {ROLE_LABELS[r] || r}
                                </span>
                            ))}
                        </div>
                    </InfoRow>
                </AuthStack>

                <p className="text-center text-xs leading-relaxed text-ink-muted">
                    After accepting, you will be redirected to the store hub to access your dashboard.
                </p>

                <AuthStack gap={2}>
                    <AuthButton onClick={accept} disabled={processing} icon={<CheckCircle size={16} />}>
                        {processing ? 'Accepting…' : 'Accept Invite'}
                    </AuthButton>
                    {/* Secondary, not `danger`. §13 allows one primary per view, and a
                        filled red button would shout louder than the action it declines. */}
                    <AuthButton variant="secondary" onClick={decline} disabled={processing} icon={<XCircle size={16} />}>
                        Decline
                    </AuthButton>
                </AuthStack>
            </AuthStack>
        </AuthLayout>
    );
}

/** One fact about the invite: an accent tile, an eyebrow, and the value. */
function InfoRow({ icon, label, children }) {
    return (
        <div className="flex items-start gap-4 rounded-md border border-line bg-sunken p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-quiet text-accent-text">
                {icon}
            </span>
            <div className="min-w-0">
                <p className="text-2xs uppercase tracking-wider text-ink-muted">{label}</p>
                {children}
            </div>
        </div>
    );
}
