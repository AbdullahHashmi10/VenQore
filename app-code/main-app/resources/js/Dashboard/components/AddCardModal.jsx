import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import {
    AlertCircle, ArrowLeft, Check, ChevronRight, LayoutGrid, Plus, Search, Sparkles, X,
} from 'lucide-react';

import DashboardCardFrame from './DashboardCardFrame';
import { getChartComponent } from '../chartRegistry';
import { PERIOD_LABELS, PERIOD_ORDER } from '../periods';
import {
    CATEGORIES,
    CATEGORY_KEYS,
    categoriesForChart,
    defaultCategoryForChart,
    dimensionsOf,
    fitsFor,
    size as sizeOf,
} from '../layoutLaw';

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  AddCardModal — choose a reading, shape the card, watch it live, add it   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The add flow is TWO steps, deliberately. Picking a reading no longer drops
 * a card on the board; it opens the card's settings — size (Layout Law
 * category + fit), chart, period, name, emphasis — beside a LIVE PREVIEW
 * rendered from a real `/api/reckoner/read` at the exact span the card will
 * occupy. What you see in the preview is what lands on the dashboard.
 *
 * Library facts come from `/api/reckoner/catalogue`, which only ever lists
 * what THIS user in THIS store may see (permission → plan → capability →
 * module gates run server-side). Readings flagged `is_new` wear the "New"
 * badge. Sizes come from `layout-law.json` via layoutLaw.js — six categories,
 * eighteen fits, no other size exists.
 *
 * DESIGN-RULES v3.1: modal at `--vq-r-xl` 28px, elevation 3, `z-modal`, scrim
 * at modal − 1, focus returns to the trigger, Esc closes. Tokens only.
 */

const DOMAIN_LABELS = {
    sales: 'Sales',
    finance: 'Finance',
    inventory: 'Inventory',
    purchasing: 'Purchasing',
    party: 'Contacts',
    production: 'Production',
    staff: 'Staff',
    operations: 'Operations',
    tax: 'Tax',
    restaurant: 'Restaurant',
    plan: 'Plan',
};

const CHART_LABELS = {
    stat: 'Number',
    sparkline: 'Sparkline',
    gauge: 'Gauge',
    ring: 'Ring',
    status: 'Status',
    line: 'Line',
    area: 'Area',
    bar: 'Bars',
    profit_loss_line: 'Profit / loss',
    composed: 'Composed',
    pie: 'Pie',
    sunburst: 'Sunburst',
    funnel: 'Funnel',
    table: 'Table',
    heatmap: 'Heatmap',
    feed: 'Feed',
    live_line: 'Live line',
};

const SHAPE_LABELS = {
    scalar: 'number',
    series: 'trend',
    multi_series: 'trends',
    breakdown: 'breakdown',
    ranking: 'ranking',
    table: 'table',
    funnel: 'funnel',
    gauge: 'gauge',
    status: 'status',
    feed: 'feed',
    geo: 'map',
};

export default function AddCardModal({ isOpen, onClose, catalogue = [], onSubmit, accentHolder = null }) {
    const { store } = usePage().props;

    /* ── Wizard state ───────────────────────────────────────────────────── */

    const [step, setStep] = useState(1);
    const [query, setQuery] = useState('');
    const [domain, setDomain] = useState('all');
    const [picked, setPicked] = useState(null); // catalogue entry

    // Draft card (step 2)
    const [chart, setChart] = useState('stat');
    const [period, setPeriod] = useState('today');
    const [category, setCategory] = useState('C3');
    const [fitKey, setFitKey] = useState(null);
    const [title, setTitle] = useState('');
    const [accent, setAccent] = useState(false);
    const [saving, setSaving] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Live preview data
    const [previewData, setPreviewData] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(false);

    const searchRef = useRef(null);
    const previewPaneRef = useRef(null);
    const [paneWidth, setPaneWidth] = useState(0);

    /* ── Open / close housekeeping ──────────────────────────────────────────
       The parent remounts this component per open (`key`), so every open
       starts from the initial state — no reset effect needed. */

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        // Focus lands in the search box, which is where the flow starts.
        const focus = setTimeout(() => searchRef.current?.focus(), 60);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
            clearTimeout(focus);
        };
    }, [isOpen, onClose]);

    /* ── Library derivations ────────────────────────────────────────────── */

    const domains = useMemo(() => {
        const seen = [];
        for (const entry of catalogue) {
            if (!seen.includes(entry.domain)) seen.push(entry.domain);
        }
        return seen;
    }, [catalogue]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return catalogue.filter((entry) => {
            if (domain !== 'all' && entry.domain !== domain) return false;
            if (!q) return true;
            return (
                entry.label.toLowerCase().includes(q)
                || entry.key.toLowerCase().includes(q)
                || (entry.description || '').toLowerCase().includes(q)
            );
        });
    }, [catalogue, domain, query]);

    const grouped = useMemo(() => {
        const map = new Map();
        for (const entry of filtered) {
            if (!map.has(entry.domain)) map.set(entry.domain, []);
            map.get(entry.domain).push(entry);
        }
        return Array.from(map.entries());
    }, [filtered]);

    /* ── Step transitions ───────────────────────────────────────────────── */

    const pick = useCallback((entry) => {
        const defChart = entry.default_chart || (entry.charts || [])[0] || 'stat';
        const cat = defaultCategoryForChart(defChart);
        const fits = fitsFor(cat);
        const def = fits.find((f) => f.default) || fits[0];

        setPicked(entry);
        setChart(defChart);
        setPeriod(entry.default_period || 'today');
        setCategory(cat);
        setFitKey(def?.key ?? null);
        setTitle('');
        setAccent(false);
        setPreviewData(null);
        setPreviewError(false);
        setStep(2);
    }, []);

    const changeChart = useCallback((nextChart) => {
        setChart(nextChart);
        // Size legality follows the chart — re-derive category + fit.
        const cat = defaultCategoryForChart(nextChart);
        const fits = fitsFor(cat);
        const def = fits.find((f) => f.default) || fits[0];
        setCategory(cat);
        setFitKey(def?.key ?? null);
    }, []);

    const changeCategory = useCallback((cat) => {
        setCategory(cat);
        const fits = fitsFor(cat);
        const def = fits.find((f) => f.default) || fits[0];
        setFitKey(def?.key ?? null);
    }, []);

    /* ── Live preview data ──────────────────────────────────────────────── */

    useEffect(() => {
        if (!isOpen || step !== 2 || !picked) return undefined;

        let cancelled = false;

        const t = setTimeout(async () => {
            setPreviewLoading(true);
            setPreviewError(false);
            try {
                const res = await axios.post('/api/reckoner/read', {
                    requests: [{ key: picked.key, period }],
                });
                if (cancelled) return;
                const result = res.data?.data?.[0];
                if (result?.ok) {
                    setPreviewData(result.data);
                } else {
                    setPreviewData(null);
                    setPreviewError(true);
                }
            } catch {
                if (!cancelled) { setPreviewData(null); setPreviewError(true); }
            } finally {
                if (!cancelled) setPreviewLoading(false);
            }
        }, 160);

        return () => { cancelled = true; clearTimeout(t); };
    }, [isOpen, step, picked, period]);

    /* ── Preview geometry — real spans, real pixels ─────────────────────── */

    useEffect(() => {
        if (!isOpen || step !== 2) return undefined;
        const el = previewPaneRef.current;
        if (!el) return undefined;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) setPaneWidth(entry.contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [isOpen, step]);

    const dims = dimensionsOf(category, fitKey);

    // The card previews at the width it will really occupy on a reference
    // 12-column board (1240px content), and scales down only if the pane is
    // narrower — so "6 columns wide" always LOOKS six columns wide.
    const REF_BOARD = 1240;
    const GUTTER = 24;
    const refCol = (REF_BOARD - GUTTER * 11) / 12;
    const cardW = Math.round(dims.w * refCol + (dims.w - 1) * GUTTER);
    const cardH = sizeOf(dims.h);
    const scale = paneWidth > 40 ? Math.min(1, (paneWidth - 8) / cardW) : 1;

    /* ── Submit ─────────────────────────────────────────────────────────── */

    const submit = useCallback(async () => {
        if (!picked || saving) return;
        setSaving(true);
        setSubmitError(null);
        try {
            await onSubmit?.({
                reading_key: picked.key,
                period,
                chart,
                category,
                fit: fitKey,
                w: dims.w,
                h: dims.h,
                title_override: title.trim() || null,
                style: accent ? { accent: true } : {},
            });
            onClose?.();
        } catch (err) {
            // The board is capped at 40 cards, a layout can be locked, and a
            // reading can be gated between the catalogue load and this click.
            // Closing on failure would look exactly like success and leave the
            // user hunting a card that was never added.
            setSubmitError(
                err?.response?.data?.error
                || 'That card could not be added. Please try again.',
            );
        } finally {
            setSaving(false);
        }
    }, [picked, saving, period, chart, category, fitKey, dims.w, dims.h, title, accent, onSubmit, onClose]);

    if (!isOpen) return null;

    const Chart = getChartComponent(chart);
    const previewCard = picked ? {
        id: '__preview',
        reading_key: picked.key,
        period,
        chart,
        category,
        fit: fitKey,
        w: dims.w,
        h: dims.h,
        title_override: title.trim() || null,
        style: { accent },
    } : null;

    const chartChoices = (picked?.charts || []).filter((c) => CHART_LABELS[c]);
    const periodChoices = PERIOD_ORDER.filter((p) => (picked?.periods || []).includes(p));
    const legalCats = picked ? categoriesForChart(chart) : [];

    const modal = (
        <div className="vqm-root" role="presentation">
            <style>{MODAL_CSS}</style>

            <div className="vqm-scrim" onClick={onClose} aria-hidden="true" />

            <div
                className="vqm-modal"
                role="dialog"
                aria-modal="true"
                aria-label={step === 1 ? 'Add cards' : `Configure ${picked?.label || 'card'}`}
            >
                {/* ── Header ── */}
                <div className="vqm-head">
                    {step === 2 && (
                        <button type="button" className="vqm-iconbtn" onClick={() => setStep(1)} aria-label="Back to the library">
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <div className="vqm-head-titles">
                        <span className="vqm-eyebrow">
                            {step === 1 ? 'Add cards · step 1 of 2' : 'Add cards · step 2 of 2'}
                        </span>
                        <h2 className="vqm-title">
                            {step === 1 ? 'Choose a reading' : (picked?.label || '')}
                        </h2>
                    </div>
                    <div className="vqm-head-spacer" />
                    {step === 1 && (
                        <span className="vqm-count">{filtered.length} of {catalogue.length}</span>
                    )}
                    <button type="button" className="vqm-iconbtn" onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>

                {/* ── Step 1 · Library ── */}
                {step === 1 && (
                    <div className="vqm-body vqm-body--library">
                        <div className="vqm-toolbar">
                            <div className="vqm-search">
                                <Search size={14} aria-hidden="true" />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={query}
                                    placeholder={`Search ${catalogue.length} readings…`}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <div className="vqm-tabs" role="tablist" aria-label="Areas">
                                <button
                                    type="button"
                                    role="tab"
                                    aria-selected={domain === 'all'}
                                    className={`vqm-tab${domain === 'all' ? ' is-on' : ''}`}
                                    onClick={() => setDomain('all')}
                                >
                                    All
                                </button>
                                {domains.map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        role="tab"
                                        aria-selected={domain === d}
                                        className={`vqm-tab${domain === d ? ' is-on' : ''}`}
                                        onClick={() => setDomain(d)}
                                    >
                                        {DOMAIN_LABELS[d] || d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="vqm-list">
                            {filtered.length === 0 && (
                                <div className="vqm-empty">
                                    <LayoutGrid size={22} aria-hidden="true" />
                                    <p>Nothing matches “{query}”. Try another word, or clear the search.</p>
                                </div>
                            )}

                            {grouped.map(([groupDomain, entries]) => (
                                <div key={groupDomain} className="vqm-group">
                                    <div className="vqm-group-lbl">{DOMAIN_LABELS[groupDomain] || groupDomain}</div>
                                    <div className="vqm-grid">
                                        {entries.map((entry) => (
                                            <button
                                                key={entry.key}
                                                type="button"
                                                className="vqm-reading"
                                                onClick={() => pick(entry)}
                                            >
                                                <span className="vqm-reading-top">
                                                    <span className="vqm-reading-lbl">{entry.label}</span>
                                                    {entry.is_new && (
                                                        <span className="vqm-badge-new">
                                                            <Sparkles size={9} aria-hidden="true" /> New
                                                        </span>
                                                    )}
                                                </span>
                                                {entry.description && (
                                                    <span className="vqm-reading-desc">{entry.description}</span>
                                                )}
                                                <span className="vqm-reading-meta">
                                                    <span className="vqm-pill">{SHAPE_LABELS[entry.shape] || entry.shape}</span>
                                                    <span className="vqm-reading-key">{entry.key}</span>
                                                    <ChevronRight size={13} className="vqm-reading-go" aria-hidden="true" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Step 2 · Configure + live preview ── */}
                {step === 2 && picked && (
                    <div className="vqm-body vqm-body--configure">
                        <div className="vqm-controls">
                            {/* Name */}
                            <div className="vqm-field">
                                <label className="vqm-lbl" htmlFor="vqm-name">Name</label>
                                <input
                                    id="vqm-name"
                                    type="text"
                                    className="vqm-input"
                                    value={title}
                                    maxLength={80}
                                    placeholder={picked.label}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* Period */}
                            {periodChoices.length > 1 && (
                                <div className="vqm-field">
                                    <span className="vqm-lbl">Period</span>
                                    <div className="vqm-chips">
                                        {periodChoices.map((p) => (
                                            <button
                                                key={p}
                                                type="button"
                                                className={`vqm-chip${period === p ? ' is-on' : ''}`}
                                                aria-pressed={period === p}
                                                onClick={() => setPeriod(p)}
                                            >
                                                {PERIOD_LABELS[p]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chart */}
                            {chartChoices.length > 1 && (
                                <div className="vqm-field">
                                    <span className="vqm-lbl">Chart</span>
                                    <div className="vqm-chips">
                                        {chartChoices.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                className={`vqm-chip${chart === c ? ' is-on' : ''}`}
                                                aria-pressed={chart === c}
                                                onClick={() => changeChart(c)}
                                            >
                                                {CHART_LABELS[c]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Size — Layout Law categories + fits */}
                            <div className="vqm-field">
                                <span className="vqm-lbl">Size</span>
                                <div className="vqm-chips">
                                    {/* CATEGORY_KEYS, not Object.keys(CATEGORIES) — the law
                                        JSON carries a `$comment` key that would render as a
                                        blank seventh chip. */}
                                    {CATEGORY_KEYS.map((cat) => {
                                        // Legality is a floor, not a whitelist: a chart may
                                        // always be given MORE room than its leanest legal
                                        // category (layoutLaw.isCategoryLegal).
                                        const floor = legalCats[0] || 'C1';
                                        const isLegal = CATEGORY_KEYS.indexOf(cat) >= CATEGORY_KEYS.indexOf(floor);
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                className={`vqm-chip${category === cat ? ' is-on' : ''}`}
                                                aria-pressed={category === cat}
                                                disabled={!isLegal}
                                                title={!isLegal ? 'Too small for this chart' : undefined}
                                                onClick={() => isLegal && changeCategory(cat)}
                                            >
                                                {CATEGORIES[cat].name}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="vqm-chips" style={{ marginTop: 8 }}>
                                    {fitsFor(category).map((f) => (
                                        <button
                                            key={f.key}
                                            type="button"
                                            className={`vqm-chip vqm-chip--fit${fitKey === f.key ? ' is-on' : ''}`}
                                            aria-pressed={fitKey === f.key}
                                            onClick={() => setFitKey(f.key)}
                                        >
                                            <span className="vqm-chip-dims">{f.w}×{f.h}</span> {f.label || f.key}
                                        </button>
                                    ))}
                                </div>
                                <p className="vqm-note">
                                    Sizes follow the layout law — {CATEGORIES[category].name} cards span up
                                    to {CATEGORIES[category].max.w}×{CATEGORIES[category].max.h}. You can also
                                    drag the corner of the card on the board.
                                </p>
                            </div>

                            {/* Emphasis */}
                            <div className="vqm-field">
                                <span className="vqm-lbl">Emphasis</span>
                                <div className="vqm-chips">
                                    <button
                                        type="button"
                                        className={`vqm-chip${!accent ? ' is-on' : ''}`}
                                        aria-pressed={!accent}
                                        onClick={() => setAccent(false)}
                                    >
                                        Plain
                                    </button>
                                    <button
                                        type="button"
                                        className={`vqm-chip${accent ? ' is-on' : ''}`}
                                        aria-pressed={accent}
                                        onClick={() => setAccent(true)}
                                    >
                                        Accent fill
                                    </button>
                                </div>
                                <p className="vqm-note">
                                    One accent card per board — it marks the number that matters most.
                                    {accent && accentHolder ? ` Setting it here takes it from “${accentHolder.label}”.` : ''}
                                </p>
                            </div>
                        </div>

                        {/* Live preview */}
                        <div className="vqm-preview" ref={previewPaneRef}>
                            <span className="vqm-eyebrow">Live preview · {dims.w}×{dims.h} · real data</span>
                            <div className="vqm-stage">
                                <div
                                    className="vqm-stage-card"
                                    style={{
                                        width: `${cardW}px`,
                                        height: `${cardH}px`,
                                        transform: `scale(${scale})`,
                                    }}
                                >
                                    <DashboardCardFrame
                                        card={previewCard}
                                        definition={picked}
                                        loading={previewLoading}
                                        error={previewError}
                                        isLocked
                                    >
                                        {previewData && Chart && React.createElement(Chart, {
                                            data: previewData,
                                            definition: picked,
                                            settings: store?.settings,
                                            card: previewCard,
                                        })}
                                    </DashboardCardFrame>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="vqm-foot">
                    {step === 2 ? (
                        <>
                            <button type="button" className="vqm-btn vqm-btn--ghost" onClick={() => setStep(1)}>
                                <ArrowLeft size={14} /> <span>Back to library</span>
                            </button>
                            {submitError && (
                                <p className="vqm-foot-err">
                                    <AlertCircle size={13} aria-hidden="true" /> {submitError}
                                </p>
                            )}
                            <div className="vqm-head-spacer" />
                            <button type="button" className="vqm-btn vqm-btn--ghost" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="vqm-btn vqm-btn--primary"
                                disabled={saving}
                                onClick={submit}
                            >
                                {saving ? <Check size={14} /> : <Plus size={14} />}
                                <span>{saving ? 'Adding…' : 'Add to dashboard'}</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="vqm-foot-hint">
                                Pick a reading to shape its card — size, chart and period come next,
                                with a live preview before anything lands on your board.
                            </p>
                            <div className="vqm-head-spacer" />
                            <button type="button" className="vqm-btn vqm-btn--ghost" onClick={onClose}>
                                Close
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}

const MODAL_CSS = `
.vqm-root { position: fixed; inset: 0; z-index: var(--vq-z-modal); display: flex; align-items: center; justify-content: center; padding: 24px; }
.vqm-scrim { position: absolute; inset: 0; z-index: -1; background: var(--vq-scrim, rgb(9 11 20 / .56)); }

.vqm-modal {
    display: flex;
    flex-direction: column;
    width: min(960px, 100%);
    height: min(720px, calc(100dvh - 48px));
    background: var(--vq-surface);
    border: 1px solid var(--vq-line);
    border-radius: var(--vq-r-xl);
    box-shadow: var(--vq-elev-3);
    overflow: hidden;
    font-family: var(--vq-font-sans);
    color: var(--vq-text);
}

.vqm-head {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--vq-line);
}
.vqm-head-titles { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vqm-head-spacer { flex: 1 1 auto; }
.vqm-eyebrow {
    font-family: var(--vq-font-mono);
    font-size: var(--vq-fs-eyebrow);
    letter-spacing: var(--vq-ls-eyebrow);
    text-transform: uppercase;
    font-weight: var(--vq-fw-medium);
    color: var(--vq-text-3);
}
.vqm-title {
    margin: 0;
    font-family: var(--vq-font-display);
    font-size: var(--vq-fs-h3);
    line-height: var(--vq-lh-h3);
    letter-spacing: var(--vq-ls-h3);
    font-weight: var(--vq-fw-semi);
    color: var(--vq-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.vqm-count { font-family: var(--vq-font-mono); font-size: var(--vq-fs-caption); color: var(--vq-text-3); white-space: nowrap; }

.vqm-iconbtn {
    width: 34px; height: 34px;
    display: inline-flex; align-items: center; justify-content: center;
    border: none; border-radius: var(--vq-r-sm);
    background: transparent; color: var(--vq-text-2); cursor: pointer;
    transition: background var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out);
}
.vqm-iconbtn:hover { background: var(--vq-sunken); color: var(--vq-text); }
.vqm-iconbtn:focus-visible { outline: none; box-shadow: var(--vq-ring-focus); }

.vqm-body { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }

/* ── Step 1 ── */
.vqm-toolbar { flex: 0 0 auto; display: flex; flex-direction: column; gap: 10px; padding: 14px 20px 10px; border-bottom: 1px solid var(--vq-line-soft, var(--vq-line)); }
.vqm-search {
    display: flex; align-items: center; gap: 8px;
    height: 42px; padding: 0 14px;
    background: var(--vq-sunken);
    border: 1px solid var(--vq-line);
    border-radius: var(--vq-r-md);
    color: var(--vq-text-3);
}
.vqm-search:focus-within { border-color: var(--vq-focus, var(--vq-accent)); box-shadow: var(--vq-ring-focus); }
.vqm-search input {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: var(--vq-font-sans); font-size: 16px; color: var(--vq-text);
}
.vqm-search input::placeholder { color: var(--vq-text-3); }

.vqm-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.vqm-tab {
    height: 28px; padding: 0 12px;
    border: 1px solid var(--vq-line); border-radius: var(--vq-r-full);
    background: transparent; color: var(--vq-text-2);
    font-family: var(--vq-font-sans); font-size: var(--vq-fs-caption); font-weight: var(--vq-fw-medium);
    cursor: pointer;
    transition: background var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out), border-color var(--vq-dur-1) var(--vq-ease-out);
}
.vqm-tab:hover { background: var(--vq-sunken); color: var(--vq-text); }
.vqm-tab.is-on { background: var(--vq-accent-quiet); border-color: transparent; color: var(--vq-accent-text); font-weight: var(--vq-fw-semi); }

.vqm-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 14px 20px 20px; }
.vqm-group { margin-bottom: 18px; }
.vqm-group-lbl {
    font-family: var(--vq-font-mono);
    font-size: var(--vq-fs-eyebrow);
    letter-spacing: var(--vq-ls-eyebrow);
    text-transform: uppercase;
    font-weight: var(--vq-fw-medium);
    color: var(--vq-text-3);
    margin: 0 0 8px 2px;
}
.vqm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(264px, 1fr)); gap: 10px; }

.vqm-reading {
    display: flex; flex-direction: column; align-items: stretch; gap: 6px;
    padding: 12px 14px; text-align: left;
    background: var(--vq-surface);
    border: 1px solid var(--vq-line);
    border-radius: var(--vq-r-lg);
    cursor: pointer;
    font-family: var(--vq-font-sans);
    transition: border-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-1) var(--vq-ease-out);
}
.vqm-reading:hover { border-color: var(--vq-line-strong); box-shadow: var(--vq-elev-2); }
.vqm-reading:focus-visible { outline: none; box-shadow: var(--vq-ring-focus); }
.vqm-reading-top { display: flex; align-items: center; gap: 8px; min-width: 0; }
.vqm-reading-lbl { font-size: var(--vq-fs-small); font-weight: var(--vq-fw-semi); color: var(--vq-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vqm-reading-desc {
    font-size: var(--vq-fs-caption); line-height: var(--vq-lh-caption);
    color: var(--vq-text-2);
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.vqm-reading-meta { display: flex; align-items: center; gap: 8px; min-width: 0; }
.vqm-reading-key { font-family: var(--vq-font-mono); font-size: 11px; color: var(--vq-text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vqm-reading-go { margin-left: auto; color: var(--vq-text-3); flex: 0 0 auto; }
.vqm-pill {
    flex: 0 0 auto;
    padding: 2px 8px;
    border-radius: var(--vq-r-full);
    background: var(--vq-sunken);
    border: 1px solid var(--vq-line);
    font-family: var(--vq-font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--vq-text-2);
}
.vqm-badge-new {
    flex: 0 0 auto;
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 8px;
    border-radius: var(--vq-r-full);
    background: var(--vq-accent-quiet);
    color: var(--vq-accent-text);
    font-size: 10px;
    font-weight: var(--vq-fw-semi);
    text-transform: uppercase;
    letter-spacing: .06em;
}

.vqm-empty {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 48px 20px; color: var(--vq-text-3); text-align: center;
}
.vqm-empty p { margin: 0; font-size: var(--vq-fs-small); color: var(--vq-text-2); max-width: 38ch; }

/* ── Step 2 ── */
.vqm-body--configure { flex-direction: row; }
@media (max-width: 760px) { .vqm-body--configure { flex-direction: column; overflow-y: auto; } }

.vqm-controls {
    flex: 0 0 340px;
    min-width: 0;
    overflow-y: auto;
    padding: 18px 20px;
    border-right: 1px solid var(--vq-line);
    display: flex; flex-direction: column; gap: 18px;
}
@media (max-width: 760px) { .vqm-controls { flex: 0 0 auto; border-right: none; border-bottom: 1px solid var(--vq-line); } }

.vqm-field { display: flex; flex-direction: column; gap: 7px; }
.vqm-lbl { font-size: var(--vq-fs-caption); font-weight: var(--vq-fw-semi); color: var(--vq-text-2); }
.vqm-input {
    height: var(--vq-control-lg, 48px);
    padding: 0 16px;
    border: 1px solid var(--vq-line);
    border-radius: var(--vq-r-md);
    background: var(--vq-surface);
    color: var(--vq-text);
    font-family: var(--vq-font-sans);
    font-size: 16px;
    transition: border-color var(--vq-dur-1) var(--vq-ease-out), box-shadow var(--vq-dur-1) var(--vq-ease-out);
}
.vqm-input:focus { outline: none; border-color: var(--vq-focus, var(--vq-accent)); box-shadow: var(--vq-ring-focus); }
.vqm-input::placeholder { color: var(--vq-text-3); }

.vqm-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.vqm-chip {
    height: 30px; padding: 0 12px;
    display: inline-flex; align-items: center; gap: 6px;
    border: 1px solid var(--vq-line); border-radius: var(--vq-r-full);
    background: transparent; color: var(--vq-text-2);
    font-family: var(--vq-font-sans); font-size: var(--vq-fs-caption); font-weight: var(--vq-fw-medium);
    cursor: pointer;
    transition: background var(--vq-dur-1) var(--vq-ease-out), color var(--vq-dur-1) var(--vq-ease-out), border-color var(--vq-dur-1) var(--vq-ease-out);
}
.vqm-chip:hover:not(:disabled) { background: var(--vq-sunken); color: var(--vq-text); }
.vqm-chip.is-on { background: var(--vq-accent-quiet); border-color: transparent; color: var(--vq-accent-text); font-weight: var(--vq-fw-semi); }
.vqm-chip:disabled { opacity: .38; cursor: not-allowed; text-decoration: line-through; }
.vqm-chip:focus-visible { outline: none; box-shadow: var(--vq-ring-focus); }
.vqm-chip-dims { font-family: var(--vq-font-mono); font-size: 11px; color: inherit; opacity: .75; }

.vqm-note { margin: 0; font-size: var(--vq-fs-caption); line-height: var(--vq-lh-caption); color: var(--vq-text-3); }

.vqm-preview {
    flex: 1 1 auto;
    min-width: 0;
    display: flex; flex-direction: column; gap: 10px;
    padding: 18px 20px;
    background: var(--vq-bg);
    overflow: hidden;
}
.vqm-stage {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow: auto;
    padding: 4px;
}
.vqm-stage-card { flex: 0 0 auto; transform-origin: top center; }

/* ── Footer ── */
.vqm-foot {
    flex: 0 0 auto;
    display: flex; align-items: center; gap: 8px;
    padding: 14px 20px;
    border-top: 1px solid var(--vq-line);
}
.vqm-foot-hint { margin: 0; font-size: var(--vq-fs-caption); color: var(--vq-text-3); max-width: 52ch; }
.vqm-foot-err {
    margin: 0;
    display: inline-flex; align-items: center; gap: 6px;
    font-size: var(--vq-fs-caption);
    color: var(--vq-danger);
    max-width: 46ch;
}

.vqm-btn {
    display: inline-flex; align-items: center; gap: 7px;
    height: var(--vq-control-md, 42px);
    padding: 0 22px;
    border: none; border-radius: var(--vq-r-lg);
    font-family: var(--vq-font-sans); font-size: var(--vq-fs-small); font-weight: var(--vq-fw-semi);
    cursor: pointer;
    transition: background var(--vq-dur-2) var(--vq-ease-out), color var(--vq-dur-2) var(--vq-ease-out), transform var(--vq-dur-2) var(--vq-ease-out), box-shadow var(--vq-dur-2) var(--vq-ease-out);
}
.vqm-btn:disabled { opacity: .5; cursor: not-allowed; }
.vqm-btn--primary { background: var(--vq-accent-fill); color: var(--vq-on-accent, #fff); box-shadow: var(--vq-glow-accent); }
.vqm-btn--primary:hover:not(:disabled) { background: var(--vq-accent-fill-hover, var(--vq-accent-fill)); transform: translateY(-1px); }
.vqm-btn--primary:active { transform: none; }
.vqm-btn--ghost { background: transparent; color: var(--vq-text-2); box-shadow: inset 0 0 0 1px var(--vq-line); }
.vqm-btn--ghost:hover { background: var(--vq-sunken); color: var(--vq-text); }
.vqm-btn:focus-visible { outline: none; box-shadow: var(--vq-ring-focus); }
`;
