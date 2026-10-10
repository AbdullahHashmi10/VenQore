import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    UtensilsCrossed, ChefHat, Bike, ShoppingBag, Volume2,
    Percent, Power, Check, ExternalLink, Tv,
    LayoutGrid, VolumeX, AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';

/* ─────────────────────────────────────────────────────────────
   Small building blocks — pure V6 semantic tokens.
   text-ink / text-ink-muted / text-ink-secondary flip correctly
   in both light and dark mode without any dark: prefix.
───────────────────────────────────────────────────────────── */

function SectionHeader({ icon: Icon, title, description, accentClass = 'text-brand-600 dark:text-brand-400', bgClass = 'bg-brand-50 dark:bg-brand-900/30' }) {
    return (
        <div className="flex items-start gap-3 mb-1">
            <div className={`p-2 rounded-xl ${bgClass} ${accentClass} shrink-0 mt-0.5`}>
                <Icon size={18} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-ink">{title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed mt-0.5">{description}</p>
            </div>
        </div>
    );
}

function StatusBadge({ enabled, labelOn, labelOff }) {
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            enabled
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700/50'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700/50'
        }`}>
            {enabled
                ? <><CheckCircle2 size={11} /> {labelOn || 'Enabled'}</>
                : <><AlertCircle size={11} /> {labelOff || 'Disabled'}</>
            }
        </span>
    );
}

function ToggleButton({ enabled, onToggle, saving, labelOn = 'Turn Off', labelOff = 'Enable', colorOff = 'brand' }) {
    const colorMap = {
        brand:  'bg-brand-600 hover:bg-brand-700 text-white dark:bg-brand-500 dark:hover:bg-brand-400',
        amber:  'bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400',
        blue:   'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-400',
        emerald:'bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400',
    };

    return (
        <button
            type="button"
            disabled={saving}
            onClick={onToggle}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                enabled
                    ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700/50'
                    : colorMap[colorOff] || colorMap.brand
            }`}
        >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
            <span>{enabled ? labelOn : labelOff}</span>
        </button>
    );
}

/* Card container — bg-surface floats over the app background in both modes */
function SettingCard({ children, className = '' }) {
    return (
        <div className={`bg-surface border border-line rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm ${className}`}>
            {children}
        </div>
    );
}

function Divider() {
    return <div className="border-t border-line" />;
}

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
export default function RestaurantSettings({
    storeSlug,
    settings: initialSettings = {},
}) {
    const [settings, setSettings] = useState(initialSettings);
    const [saving, setSaving] = useState(false);
    const [savingKey, setSavingKey] = useState(null);

    const updateSetting = async (key, val) => {
        setSaving(true);
        setSavingKey(key);
        try {
            await axios.post(route('store.restaurant.settings.update', { store_slug: storeSlug }), {
                [key]: val,
            });
            setSettings(prev => ({ ...prev, [key]: val }));
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: 'Setting saved.', type: 'success' }
            }));
        } catch (err) {
            window.dispatchEvent(new CustomEvent('amd:toast', {
                detail: { message: err?.response?.data?.message || 'Failed to save setting.', type: 'error' }
            }));
        } finally {
            setSaving(false);
            setSavingKey(null);
        }
    };

    const is = (key) => String(settings[key]) === '1';
    const isSavingKey = (key) => saving && savingKey === key;

    return (
        <OneGlanceLayout>
            <Head title="Restaurant Settings — VenQore" />

            <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">

                {/* ── Page Header ───────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-800 text-brand-600 dark:text-brand-400 shrink-0">
                            <UtensilsCrossed size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                                Restaurant Operations
                            </h1>
                            <p className="text-sm text-ink-muted mt-0.5">
                                Configure kitchen routing, service modes, delivery lanes, and dining charges.
                            </p>
                        </div>
                    </div>

                    {/* Quick-launch buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href={route('store.restaurant.kitchen', { store_slug: storeSlug })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-sunken border border-line text-ink-secondary hover:text-ink text-xs font-semibold transition-all shadow-sm"
                        >
                            <ChefHat size={14} className="text-brand-600 dark:text-brand-400" />
                            <span>Kitchen Display</span>
                        </Link>
                        <Link
                            href={route('store.restaurant.queue', { store_slug: storeSlug })}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-sunken border border-line text-ink-secondary hover:text-ink text-xs font-semibold transition-all shadow-sm"
                        >
                            <Tv size={14} className="text-emerald-600 dark:text-emerald-400" />
                            <span>TV Queue</span>
                            <ExternalLink size={11} className="text-ink-faint" />
                        </Link>
                    </div>
                </div>

                {/* ── Section: Kitchen & Orders ─────────────────────── */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">Kitchen & Orders</span>
                        <div className="flex-1 border-t border-line" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Kitchen Display & KOT */}
                        <SettingCard>
                            <div className="flex items-start justify-between gap-3">
                                <SectionHeader
                                    icon={ChefHat}
                                    title="Kitchen Display & KOT Routing"
                                    description="Fire orders to the KDS and print kitchen tickets before settlement. Required for kitchen-side preparation."
                                    accentClass="text-brand-600 dark:text-brand-400"
                                    bgClass="bg-brand-50 dark:bg-brand-900/30"
                                />
                                <StatusBadge enabled={is('prepares_orders')} />
                            </div>
                            <Divider />
                            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-3">
                                <span className="text-xs text-ink-muted">
                                    {is('prepares_orders') ? 'Active for POS & Tables' : 'Orders bypass kitchen queue'}
                                </span>
                                <ToggleButton
                                    enabled={is('prepares_orders')}
                                    saving={isSavingKey('prepares_orders')}
                                    onToggle={() => updateSetting('prepares_orders', is('prepares_orders') ? '0' : '1')}
                                    labelOff="Enable KDS"
                                    colorOff="brand"
                                />
                            </div>
                        </SettingCard>

                        {/* 2. Kitchen & TV Chime Alerts */}
                        <SettingCard>
                            <div className="flex items-start justify-between gap-3">
                                <SectionHeader
                                    icon={is('pos_sound_alert') ? Volume2 : VolumeX}
                                    title="Kitchen & TV Chime Alerts"
                                    description="Play an audible chime when new orders arrive at the kitchen, and a ding-dong when orders are ready on the TV screen."
                                    accentClass="text-emerald-700 dark:text-emerald-400"
                                    bgClass="bg-emerald-50 dark:bg-emerald-900/30"
                                />
                                <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    is('pos_sound_alert')
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50'
                                        : 'bg-surface-2 text-ink-muted border-line'
                                }`}>
                                    {is('pos_sound_alert') ? 'Chimes On' : 'Muted'}
                                </span>
                            </div>
                            <Divider />
                            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-3">
                                <span className="text-xs text-ink-muted">Audio alert feedback</span>
                                <ToggleButton
                                    enabled={is('pos_sound_alert')}
                                    saving={isSavingKey('pos_sound_alert')}
                                    onToggle={() => updateSetting('pos_sound_alert', is('pos_sound_alert') ? '0' : '1')}
                                    labelOn="Mute Chimes"
                                    labelOff="Enable Chimes"
                                    colorOff="emerald"
                                />
                            </div>
                        </SettingCard>
                    </div>
                </section>

                {/* ── Section: Service Mode ─────────────────────────── */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">Dining Service Mode</span>
                        <div className="flex-1 border-t border-line" />
                    </div>

                    <SettingCard>
                        <div className="flex items-start justify-between gap-3">
                            <SectionHeader
                                icon={LayoutGrid}
                                title="Table Floor & Service Mode"
                                description="Choose how orders are handled. Table mode unlocks visual dining rooms, guest covers, and bill splitting."
                                accentClass="text-purple-700 dark:text-purple-400"
                                bgClass="bg-purple-50 dark:bg-purple-900/30"
                            />
                            <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700/50 capitalize">
                                {settings.service_mode || 'both'}
                            </span>
                        </div>

                        <Divider />

                        <div>
                            <p className="text-xs font-semibold text-ink-secondary mb-3">Select service mode</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {[
                                    { key: 'both',    label: 'Tables + Counter', sub: 'Full dine-in & takeaway' },
                                    { key: 'tables',  label: 'Tables Only',      sub: 'Dine-in with floor plan' },
                                    { key: 'counter', label: 'Counter Only',     sub: 'Walk-in & collection' },
                                ].map((mode) => (
                                    <button
                                        key={mode.key}
                                        type="button"
                                        disabled={saving}
                                        onClick={() => updateSetting('service_mode', mode.key)}
                                        className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all disabled:opacity-50 ${
                                            settings.service_mode === mode.key
                                                ? 'bg-purple-600 dark:bg-purple-500 text-white border-purple-600 dark:border-purple-500 shadow-sm'
                                                : 'bg-sunken text-ink border-line hover:border-purple-300 dark:hover:border-purple-700 hover:bg-surface'
                                        }`}
                                    >
                                        <span className="text-xs font-bold">{mode.label}</span>
                                        <span className={`text-xs ${settings.service_mode === mode.key ? 'text-purple-100' : 'text-ink-muted'}`}>
                                            {mode.sub}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </SettingCard>
                </section>

                {/* ── Section: Order Lanes ──────────────────────────── */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">Order Lanes</span>
                        <div className="flex-1 border-t border-line" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 3. Delivery Lane & Dispatch */}
                        <SettingCard>
                            <div className="flex items-start justify-between gap-3">
                                <SectionHeader
                                    icon={Bike}
                                    title="Delivery Lane & Dispatch"
                                    description="Allow orders to be dispatched for home delivery, assign riders, and monitor live statuses and rider cash-up."
                                    accentClass="text-amber-700 dark:text-amber-400"
                                    bgClass="bg-amber-50 dark:bg-amber-900/30"
                                />
                                <StatusBadge enabled={is('lane_delivery')} />
                            </div>
                            <Divider />
                            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-3">
                                <span className="text-xs text-ink-muted">
                                    {is('lane_delivery') ? 'Delivery lane active' : 'Delivery lane hidden'}
                                </span>
                                <ToggleButton
                                    enabled={is('lane_delivery')}
                                    saving={isSavingKey('lane_delivery')}
                                    onToggle={() => updateSetting('lane_delivery', is('lane_delivery') ? '0' : '1')}
                                    labelOff="Enable Delivery"
                                    colorOff="amber"
                                />
                            </div>
                        </SettingCard>

                        {/* 4. Takeaway Lane */}
                        <SettingCard>
                            <div className="flex items-start justify-between gap-3">
                                <SectionHeader
                                    icon={ShoppingBag}
                                    title="Takeaway Lane"
                                    description="Allow counter takeaway orders without seating guests. Orders display on the TV pickup queue for self-collection."
                                    accentClass="text-blue-700 dark:text-blue-400"
                                    bgClass="bg-blue-50 dark:bg-blue-900/30"
                                />
                                <StatusBadge enabled={is('lane_takeaway')} />
                            </div>
                            <Divider />
                            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-3">
                                <span className="text-xs text-ink-muted">
                                    {is('lane_takeaway') ? 'Takeaway lane active' : 'Takeaway lane hidden'}
                                </span>
                                <ToggleButton
                                    enabled={is('lane_takeaway')}
                                    saving={isSavingKey('lane_takeaway')}
                                    onToggle={() => updateSetting('lane_takeaway', is('lane_takeaway') ? '0' : '1')}
                                    labelOff="Enable Takeaway"
                                    colorOff="blue"
                                />
                            </div>
                        </SettingCard>
                    </div>
                </section>

                {/* ── Section: Billing ──────────────────────────────── */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-ink-muted">Billing</span>
                        <div className="flex-1 border-t border-line" />
                    </div>

                    {/* 5. House Service Charge */}
                    <SettingCard>
                        <div className="flex items-start justify-between gap-3">
                            <SectionHeader
                                icon={Percent}
                                title="House Service Charge"
                                description="Automatic service percentage added to dine-in guest bills. Set to 0% to disable the service charge for all tables."
                                accentClass="text-brand-700 dark:text-brand-400"
                                bgClass="bg-brand-50 dark:bg-brand-900/30"
                            />
                            <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-700/50">
                                {settings.service_charge_percent || 0}%
                            </span>
                        </div>

                        <Divider />

                        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                                    Service charge rate
                                </label>
                                <div className="relative w-36">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={settings.service_charge_percent ?? 0}
                                        onChange={(e) => setSettings(prev => ({ ...prev, service_charge_percent: e.target.value }))}
                                        className="w-full bg-sunken border border-line rounded-xl px-3 py-2 pr-8 text-sm text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-muted">%</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={() => updateSetting('service_charge_percent', settings.service_charge_percent)}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50 mt-5"
                            >
                                {isSavingKey('service_charge_percent') ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                <span>Save Rate</span>
                            </button>
                        </div>
                    </SettingCard>
                </section>

            </div>
        </OneGlanceLayout>
    );
}
