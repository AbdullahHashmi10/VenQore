import { Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft, ArrowRight, Clock, CreditCard, Loader2, Pencil, Sparkles, Store,
} from 'lucide-react';
import AuthLayout from '@/Layouts/AuthLayout';
import {
    AuthButton, AuthCheckbox, AuthField, AuthForm, AuthNotice, AuthStack,
} from '@/Components/Auth';

/**
 * Store/Create.jsx — plan-gated store creation, step 2.
 *
 * URL: /new-store?plan=<slug>&interval=<monthly|annual>
 *
 * Reached only after a plan has been chosen on step 1 (Store/SelectPlan), or
 * directly when the user holds a pre-paid / AppSumo license, in which case the
 * plan is already decided. Collects the store name and starts the trial; the
 * plan and interval ride along with the submission so the server knows what to
 * charge once the trial ends.
 *
 * What went, and why:
 *   · The whole page chrome. This was layout D of five — an app shell with its
 *     own header bar carrying a raster wordmark and a back link, sitting on a
 *     forced near-black ground with two large ambient colour clouds behind it.
 *     §13 asks for one centred card and §14 forbids ambient motion or art
 *     inside the product, so the shell now supplies the ground, the logo and
 *     the card, and this file supplies only the form.
 *   · A 576px content column. §13's number is 400. Every field below fits it;
 *     the plan summary and the consent row were the two that needed relaying,
 *     and both now stack rather than sit on one line.
 *   · **Three surfaces written at opacity steps Tailwind does not have.** The
 *     URL-preview well, its hairline and the license badge's fill were all
 *     authored at fractional steps outside the generated set, so each compiled
 *     to nothing: the preview has been rendering as bare text and the badge as
 *     text with no wash behind it. That is the whole argument for not writing a
 *     surface by hand — a token either exists or the build fails, but an
 *     invented alpha step fails silently.
 *   · The hand-rolled field trio — a local label, a local error line and a
 *     local input with a 24px corner and a focus ring the rest of the family
 *     does not use. One ds input now, via the shared field.
 *   · The gradient call to action, teal at one end and plum at the other. Plum
 *     is a categorical DATA colour (§5 slot 6); as chrome it argues with the
 *     teal identity. It is a plain primary now, and it is the only primary on
 *     the page.
 *   · The hand-rolled consent checkbox, which set its own box colours and its
 *     own focus ring. The ds checkbox already draws both.
 *
 * NOTE: none of the class names behind those descriptions are written out
 * above. Tailwind scans raw file text, so a class quoted in a comment is a
 * class that gets generated — naming the ones you just deleted puts them
 * straight back into the bundle.
 *
 * Behaviour is untouched: same `useForm` fields, same POST to `store.store`,
 * same disabled gate on name + consent, same back target, and the same three
 * `id` hooks on the name field, the consent box and the submit button.
 *
 * `back={false}` because the shell's escape hatch leads to the marketing site,
 * and this screen is reached from inside a signed-in session. The footer link
 * carries the real way back — to the plan picker, or to the create-or-join fork
 * when a license already decided the plan.
 */
export default function CreateStore({ available_license = null, selected_plan = null, trial_days = 14 }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        plan: selected_plan?.slug || '',
        interval: selected_plan?.interval || 'monthly',
        terms_consent: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('store.store'));
    };

    const fmtCharge = () => {
        if (!selected_plan) return null;
        const sym = selected_plan.symbol || '$';
        const amt = Number(selected_plan.amount || 0);
        const rounded = Number.isInteger(amt) ? amt : Math.round(amt);
        const money = sym === 'Rs' ? `Rs ${rounded.toLocaleString()}` : `${sym}${rounded.toLocaleString()}`;
        return `${money}/${selected_plan.cadence === 'year' ? 'yr' : 'mo'}`;
    };

    const backHref = available_license ? route('store.create-or-join') : route('store.create');

    return (
        <AuthLayout
            title="Create Store — VenQore"
            heading="Name your store"
            subheading={
                available_license
                    ? `Your ${available_license.plan} license will be activated for this store.`
                    : `Last step — your ${trial_days}-day free trial starts as soon as your store is created.`
            }
            back={false}
            footer={
                <Link
                    href={backHref}
                    className="inline-flex items-center gap-1.5 font-medium text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                >
                    <ArrowLeft size={14} /> {available_license ? 'Back' : 'Change plan'}
                </Link>
            }
        >
            <AuthStack gap={6}>
                {/* Plan summary — the self-serve trial path. Stacks at 400px:
                    the plan line, the trial line, then the change link on its
                    own row, rather than three things fighting for one line. */}
                {selected_plan && (
                    <div className="rounded-lg bg-sunken p-4">
                        <p className="flex items-center gap-2 text-sm font-bold text-ink">
                            <Sparkles size={14} className="shrink-0 text-accent-text" />
                            {selected_plan.name} plan
                            <span className="font-medium text-ink-muted">
                                · {selected_plan.interval === 'annual' ? 'Annual' : 'Monthly'}
                            </span>
                        </p>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                            <Clock size={11} className="shrink-0 text-success-600 dark:text-success-400" />
                            Free for {trial_days} days, then {fmtCharge()}
                        </p>
                        <Link
                            href={route('store.create')}
                            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                        >
                            <Pencil size={11} /> Change
                        </Link>
                    </div>
                )}

                {/* License badge — the pre-paid / AppSumo path. */}
                {available_license && (
                    <AuthNotice tone="success">
                        <span className="flex items-start gap-2">
                            <Sparkles size={14} className="mt-0.5 shrink-0" />
                            <span>
                                <span className="font-bold capitalize">{available_license.plan} plan</span>{' '}
                                license will be activated for this store
                            </span>
                        </span>
                    </AuthNotice>
                )}

                {/* `plan` is posted but has no field of its own, so its error has
                    nowhere to land. It gets the form-level notice. */}
                {errors.plan ? <AuthNotice tone="danger">{errors.plan}</AuthNotice> : null}

                <AuthForm onSubmit={handleSubmit}>
                    <AuthField
                        id="store-name"
                        label="Store name"
                        type="text"
                        name="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="e.g. Ali Electronics, Green Mart..."
                        maxLength={100}
                        required
                        autoFocus
                        error={errors.name}
                    />

                    {/* Live preview of the address the store will live at. */}
                    {data.name && (
                        <div className="rounded-lg bg-sunken px-4 py-3">
                            <span className="mb-1 block text-2xs font-semibold uppercase tracking-wider text-ink-muted">
                                Your store URL will be
                            </span>
                            <span className="font-mono text-xs text-ink">
                                venqore.com/s/<span className="text-accent-text">[ID]</span>/dashboard
                            </span>
                        </div>
                    )}

                    {/* stopPropagation on the two links: the ds Checkbox wraps its
                        label in a <label>, so a click on anything inside it is
                        forwarded to the box. Without this, opening the Terms
                        silently un-ticks the thing you were agreeing to. */}
                    <AuthCheckbox
                        id="terms_consent"
                        checked={data.terms_consent}
                        onChange={(v) => setData('terms_consent', v)}
                        label={
                            <span className="text-xs leading-relaxed text-ink-secondary">
                                I agree to the{' '}
                                <Link
                                    href="/terms"
                                    target="_blank"
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-semibold text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                                >
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link
                                    href="/privacy"
                                    target="_blank"
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-semibold text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                                >
                                    Privacy Policy
                                </Link>
                                , including data handling &amp; shared catalog terms described in Section 6.
                            </span>
                        }
                    />

                    {errors.terms_consent ? (
                        <p className="text-xs font-medium text-danger-600">{errors.terms_consent}</p>
                    ) : null}

                    <AuthButton
                        id="create-store-submit"
                        type="submit"
                        disabled={processing || !data.name || !data.terms_consent}
                        icon={processing ? null : <Store size={16} />}
                        iconAfter={processing ? null : <ArrowRight size={16} />}
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Creating store…
                            </>
                        ) : (
                            available_license ? 'Create Store' : 'Start my free trial'
                        )}
                    </AuthButton>

                    <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-muted">
                        {available_license ? (
                            'You can rename your store and change settings at any time.'
                        ) : (
                            <>
                                <CreditCard size={11} className="shrink-0" /> No card charged today. You can
                                cancel anytime before your trial ends.
                            </>
                        )}
                    </p>
                </AuthForm>
            </AuthStack>
        </AuthLayout>
    );
}
