import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { getCurrencySymbol } from '@/Utils/format';
import {
    Settings as SettingsIcon, Sliders, Gift, Save, Info,
    Users, Package, Percent, Wallet, BellOff, Bell, Ruler,
} from 'lucide-react';

/**
 * Growth Engine — settings.
 *
 * This page did not exist. `growth-engine.settings` rendered
 * `Inertia::render('GrowthEngine/Settings', ...)` against a component that was
 * never created, so hitting the route threw. It was unreachable from the
 * sidebar, which is presumably why nobody noticed.
 *
 * Beyond the loyalty settings it now also shows the figures the engine LEARNED
 * from the tenant's own trading, and lets the owner un-mute any insight type
 * the tuner suppressed. Showing the learned values matters: it is the
 * difference between the owner believing the software guessed and knowing it
 * measured.
 */
export default function GrowthSettings({ settings, scorecard, catalog, learned }) {
    const cur = getCurrencySymbol();
    const [tab, setTab] = useState('engine');

    const { data, setData, post, processing, recentlySuccessful, errors } = useForm({
        regular_customer_min_orders:    settings.regular_customer_min_orders ?? 2,
        regular_customer_period_days:   settings.regular_customer_period_days ?? 90,
        min_order_value_filter:         settings.min_order_value_filter ?? 0,
        lookahead_days:                 settings.lookahead_days ?? 7,
        loyalty_points_per_amount:      settings.loyalty_points_per_amount ?? 100,
        loyalty_points_earned_per_unit: settings.loyalty_points_earned_per_unit ?? 1,
        loyalty_redemption_rate:        settings.loyalty_redemption_rate ?? 10,
    });

    const { store } = usePage().props;

    const submit = (e) => {
        e.preventDefault();
        post(route('store.growth-engine.update-settings', { store_slug: store.slug }), { preserveScroll: true });
    };

    const unmute = (type) => {
        router.post(route('store.growth-engine.unmute', { store_slug: store.slug }), { insight_type: type }, { preserveScroll: true });
    };

    const mutedTypes = (scorecard?.brains || [])
        .flatMap((b) => b.types || [])
        .filter((t) => t.muted);

    return (
        <OneGlanceLayout title="Growth Engine Settings" activeMenu="Growth Engine">
            <Head title="Growth Engine Settings" />

            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <SettingsIcon size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Growth Engine Settings</h1>
                </div>
                <p className="text-slate-500 text-sm">
                    Most thresholds tune themselves from your own trading history. These are the few you control directly.
                </p>
            </div>

            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800">
                {[
                    { k: 'engine',  label: 'Engine',      icon: Sliders },
                    { k: 'learned', label: 'What it learned', icon: Ruler },
                    { k: 'muted',   label: `Muted insights${mutedTypes.length ? ` (${mutedTypes.length})` : ''}`, icon: BellOff },
                    { k: 'loyalty', label: 'Loyalty',     icon: Gift },
                ].map(({ k, label, icon: Icon }) => (
                    <button key={k} onClick={() => setTab(k)}
                        className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 ${
                            tab === k
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}>
                        <Icon size={15} /> {label}
                    </button>
                ))}
            </div>

            {recentlySuccessful && (
                <div className="mb-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-5 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    Settings saved. They take effect on the next analysis.
                </div>
            )}

            {/* ───────────────────── ENGINE ───────────────────── */}
            {tab === 'engine' && (
                <form onSubmit={submit} className="max-w-2xl space-y-5">
                    <Callout>
                        The engine no longer relies on fixed rupee thresholds. It works out what "a normal order",
                        "a normal reorder gap" and "a normal supplier lead time" mean <em>for your business</em> and
                        scales every rule to that. These settings only override the few things that are genuinely a
                        matter of preference.
                    </Callout>

                    <Card title="Customer analysis">
                        <Field label="Minimum orders before a customer is analysed"
                            hint="Below this we don't have enough of a pattern to make an honest prediction. Two is usually right; three or more will miss your newer customers."
                            error={errors.regular_customer_min_orders}>
                            <input type="number" min="1" value={data.regular_customer_min_orders}
                                onChange={(e) => setData('regular_customer_min_orders', e.target.value)}
                                className={inputCls} />
                        </Field>

                        <Field label="History window (days)"
                            hint="How far back to look when working out a customer's buying rhythm."
                            error={errors.regular_customer_period_days}>
                            <input type="number" min="7" value={data.regular_customer_period_days}
                                onChange={(e) => setData('regular_customer_period_days', e.target.value)}
                                className={inputCls} />
                        </Field>

                        <Field label={`Ignore customers spending under (${cur})`}
                            hint="Set to 0 to include everyone. The engine already scales to your typical order size, so leaving this at 0 is usually best."
                            error={errors.min_order_value_filter}>
                            <input type="number" min="0" value={data.min_order_value_filter}
                                onChange={(e) => setData('min_order_value_filter', e.target.value)}
                                className={inputCls} />
                        </Field>
                    </Card>

                    <Card title="Stock forecasting">
                        <Field label="How far ahead to warn (days)"
                            hint="A floor, not a fixed value — the engine automatically extends this to cover your actual supplier lead time so warnings arrive with enough time to act."
                            error={errors.lookahead_days}>
                            <input type="number" min="1" max="30" value={data.lookahead_days}
                                onChange={(e) => setData('lookahead_days', e.target.value)}
                                className={inputCls} />
                        </Field>
                    </Card>

                    <button type="submit" disabled={processing}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                        <Save size={16} /> {processing ? 'Saving…' : 'Save settings'}
                    </button>
                </form>
            )}

            {/* ───────────────────── LEARNED ───────────────────── */}
            {tab === 'learned' && (
                <div className="max-w-2xl space-y-5">
                    <Callout>
                        These figures are measured from your own sales and purchases, not entered by anyone.
                        Every threshold in the engine is expressed relative to them, which is why the same rules
                        behave sensibly for a small counter shop and for a distributor.
                    </Callout>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <LearnedCard icon={Wallet} label="Your typical order"
                            value={`${cur} ${Number(learned?.median_order_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                            note="The median of your last 6 months of sales. Sets what counts as a meaningful amount." />
                        <LearnedCard icon={Users} label="Typical reorder gap"
                            value={`${learned?.median_reorder_gap ?? '—'} days`}
                            note="How long your customers normally take to come back. Used to judge new customers who have no rhythm of their own yet." />
                        <LearnedCard icon={Package} label="Supplier lead time"
                            value={`${learned?.supplier_lead_time ?? '—'} days`}
                            note="Learned from the gap between your repeat purchases. Stock warnings are timed to arrive before this window closes." />
                        <LearnedCard icon={Percent} label="Your payment terms"
                            value={`${learned?.payment_terms ?? '—'} days`}
                            note="Averaged from the due dates on your invoices. A payment isn't chased until it is genuinely late by your own standard." />
                    </div>

                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
                        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-1">Attention threshold</p>
                        <p className="text-lg font-bold text-slate-800 dark:text-white">
                            {cur} {Number(learned?.materiality_floor || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[13px] text-slate-500 mt-1">
                            Amounts below this are not worth interrupting you for, so the engine stays quiet about them.
                            Derived from your typical order value.
                        </p>
                    </div>
                </div>
            )}

            {/* ───────────────────── MUTED ───────────────────── */}
            {tab === 'muted' && (
                <div className="max-w-2xl space-y-5">
                    <Callout>
                        When an insight type is repeatedly wrong, or repeatedly dismissed without ever being acted on,
                        the engine stops showing it for a few weeks rather than continuing to waste your attention.
                        Every mute expires on its own — and you can lift any of them here immediately.
                    </Callout>

                    {mutedTypes.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                            <Bell size={28} className="mx-auto text-slate-300 mb-3" />
                            <h3 className="font-bold text-slate-800 dark:text-white">Nothing is muted</h3>
                            <p className="text-slate-500 text-sm mt-1">Every insight type is currently active.</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                            {mutedTypes.map((t) => (
                                <div key={t.type} className="px-5 py-4 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-white">{t.label}</p>
                                        <p className="text-[12px] text-slate-500 mt-0.5">{t.mute_reason}</p>
                                    </div>
                                    <button onClick={() => unmute(t.type)}
                                        className="shrink-0 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                                        Show again
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ───────────────────── LOYALTY ───────────────────── */}
            {tab === 'loyalty' && (
                <form onSubmit={submit} className="max-w-2xl space-y-5">
                    <Card title="Loyalty points">
                        <Field label={`Spend per point block (${cur})`}
                            hint={`Customers earn points for every ${cur} ${data.loyalty_points_per_amount} spent.`}
                            error={errors.loyalty_points_per_amount}>
                            <input type="number" min="1" value={data.loyalty_points_per_amount}
                                onChange={(e) => setData('loyalty_points_per_amount', e.target.value)}
                                className={inputCls} />
                        </Field>

                        <Field label="Points earned per block"
                            hint="How many points that spend is worth."
                            error={errors.loyalty_points_earned_per_unit}>
                            <input type="number" min="1" value={data.loyalty_points_earned_per_unit}
                                onChange={(e) => setData('loyalty_points_earned_per_unit', e.target.value)}
                                className={inputCls} />
                        </Field>

                        <Field label={`Points per ${cur} 1 when redeeming`}
                            hint={`${data.loyalty_redemption_rate} points = ${cur} 1 off a bill.`}
                            error={errors.loyalty_redemption_rate}>
                            <input type="number" min="1" value={data.loyalty_redemption_rate}
                                onChange={(e) => setData('loyalty_redemption_rate', e.target.value)}
                                className={inputCls} />
                        </Field>

                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-[13px] text-slate-600 dark:text-slate-400">
                            A customer spending {cur} {Number(data.loyalty_points_per_amount * 10).toLocaleString()} earns{' '}
                            <strong>{data.loyalty_points_earned_per_unit * 10} points</strong>, worth about{' '}
                            <strong>{cur} {((data.loyalty_points_earned_per_unit * 10) / data.loyalty_redemption_rate).toFixed(2)}</strong> off a future bill.
                        </div>
                    </Card>

                    <button type="submit" disabled={processing}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                        <Save size={16} /> {processing ? 'Saving…' : 'Save settings'}
                    </button>
                </form>
            )}
        </OneGlanceLayout>
    );
}

/* ─────────────── small building blocks ─────────────── */

const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ' +
    'text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none';

function Card({ title, children }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
            <h2 className="font-bold text-slate-800 dark:text-white">{title}</h2>
            {children}
        </div>
    );
}

function Field({ label, hint, error, children }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
            {children}
            {hint && <p className="text-[12px] text-slate-500 mt-1.5 leading-relaxed">{hint}</p>}
            {error && <p className="text-[12px] text-red-500 mt-1">{error}</p>}
        </div>
    );
}

function Callout({ children }) {
    return (
        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 px-5 py-4 flex gap-3">
            <Info size={17} className="text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-[13px] text-indigo-900 dark:text-indigo-200 leading-relaxed">{children}</p>
        </div>
    );
}

function LearnedCard({ icon: Icon, label, value, note }) {
    return (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
            <div className="flex items-center gap-2 mb-1">
                <Icon size={15} className="text-indigo-500" />
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">{label}</p>
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
            <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{note}</p>
        </div>
    );
}
