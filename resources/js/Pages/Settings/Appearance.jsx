import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, Loader2, Monitor, Moon, Sun } from 'lucide-react';

import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { useAppearance } from '@/Contexts/AppearanceContext';
import { THEME_CATALOG } from '@/theme/active';

/**
 * Settings → Appearance.
 *
 * ── The design brief this screen answers ────────────────────────────────────
 *
 * "Make VenQore feel like my software", not "let the user design a website".
 * So: two themes, light or dark, and an optional pair of brand colours. Every
 * control here changes something a shopkeeper can name, and every one of them
 * has been looked at on every screen. Nothing here can resize a control or
 * reflow a layout — that is the property that makes it safe to ship.
 *
 * Everything applies live as you touch it — the page you are standing on is the
 * preview, which is more honest than a thumbnail and costs nothing, since the
 * whole theme system is CSS attributes on <html>.
 */

const MODES = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
];

/* ------------------------------------------------------------------ *
 * Shared building blocks
 * ------------------------------------------------------------------ */

function Section({ title, description, children }) {
    return (
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <div className="mb-4">
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                {description && (
                    <p className="mt-1 text-sm text-ink-muted">{description}</p>
                )}
            </div>
            {children}
        </section>
    );
}

/**
 * A segmented control.
 *
 * `min-h-control-md` rather than a fixed pixel height: control sizing is a theme
 * token, so a Spacious layout gets genuinely larger touch targets instead of the
 * same 36px box with more air around it.
 */
function Segmented({ options, value, onChange, columns = 3 }) {
    return (
        <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
            {options.map((option) => {
                const selected = option.value === value;
                const Icon = option.Icon;

                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={selected}
                        className={[
                            'flex min-h-control-md flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 text-sm transition-colors',
                            selected
                                ? 'border-brand-500 bg-brand-500/10 text-ink'
                                : 'border-line bg-app text-ink-secondary hover:bg-interactive-hover',
                        ].join(' ')}
                    >
                        <span className="flex items-center gap-1.5 font-medium">
                            {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
                            {option.label}
                        </span>
                        {option.hint && (
                            <span className="text-2xs text-ink-muted">{option.hint}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Colour input.
 *
 * A native `<input type="color">` sits behind a swatch. It is not the prettiest
 * control, but it is the one every operating system already knows how to show
 * on a touch device, and a hand-rolled picker on a phone is reliably worse.
 */
function ColourField({ label, value, fallbackLabel, onChange }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-ink-secondary">{label}</label>
            <div className="flex items-center gap-3">
                <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-line-strong">
                    <span
                        className="absolute inset-0"
                        style={value ? { backgroundColor: value } : undefined}
                        aria-hidden="true"
                    />
                    {!value && (
                        <span className="absolute inset-0 bg-gradient-brand" aria-hidden="true" />
                    )}
                    <input
                        type="color"
                        value={value || '#000000'}
                        onChange={(event) => onChange(event.target.value)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label={label}
                    />
                </label>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{value || fallbackLabel}</p>
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange(null)}
                            className="mt-0.5 text-xs font-medium text-brand-500 hover:underline"
                        >
                            Reset to theme colour
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

export default function Appearance({ canManageStoreDefault, storeSlug }) {
    const { appearance, update, saving } = useAppearance();
    const { props } = usePage();
    const [switching, setSwitching] = useState(false);

    const experience = appearance.experience || 'classic';

    const switchExperience = (next) => {
        if (next === experience) return;
        setSwitching(true);

        router.post(
            route('store.appearance.experience', { store_slug: storeSlug }),
            { experience: next },
            { onFinish: () => setSwitching(false) },
        );
    };

    const saveAsStoreDefault = () => {
        router.post(
            route('store.appearance.store-default', { store_slug: storeSlug }),
            {
                // Only what this screen still lets someone change. Font, density
                // and radius are omitted on purpose: the backend pins them to
                // their defaults, and sending them back would persist a value
                // the user has no control over.
                theme: appearance.theme,
                mode: appearance.mode,
                primary: appearance.primary,
                accent: appearance.accent,
            },
            { preserveScroll: true },
        );
    };

    return (
        <OneGlanceLayout activeMenu="Settings" title="Appearance">
            <Head title="Appearance" />

            <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
                <header>
                    <h1 className="text-2xl font-semibold text-ink">Appearance</h1>
                    <p className="mt-1 text-sm text-ink-muted">
                        These settings are yours. They follow you to any device you sign in from,
                        and they change nothing about your data or how your business is configured.
                    </p>
                </header>

                {/* ── Experience ─────────────────────────────────────────── */}
                <Section
                    title="Experience"
                    description="Classic is the VenQore you already know. New is a configurable workspace you build from cards. You can move between them whenever you like."
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        {[
                            {
                                value: 'classic',
                                title: 'Classic',
                                body: 'The existing dashboard and layout, unchanged.',
                            },
                            {
                                value: 'new',
                                title: 'New',
                                body: 'A dashboard you arrange yourself, card by card.',
                            },
                        ].map((option) => {
                            const selected = option.value === experience;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    disabled={switching}
                                    onClick={() => switchExperience(option.value)}
                                    className={[
                                        'rounded-xl border p-4 text-left transition-colors disabled:opacity-60',
                                        selected
                                            ? 'border-brand-500 bg-brand-500/10'
                                            : 'border-line bg-app hover:bg-interactive-hover',
                                    ].join(' ')}
                                >
                                    <span className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-ink">{option.title}</span>
                                        {selected && <Check className="h-4 w-4 text-brand-500" aria-hidden="true" />}
                                    </span>
                                    <span className="mt-1 block text-sm text-ink-muted">{option.body}</span>
                                </button>
                            );
                        })}
                    </div>
                </Section>

                {/* ── Theme ──────────────────────────────────────────────── */}
                <Section
                    title="Theme"
                    description="Applies everywhere — the dashboard, POS, reports, every screen."
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        {THEME_CATALOG.map((theme) => {
                            const selected = theme.id === appearance.theme;

                            return (
                                <button
                                    key={theme.id}
                                    type="button"
                                    onClick={() => update({ theme: theme.id })}
                                    className={[
                                        'flex items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                                        selected
                                            ? 'border-brand-500 bg-brand-500/10'
                                            : 'border-line bg-app hover:bg-interactive-hover',
                                    ].join(' ')}
                                >
                                    {/* Swatches are literal hex, not theme tokens: this chip has
                                        to show what a theme looks like while a different one is
                                        active, so it is the one place tokens would be wrong. */}
                                    <span className="flex shrink-0 overflow-hidden rounded-lg border border-line-strong">
                                        {theme.swatch.map((colour) => (
                                            <span
                                                key={colour}
                                                className="h-9 w-4"
                                                style={{ backgroundColor: colour }}
                                            />
                                        ))}
                                    </span>

                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className="truncate font-medium text-ink">{theme.name}</span>
                                            {selected && <Check className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-ink-muted">
                                            {theme.tagline}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Section>

                {/* ── Mode ───────────────────────────────────────────────── */}
                <Section title="Light or dark" description="System follows your device setting.">
                    <Segmented
                        options={MODES}
                        value={appearance.mode}
                        onChange={(mode) => update({ mode })}
                    />
                </Section>

                {/* ── Colour ─────────────────────────────────────────────── */}
                <Section
                    title="Your colours"
                    description="Optional. Leave these alone to use the colours the theme was designed with."
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <ColourField
                            label="Primary"
                            value={appearance.primary}
                            fallbackLabel="Theme colour"
                            onChange={(primary) => update({ primary })}
                        />
                        <ColourField
                            label="Accent"
                            value={appearance.accent}
                            fallbackLabel="Theme colour"
                            onChange={(accent) => update({ accent })}
                        />
                    </div>
                </Section>

                {/* ── Typeface, density and corners: deliberately absent ──────
                    These dials existed and were removed. Each one rescaled
                    controls and spacing across all 393 screens, and no one had
                    looked at more than a handful of them in Compact or Spacious.
                    Shipping a switch that silently overlaps text on pages nobody
                    checked is worse than not offering the choice, so the app now
                    renders at one tested size. The backend constants remain,
                    pinned to their defaults, so nothing can alter sizing.
                 ──────────────────────────────────────────────────────────── */}

                {/* ── Store default ──────────────────────────────────────── */}
                {canManageStoreDefault && (
                    <Section
                        title="Store default"
                        description="New team members start with these settings. It never overrides a choice someone has already made for themselves."
                    >
                        <button
                            type="button"
                            onClick={saveAsStoreDefault}
                            className="min-h-control-md rounded-xl border border-line bg-app px-4 text-sm font-medium text-ink transition-colors hover:bg-interactive-hover"
                        >
                            Save my current settings as the store default
                        </button>
                    </Section>
                )}

                {props.flash?.success && (
                    <p className="text-sm text-success-600">{props.flash.success}</p>
                )}

                <p className="flex h-5 items-center gap-2 text-xs text-ink-muted" aria-live="polite">
                    {saving && (
                        <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            Saving…
                        </>
                    )}
                </p>
            </div>
        </OneGlanceLayout>
    );
}
