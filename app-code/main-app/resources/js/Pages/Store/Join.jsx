import { useEffect, useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CheckCircle, Key, Loader2, Mail, Store } from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import {
    AuthButton, AuthField, AuthForm, AuthNotice, AuthStack,
} from '@/Components/Auth';
import { Button } from '@/Components/ds/core/Button';

/**
 * Store/Join.jsx — join an existing store, at /join.
 *
 * Enter the store's 7-character join code (VQ-A3F9) and you become a Cashier
 * there; the owner can raise the role later from the Staff page. The same
 * screen also surfaces any invitations already addressed to this account, in a
 * dialog that opens by itself when there are some.
 *
 * What went, and why:
 *   · The page chrome, which was the same app shell with its own header bar,
 *     raster wordmark and back link that Store/Create carried, on the same
 *     forced near-black ground with two large ambient colour clouds. §13 asks
 *     for one centred card; §14 forbids ambient art inside the product.
 *   · **The info panel's fill and hairline, both written at opacity steps
 *     Tailwind does not have** — the same invented fractional steps as its
 *     sibling, so the panel has been rendering as loose grey text with no well
 *     and no edge behind it.
 *   · The dialog's raw grey surfaces. It was built out of a neutral ramp rather
 *     than the surface tokens, so it stayed dark when the rest of the product
 *     went light, and its inner field was a third grey again. Card, well,
 *     divider and scrim are all tokens now, so the dialog follows the mode.
 *   · The blurred colour decal in the dialog's top corner, and the pulsing ring
 *     on the invites button. Ambient motion is a §14 never inside the product;
 *     the count in the button's own label already says there are invites.
 *   · The hand-rolled code field — its own label, its own error row, its own
 *     focus ring — and the two hand-rolled dialog buttons.
 *   · The gradient submit, green at one end and teal at the other. Now a plain
 *     primary, and the only primary on the page.
 *   · `Want to create your own store?{''}` — an empty expression where a space
 *     was meant, which rendered the question and the link with nothing between
 *     them. A real space now.
 *
 * NOTE: none of the class names behind those descriptions are written out
 * above. Tailwind scans raw file text, so a class quoted in a comment is a
 * class that gets generated — naming the ones you just deleted puts them back
 * into the bundle.
 *
 * One deliberate typographic loss: the code field no longer renders in the
 * monospace face. The ds input states its font as a shorthand in a style
 * attribute, which an inline style wins against any utility class, so a
 * monospace face here would need an importance escape hatch that no other
 * field in the family uses. Wide tracking, centred, upper-case — the three
 * things that actually make a code readable — all survive.
 *
 * Behaviour is untouched: same `useForm` field, same POST to
 * `store.join.submit`, same code-validation call and the visit it triggers on
 * success, same auto-opening dialog, same dismiss, same upper-casing filter,
 * same two `id` hooks on the field and the submit button.
 */
export default function JoinStore({ pending_invites = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        join_code: '',
    });

    const [invites, setInvites] = useState(pending_invites);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [checkingCode, setCheckingCode] = useState(false);
    const [codeError, setCodeError] = useState('');

    // Auto-show the dialog if there are pending invites on load.
    useEffect(() => {
        if (invites.length > 0) {
            setShowCodeModal(true);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.join.submit'));
    };

    const handleCheckCode = async (e) => {
        e.preventDefault();
        setCheckingCode(true);
        setCodeError('');

        try {
            const response = await window.axios.post(route('invite.validate-code'), { code: inviteCode });
            if (response.data.valid) {
                router.visit(route('invite.accept', { token: response.data.invitation.token }));
            }
        } catch (error) {
            setCodeError(error.response?.data?.message || 'Invalid or expired invite code.');
            setCheckingCode(false);
        }
    };

    const dismissInvite = (token) => {
        setInvites(prev => prev.filter(i => i.token !== token));
    };

    const formatCode = (raw) => {
        const cleaned = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        return cleaned;
    };

    return (
        <AuthLayout
            title="Join a Store — VenQore"
            heading="Join a Store"
            subheading="Ask your store owner for the 7-character join code."
            back={false}
            footer={
                <>
                    <span className="block">
                        Want to create your own store?{' '}
                        <Link
                            href={route('store.create')}
                            className="font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                        >
                            Create a store
                        </Link>
                    </span>
                    <span className="mt-3 block">
                        <Link
                            href={route('store.create-or-join')}
                            className="inline-flex items-center gap-1.5 text-ink-faint transition-colors duration-fast hover:text-ink-muted"
                        >
                            <ArrowLeft size={14} /> Back
                        </Link>
                    </span>
                </>
            }
        >
            <AuthStack gap={6}>
                <AuthButton
                    variant="soft"
                    onClick={() => setShowCodeModal(true)}
                    icon={<Mail size={16} />}
                >
                    {invites.length > 0
                        ? `View Pending Invites (${invites.length})`
                        : 'Check for Invites'}
                </AuthButton>

                <AuthForm onSubmit={handleSubmit}>
                    <AuthField
                        id="join-code"
                        label="Store join code"
                        type="text"
                        name="join_code"
                        value={data.join_code}
                        onChange={(e) => setData('join_code', formatCode(e.target.value))}
                        placeholder="VQ-XXXX"
                        maxLength={7}
                        required
                        autoFocus
                        className="text-center uppercase tracking-widest"
                        error={errors.join_code}
                    />

                    <div className="flex flex-col gap-2 rounded-lg bg-sunken p-4 text-xs text-ink-muted">
                        <p className="flex items-start gap-2">
                            <Store size={12} className="mt-0.5 shrink-0 text-accent-text" />
                            <span>
                                You&apos;ll join as a <strong className="font-semibold text-ink-secondary">Cashier</strong>{' '}
                                by default. The store owner can update your role.
                            </span>
                        </p>
                        <p className="flex items-start gap-2">
                            <Key size={12} className="mt-0.5 shrink-0 text-accent-text" />
                            <span>
                                The code can be found in the store&apos;s{' '}
                                <strong className="font-semibold text-ink-secondary">Staff Settings</strong> page.
                            </span>
                        </p>
                    </div>

                    <AuthButton
                        id="join-store-submit"
                        type="submit"
                        disabled={processing || data.join_code.length < 6}
                        icon={processing ? null : <Key size={16} />}
                        iconAfter={processing ? null : <ArrowRight size={16} />}
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Joining…
                            </>
                        ) : (
                            'Join Store'
                        )}
                    </AuthButton>
                </AuthForm>
            </AuthStack>

            {showCodeModal && (
                <InviteDialog
                    invites={invites}
                    onDismissInvite={dismissInvite}
                    onClose={() => setShowCodeModal(false)}
                    code={inviteCode}
                    onCodeChange={setInviteCode}
                    codeError={codeError}
                    checking={checkingCode}
                    onCheck={handleCheckCode}
                />
            )}
        </AuthLayout>
    );
}

/**
 * The invitations dialog. §13's modal contract: 28px corner, elevation 3, at
 * the modal level with the scrim one step below it. It keeps its own scroll
 * region so a long invite list never pushes the short-code form off screen.
 *
 * The scrim does not close on click, because it never did — this dialog opens
 * by itself when invites exist, and a stray click dismissing it would lose the
 * one thing the user came here for. Close is the labelled button.
 */
function InviteDialog({ invites, onDismissInvite, onClose, code, onCodeChange, codeError, checking, onCheck }) {
    return (
        <>
            <div className="fixed inset-0 z-modal-scrim bg-scrim" aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Pending Invitations"
                className="fixed inset-0 z-modal flex items-center justify-center p-4"
            >
                <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-surface shadow-xl">
                    <div className="shrink-0 p-6 sm:p-8">
                        <h2 className="font-display text-xl font-bold text-ink">Pending Invitations</h2>
                        <p className="mt-2 text-sm text-ink-muted">
                            Manage your pending store invitations or join via short code.
                        </p>
                    </div>

                    <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-6 pb-4 sm:px-8">
                        {invites.length > 0 ? (
                            invites.map(invite => (
                                <InviteCard
                                    key={invite.token}
                                    invite={invite}
                                    onDismiss={() => onDismissInvite(invite.token)}
                                />
                            ))
                        ) : (
                            <div className="rounded-lg bg-sunken py-6 text-center">
                                <Mail size={24} className="mx-auto mb-2 text-ink-faint" />
                                <p className="text-sm text-ink-muted">You have no pending invitations.</p>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 border-t border-line bg-sunken p-6 sm:p-8">
                        <form onSubmit={onCheck} className="flex flex-col gap-5">
                            <AuthField
                                label="Have a short code?"
                                type="text"
                                value={code}
                                onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
                                placeholder="e.g. VQ-A3X9"
                                className="text-center uppercase tracking-widest"
                            />

                            {codeError ? <AuthNotice tone="danger">{codeError}</AuthNotice> : null}

                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <AuthButton variant="secondary" onClick={onClose}>
                                        Close
                                    </AuthButton>
                                </div>
                                <div className="flex-1">
                                    <AuthButton type="submit" disabled={checking || !code}>
                                        {checking ? 'Checking...' : 'Check Code'}
                                    </AuthButton>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

/**
 * One invitation. The two actions are the ds button at its small size rather
 * than the 48px full-width auth button, because they sit side by side inside a
 * list row — the same reasoning that keeps the password reveal a bare control
 * in its sibling screens. Accept navigates to the same `accept_url` the anchor
 * used to carry; Inertia's visit and its link do the same thing.
 */
function InviteCard({ invite, onDismiss }) {
    const [accepting, setAccepting] = useState(false);

    return (
        <div className="flex items-start gap-3 rounded-lg bg-success-50 p-4 dark:bg-success-500/10">
            <Mail size={16} className="mt-0.5 shrink-0 text-success-600 dark:text-success-400" />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                    Invited to{' '}
                    <span className="text-success-700 dark:text-success-300">{invite.store_name}</span>
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">
                    As <span className="font-medium capitalize text-ink-secondary">{invite.role}</span> ·{' '}
                    {invite.plan} plan
                </p>
                <div className="mt-3 flex gap-2">
                    <Button
                        size="sm"
                        icon={<CheckCircle size={12} />}
                        disabled={accepting}
                        onClick={() => {
                            setAccepting(true);
                            router.visit(invite.accept_url);
                        }}
                    >
                        Accept
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onDismiss}>
                        Ignore
                    </Button>
                </div>
            </div>
        </div>
    );
}
