import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  The auth shell — every sign-in, sign-up and recovery screen              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * DESIGN-RULES §13, verbatim:
 *
 *   > Login / auth — single centred card, max-width 400, radius --vq-r-xl,
 *   > elevation 2, on --vq-bg. Logo 32px above. No hero art, no gradient, no
 *   > canvas. The login page's job is to be fast and boring; it is the page
 *   > users see most often and least want to look at.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 *
 * Before it, fifteen auth screens used FIVE different layouts:
 *
 *   A  dark 45/55 split-screen, no card    Login, Register, StaffLogin
 *   B  dark centred card + logo tile       ForgotPassword, ResetPassword,
 *                                          ConfirmPassword, VerifyEmail,
 *                                          AcceptInvite, Invite/Accept
 *   C  dark centred card, no logo          TwoFactorSetup, TwoFactorVerify
 *   D  dark app-shell with a header bar    Store/Create, Store/Join
 *   E  400 lines of inline CSS             PlatformOwner/Login
 *
 * …and the three that shared layout A still disagreed on every measurable:
 * page ground `void-950` / `void-950` / `void-900`, input padding
 * `py-3.5 sm:py-4` / `py-3 sm:py-4` / `py-4`, accent teal / teal / plum. That
 * is what "the containers are not in symmetry" meant, and no amount of fixing
 * one screen addresses it. Symmetry has to come from there being one shell.
 *
 * ── The two things it deliberately does not have ────────────────────────────
 *
 * No ambient blur blobs. Eleven of the fifteen screens carried `blur-[140px]`
 * colour clouds; §13 forbids hero art here and §14 forbids ambient motion
 * anywhere inside the product. They also cost a full-viewport composite layer
 * on the page a user hits most often, on the slowest device they own.
 *
 * No forced dark. The old screens hardcoded `bg-void-950`, so the product had
 * a light theme everywhere except its front door. This shell is on `bg-app`
 * and flips with the mode like everything else.
 */
export default function AuthLayout({
    /** <title>. Falls back to the heading. */
    title,
    /** The card's h1. */
    heading,
    /** One line under it. Optional — several screens are self-evident. */
    subheading,
    /** The form. */
    children,
    /** Sits below the card, centred: "Don't have a system yet? Start building →" */
    footer,
    /** The escape hatch. Off for screens reached from inside the app. */
    back = true,
}) {
    return (
        <div className="min-h-screen bg-app flex items-center justify-center px-6 py-8 sm:py-16">
            <Head title={title || heading} />

            {/* max-w-[400px] is §13's number, not a guess. It is also the width
                the V6 reference at public/v6/signin.html builds to, so the
                static page and this one line up when a user crosses between
                them — which they do, because the marketing site links here. */}
            <div className="w-full max-w-[400px]">

                {/* w-fit + mx-auto, NOT justify-center. The V6 reference had
                    `justify-content:center` on an inline-flex anchor, where it
                    distributes the anchor's own children inside its shrink-to-
                    fit box and cannot centre the anchor itself. It was a no-op,
                    and the wordmark hung 33px left of the card it sat above. */}
                <Link href="/" className="flex w-fit mx-auto items-center gap-2.5 mb-8">
                    <ApplicationLogo className="h-8 w-8" />
                    <span className="font-display text-xl font-bold tracking-tight text-ink">
                        VenQore
                    </span>
                </Link>

                {/* §8: a 1px border OR a shadow, never both. §13 asks for
                    elevation 2, which is `shadow-lg` once the nine Tailwind
                    shadow keys collapse onto the four designed levels. */}
                <div className="bg-surface rounded-xl p-8 shadow-lg">
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                        {heading}
                    </h1>
                    {subheading ? (
                        <p className="mt-2 text-sm text-ink-muted">{subheading}</p>
                    ) : null}

                    <div className="mt-8">{children}</div>
                </div>

                {footer ? (
                    <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>
                ) : null}

                {back ? (
                    <p className="mt-8 text-center text-sm">
                        <a
                            href="/"
                            className="text-ink-faint transition-colors duration-fast hover:text-ink-muted"
                        >
                            ← Back to venqore.com
                        </a>
                    </p>
                ) : null}
            </div>
        </div>
    );
}
