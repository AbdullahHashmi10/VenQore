import React, { useEffect, useMemo, useState } from 'react';
import { X, Check, Star, AlertTriangle } from 'lucide-react';

import {
    CATEGORIES,
    CATEGORY_KEYS,
    fitsFor,
    dimensionsOf,
    chartsForShape,
    categoriesForChart,
    minCategoryForChart,
    isCategoryLegal,
    defaultFit,
    size as rowSize,
} from '../layoutLaw';
import { CHART_LABELS } from '../chartRegistry';

/**
 * DashboardCardEditor — edit one card in place.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * `DashboardCardFrame` has accepted an `onEdit` prop since it was written, and
 * `Pages/Dashboard.jsx` never passed one. The API endpoint (`updateCard`) has
 * existed just as long. So a card could be added and deleted but never edited:
 * to change a period you deleted the card and built it again from step one.
 *
 * The builder sheet asks four questions once. This asks all of them again, any
 * time, plus the ones the builder never asked — category, fit and emphasis.
 *
 * ── The knobs, and where each one's legality comes from ─────────────────────
 *
 *   Title      free text; empty falls back to the reading's own label
 *   Period     the definition's declared periods
 *   Chart      LayoutLaw.chartsForShape() — a chart may only render a shape
 *              it is legal for
 *   Category   C1..C6, floored by LayoutLaw.minCategoryForChart(). This is the
 *              legibility floor the twelve-preset system could not express,
 *              which is how a pie chart could be persisted at 2x4
 *   Fit        the category's declared fits, each with its pixel width floor
 *   Emphasis   M1 — exactly one accent-filled card per board, and it must be
 *              the headline metric
 *
 * Everything that is not a column of its own persists into the `style` JSON
 * bag, which has existed since the dashboards migration and which nothing read.
 *
 * Written in the frame's idiom — CSS custom properties, no Tailwind classes —
 * so it follows the V6 token layer directly and needs no `dark:` twin.
 */
export default function DashboardCardEditor({
    card,
    definition,
    isOpen,
    onClose,
    onSave,
    accentHolder = null,
}) {
    const [draft, setDraft] = useState(null);

    // Re-seed whenever a different card is opened. Editing card A, closing, then
    // opening card B must not show A's draft.
    useEffect(() => {
        if (!card) return setDraft(null);

        setDraft({
            title_override: card.title_override || '',
            period: card.period || definition?.default_period || 'today',
            chart: card.chart || 'stat',
            category: card.category || 'C3',
            fit: card.fit || null,
            accent: Boolean(card.style?.accent),
            periodPicker: Boolean(card.style?.periodPicker),
        });
    }, [card?.id, isOpen]);

    const shape = definition?.shape || 'SCALAR';
    const legalCharts = useMemo(() => chartsForShape(shape), [shape]);
    const periods = definition?.periods || ['today'];

    /**
     * Categories offered for the chosen chart.
     *
     * Legality is a floor, not a whitelist — a chart may always be given MORE
     * room than it needs. So the list runs from the floor upward, and the ones
     * the chart was designed for are marked rather than being the only options.
     */
    const categoryOptions = useMemo(() => {
        if (!draft) return [];
        const designedFor = categoriesForChart(draft.chart);
        const floor = minCategoryForChart(draft.chart);

        return CATEGORY_KEYS
            .filter((key) => isCategoryLegal(draft.chart, key))
            .map((key) => ({
                key,
                ...CATEGORIES[key],
                recommended: designedFor.includes(key),
                isFloor: key === floor,
            }));
    }, [draft?.chart]);

    const fitOptions = useMemo(
        () => (draft ? fitsFor(draft.category) : []),
        [draft?.category],
    );

    if (!isOpen || !draft) return null;

    /**
     * Changing the chart can strand the card in a category below the new
     * chart's legibility floor — a stat in a C1 tile is fine, a heatmap in one
     * is not. Lift it to the floor rather than saving something illegal.
     */
    const setChart = (chart) => {
        setDraft((d) => {
            const category = isCategoryLegal(chart, d.category)
                ? d.category
                : minCategoryForChart(chart);

            return {
                ...d,
                chart,
                category,
                fit: category === d.category ? d.fit : defaultFit(category)?.key ?? null,
            };
        });
    };

    // A fit belongs to exactly one category, so changing category invalidates it.
    const setCategory = (category) =>
        setDraft((d) => ({ ...d, category, fit: defaultFit(category)?.key ?? null }));

    const submit = () => {
        const { w, h } = dimensionsOf(draft.category, draft.fit);

        onSave({
            title_override: draft.title_override.trim() || null,
            period: draft.period,
            chart: draft.chart,
            category: draft.category,
            fit: draft.fit,
            w,
            h,
            style: {
                accent: draft.accent,
                periodPicker: draft.periodPicker,
            },
        });
    };

    // M1 warning: naming a second accent card silently demotes the first, and
    // the user should be told which one before they commit to it.
    const stealingAccent =
        draft.accent && accentHolder && accentHolder.id !== card.id;

    return (
        <>
            {/* Scrim. z-drawer minus one — every scrim is its owner's level − 1,
                never a separate number (DESIGN-RULES v3.0 §3). */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'var(--vq-scrim)',
                    zIndex: 'calc(var(--vq-z-drawer) - 1)',
                    animation: `vqFade var(--vq-dur-2) var(--vq-ease-out)`,
                }}
            />

            <aside
                role="dialog"
                aria-label={`Edit ${definition?.label || 'card'}`}
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: 'min(420px, 100vw)',
                    background: 'var(--vq-surface)',
                    borderLeft: '1px solid var(--vq-line)',
                    boxShadow: 'var(--vq-elev-3)',
                    zIndex: 'var(--vq-z-drawer)',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: `vqSlideIn var(--vq-dur-3) var(--vq-ease-out)`,
                }}
            >
                <Header definition={definition} onClose={onClose} />

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gap: '24px' }}>
                    <Field
                        label="Title"
                        hint="Leave empty to use the reading's own name."
                    >
                        <input
                            value={draft.title_override}
                            onChange={(e) => setDraft((d) => ({ ...d, title_override: e.target.value }))}
                            placeholder={definition?.label || 'Metric'}
                            maxLength={80}
                            style={inputStyle}
                        />
                    </Field>

                    <Field label="Period">
                        <Segmented
                            options={periods.map((p) => ({ value: p, label: PERIOD_LABELS[p] || p }))}
                            value={draft.period}
                            onChange={(period) => setDraft((d) => ({ ...d, period }))}
                        />
                    </Field>

                    <Field
                        label="Chart"
                        hint={`${shape} readings can render as ${legalCharts.length} of the 21 chart types.`}
                    >
                        <Grid>
                            {legalCharts.map((chart) => (
                                <Choice
                                    key={chart}
                                    selected={draft.chart === chart}
                                    onClick={() => setChart(chart)}
                                    label={CHART_LABELS?.[chart] || chart}
                                />
                            ))}
                        </Grid>
                    </Field>

                    <Field
                        label="Size"
                        hint={`${CATEGORIES[draft.category]?.role}. A card widens before it degrades.`}
                    >
                        <Grid>
                            {categoryOptions.map((cat) => (
                                <Choice
                                    key={cat.key}
                                    selected={draft.category === cat.key}
                                    onClick={() => setCategory(cat.key)}
                                    label={`${cat.key} ${cat.name}`}
                                    note={cat.isFloor ? 'smallest legible' : cat.recommended ? 'suits this chart' : null}
                                />
                            ))}
                        </Grid>
                    </Field>

                    <Field
                        label="Fit"
                        hint="Columns × rows, and the narrowest width the card may use it at."
                    >
                        <Grid>
                            {fitOptions.map((fit) => (
                                <Choice
                                    key={fit.key}
                                    selected={draft.fit === fit.key || (!draft.fit && fit.default)}
                                    onClick={() => setDraft((d) => ({ ...d, fit: fit.key }))}
                                    label={`${fit.w} × ${fit.h}`}
                                    note={`${fit.label} · ≥${fit.floor}px · ${rowSize(fit.h)}px tall`}
                                />
                            ))}
                        </Grid>
                    </Field>

                    <Field
                        label="Emphasis"
                        hint="One card per board carries the accent fill, and it should be the number that matters most."
                    >
                        <button
                            onClick={() => setDraft((d) => ({ ...d, accent: !d.accent }))}
                            style={{
                                ...choiceStyle(draft.accent),
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                width: '100%',
                                textAlign: 'left',
                            }}
                        >
                            <Star
                                size={15}
                                fill={draft.accent ? 'currentColor' : 'none'}
                                style={{ flexShrink: 0 }}
                            />
                            <span style={{ fontSize: 'var(--vq-fs-small)' }}>
                                {draft.accent ? 'Accent fill — the headline metric' : 'Plain surface'}
                            </span>
                        </button>

                        {stealingAccent && (
                            <Notice>
                                <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span>
                                    “{accentHolder.label}” currently holds the accent and will go
                                    back to a plain surface.
                                </span>
                            </Notice>
                        )}
                    </Field>

                    <Field label="Period control">
                        <Toggle
                            checked={draft.periodPicker}
                            onChange={(periodPicker) => setDraft((d) => ({ ...d, periodPicker }))}
                            label="Show a period switcher on the card face"
                        />
                    </Field>
                </div>

                <Footer onClose={onClose} onSubmit={submit} />
            </aside>

            <style>{`
                @keyframes vqFade { from { opacity: 0 } to { opacity: 1 } }
                @keyframes vqSlideIn {
                    from { transform: translateX(16px); opacity: 0 }
                    to   { transform: none; opacity: 1 }
                }
                @media (prefers-reduced-motion: reduce) {
                    @keyframes vqSlideIn { from { opacity: 0 } to { opacity: 1 } }
                }
`}</style>
        </>
    );
}

/* ------------------------------------------------------------------ *
 * Pieces
 * ------------------------------------------------------------------ */

const PERIOD_LABELS = {
    today: 'Today',
    week: 'Week',
    month: 'Month',
    quarter: 'Quarter',
    year: 'Year',
    all: 'All time',
};

const inputStyle = {
    width: '100%',
    height: 'var(--vq-control-lg)',
    padding: '0 14px',
    // 16px minimum, always: anything smaller makes iOS Safari zoom the viewport
    // on focus, which reads as the page breaking (DESIGN-RULES v3.0 §13).
    fontSize: 'var(--vq-fs-body)',
    fontFamily: 'var(--vq-font-sans)',
    color: 'var(--vq-text)',
    background: 'var(--vq-bg)',
    border: '1px solid var(--vq-line)',
    borderRadius: 'var(--vq-r-md)',
    outline: 'none',
};

const choiceStyle = (selected) => ({
    padding: '10px 12px',
    borderRadius: 'var(--vq-r-md)',
    border: `1px solid ${selected ? 'var(--vq-accent)' : 'var(--vq-line)'}`,
    background: selected ? 'var(--vq-accent-quiet)' : 'var(--vq-surface)',
    color: selected ? 'var(--vq-accent-text)' : 'var(--vq-text-2)',
    cursor: 'pointer',
    // Colour and border only. Never a transform — a control that grows on hover
    // makes the layout feel unstable (DESIGN-RULES v3.0 §9).
    transition: `background var(--vq-dur-1) var(--vq-ease-out), border-color var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out)`,
});

function Field({ label, hint, children }) {
    return (
        <div style={{ display: 'grid', gap: '8px' }}>
            <div>
                <div style={{
                    fontFamily: 'var(--vq-font-numeric)',
                    fontSize: 'var(--vq-fs-eyebrow)',
                    lineHeight: 'var(--vq-lh-eyebrow)',
                    letterSpacing: 'var(--vq-ls-eyebrow)',
                    textTransform: 'uppercase',
                    fontWeight: 'var(--vq-fw-medium)',
                    color: 'var(--vq-text-3)',
                }}>
                    {label}
                </div>
                {hint && (
                    <div style={{
                        marginTop: '4px',
                        fontSize: 'var(--vq-fs-caption)',
                        lineHeight: 'var(--vq-lh-caption)',
                        color: 'var(--vq-text-3)',
                    }}>
                        {hint}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
}

const Grid = ({ children }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
        {children}
    </div>
);

function Choice({ selected, onClick, label, note }) {
    return (
        <button onClick={onClick} style={{ ...choiceStyle(selected), textAlign: 'left' }}>
            <div style={{
                fontSize: 'var(--vq-fs-small)',
                fontWeight: selected ? 'var(--vq-fw-semi)' : 'var(--vq-fw-medium)',
            }}>
                {label}
            </div>
            {note && (
                <div style={{
                    marginTop: '2px',
                    fontSize: 'var(--vq-fs-caption)',
                    color: 'var(--vq-text-3)',
                }}>
                    {note}
                </div>
            )}
        </button>
    );
}

function Segmented({ options, value, onChange }) {
    return (
        <div style={{
            display: 'flex',
            gap: '2px',
            padding: '2px',
            background: 'var(--vq-sunken)',
            borderRadius: 'var(--vq-r-md)',
        }}>
            {options.map((o) => {
                const selected = o.value === value;
                return (
                    <button
                        key={o.value}
                        onClick={() => onChange(o.value)}
                        style={{
                            flex: 1,
                            height: 'var(--vq-control-sm)',
                            border: 'none',
                            borderRadius: 'calc(var(--vq-r-md) - 2px)',
                            background: selected ? 'var(--vq-surface)' : 'transparent',
                            color: selected ? 'var(--vq-text)' : 'var(--vq-text-3)',
                            fontSize: 'var(--vq-fs-caption)',
                            fontWeight: selected ? 'var(--vq-fw-semi)' : 'var(--vq-fw-medium)',
                            boxShadow: selected ? 'var(--vq-elev-1)' : 'none',
                            cursor: 'pointer',
                            transition: `background var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out)`,
                        }}
                    >
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                textAlign: 'left',
            }}
        >
            <span style={{
                width: '36px',
                height: '20px',
                flexShrink: 0,
                borderRadius: 'var(--vq-r-full)',
                background: checked ? 'var(--vq-accent-fill)' : 'var(--vq-line-strong)',
                position: 'relative',
                transition: `background var(--vq-dur-2) var(--vq-ease-out)`,
            }}>
                <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: checked ? '18px' : '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: 'var(--vq-r-full)',
                    background: 'var(--vq-surface)',
                    boxShadow: 'var(--vq-elev-1)',
                    // A spring here, because a toggle is an entrance: the knob
                    // arrives, overshoots a hair and settles once.
                    transition: `left var(--vq-dur-2) var(--vq-ease-spring)`,
                }} />
            </span>
            <span style={{ fontSize: 'var(--vq-fs-small)', color: 'var(--vq-text-2)' }}>
                {label}
            </span>
        </button>
    );
}

const Notice = ({ children }) => (
    <div style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 12px',
        borderRadius: 'var(--vq-r-sm)',
        background: 'var(--vq-warning-bg)',
        border: '1px solid var(--vq-warning-line)',
        color: 'var(--vq-warning)',
        fontSize: 'var(--vq-fs-caption)',
        lineHeight: 'var(--vq-lh-caption)',
    }}>
        {children}
    </div>
);

const Header = ({ definition, onClose }) => (
    <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '20px',
        borderBottom: '1px solid var(--vq-line)',
        flexShrink: 0,
    }}>
        <div style={{ minWidth: 0 }}>
            <div style={{
                fontFamily: 'var(--vq-font-display)',
                fontSize: 'var(--vq-fs-h3)',
                lineHeight: 'var(--vq-lh-h3)',
                letterSpacing: 'var(--vq-ls-h3)',
                fontWeight: 'var(--vq-fw-semi)',
                color: 'var(--vq-text)',
            }}>
                Edit card
            </div>
            <div style={{
                marginTop: '2px',
                fontSize: 'var(--vq-fs-caption)',
                color: 'var(--vq-text-3)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
            }}>
                {definition?.label || 'Metric'}
            </div>
        </div>
        <button
            onClick={onClose}
            aria-label="Close"
            style={{
                flexShrink: 0,
                width: 'var(--vq-control-sm)',
                height: 'var(--vq-control-sm)',
                display: 'grid',
                placeItems: 'center',
                borderRadius: 'var(--vq-r-full)',
                border: '1px solid var(--vq-line)',
                background: 'var(--vq-surface)',
                color: 'var(--vq-text-2)',
                cursor: 'pointer',
                transition: `background var(--vq-dur-1) var(--vq-ease-out)`,
            }}
        >
            <X size={15} />
        </button>
    </div>
);

const Footer = ({ onClose, onSubmit }) => (
    <div style={{
        display: 'flex',
        gap: '8px',
        padding: '16px 20px',
        borderTop: '1px solid var(--vq-line)',
        flexShrink: 0,
    }}>
        <button
            onClick={onClose}
            style={{
                flex: '0 0 auto',
                height: 'var(--vq-control-md)',
                padding: '0 18px',
                borderRadius: 'var(--vq-r-full)',
                border: '1px solid var(--vq-line)',
                background: 'var(--vq-surface)',
                color: 'var(--vq-text-2)',
                fontSize: 'var(--vq-fs-small)',
                fontWeight: 'var(--vq-fw-medium)',
                cursor: 'pointer',
            }}
        >
            Cancel
        </button>
        <button
            onClick={onSubmit}
            style={{
                flex: 1,
                height: 'var(--vq-control-md)',
                // 22px of horizontal padding — a button that hugs its label
                // looks cheap (DESIGN-RULES v3.0 §13).
                padding: '0 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: 'var(--vq-r-full)',
                border: 'none',
                background: 'var(--vq-accent-fill)',
                color: 'var(--vq-on-accent)',
                fontSize: 'var(--vq-fs-small)',
                fontWeight: 'var(--vq-fw-semi)',
                // The one deliberate coloured light in the system.
                boxShadow: 'var(--vq-glow-accent)',
                cursor: 'pointer',
                transition: `background var(--vq-dur-1) var(--vq-ease-out)`,
            }}
        >
            <Check size={15} />
            Save card
        </button>
    </div>
);
