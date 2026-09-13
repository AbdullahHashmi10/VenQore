import { router } from '@inertiajs/react';
import { ArrowLeft, Clock, ShieldX } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import { AuthButton, AuthStack } from '@/Components/Auth';

/**
 * Invite/Invalid.jsx — the dead end for a link that no longer works.
 *
 * Same shell as Invite/Accept, which is the point: a user who clicks a stale
 * link should land somewhere that plainly belongs to the same product as the
 * page they expected, not on a differently-built error screen.
 *
 * What went: the full-page ink → teal → ink gradient, the 5%-white
 * `backdrop-blur-xl` card, `shadow-2xl`, three 36px corners, `animate-fade-in`,
 * and the white-alpha button standing in for a real one. The reason-specific
 * glyph and all three messages stay verbatim.
 *
 * `back` stays on — this screen's whole job is to point somewhere else.
 */
const MESSAGES = {
    expired:   { title: 'Invite Expired', body: 'This invite link was only valid for 48 hours. Ask your store admin to resend it.' },
    not_found: { title: 'Invalid Link',   body: "This invite link doesn't exist or has already been used. Contact your store admin for a new one." },
    revoked:   { title: 'Invite Revoked', body: 'The store admin has cancelled this invitation. Contact them for a new invite.' },
};

export default function InviteInvalid({ reason = 'not_found' }) {
    const msg = MESSAGES[reason] || MESSAGES.not_found;

    return (
        <AuthLayout title="Invalid Invitation — VenQore" heading={msg.title} subheading={msg.body}>
            <AuthStack gap={6}>
                <div className="flex justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-md bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-300">
                        {reason === 'expired' ? <Clock size={24} /> : <ShieldX size={24} />}
                    </span>
                </div>

                {/* `router.visit` rather than an anchor: the ds button is the only
                    button on these screens, and Inertia navigation is preserved. */}
                <AuthButton variant="secondary" onClick={() => router.visit('/login')} icon={<ArrowLeft size={16} />}>
                    Back to Login
                </AuthButton>
            </AuthStack>
        </AuthLayout>
    );
}
