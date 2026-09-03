/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  RegisterPreview — the register, drawn small, by the same engine          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The preview this replaces was a hand-drawn picture: a switch statement over
 * seven preset names that decided what to draw. It could not show a catalog on
 * the right, or a two-row strip, or a floor column, or a tender bar, because
 * nobody had drawn those — and worse, it could not show a DEMOTION. Set a
 * catalog column on a screen too narrow to hold one and the old preview drew
 * the column anyway, so the picture and the product disagreed.
 *
 * This calls `composeTerminal` — the same function the real register calls,
 * with the same composition and a chosen viewport — and draws whatever comes
 * back. That is the whole design: the preview cannot show a layout the law
 * would not produce, because it is not deciding anything. When the engine
 * turns the catalog into a button, the preview shows a button, and says why.
 */

import React, { useMemo } from 'react';
import { composeTerminal } from '@/LayoutLaw/engine';

/* The screens worth checking a register against. Same set the layout law's own
   workbench uses, trimmed to the ones a shop actually stands a till on. */
export const PREVIEW_DEVICES = [
    { id: 'phone',   label: 'Phone',   vw: 390,  vh: 745 },
    { id: 'tablet',  label: 'Tablet',  vw: 1024, vh: 695 },
    { id: 'laptop',  label: 'Laptop',  vw: 1280, vh: 720 },
    { id: 'desktop', label: 'Desktop', vw: 1920, vh: 1080 },
];

/* A pane's identity, in one place, so the preview and its legend agree. */
const TONES = {
    catalog: { fill: 'bg-sky-100 dark:bg-sky-950/50',       line: 'border-sky-300 dark:border-sky-800',       text: 'text-sky-800 dark:text-sky-300' },
    floor:   { fill: 'bg-brand-100 dark:bg-brand-950/50', line: 'border-brand-300 dark:border-brand-800', text: 'text-brand-800 dark:text-brand-300' },
    cart:    { fill: 'bg-emerald-100 dark:bg-emerald-950/50', line: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-300' },
    tender:  { fill: 'bg-amber-100 dark:bg-amber-950/50',   line: 'border-amber-300 dark:border-amber-800',   text: 'text-amber-800 dark:text-amber-300' },
};

function Pane({ kind, label, sub, style, className = '' }) {
    const t = TONES[kind] || TONES.cart;
    return (
        <div
            style={style}
            className={`${t.fill} ${t.line} border rounded-md min-w-0 min-h-0 overflow-hidden
                        flex flex-col items-center justify-center gap-0.5 px-1 ${className}`}
        >
            <span className={`text-[9px] font-bold uppercase tracking-wide ${t.text} truncate max-w-full`}>
                {label}
            </span>
            {sub && (
                <span className={`text-[8px] font-bold ${t.text} opacity-70 truncate max-w-full`}>{sub}</span>
            )}
        </div>
    );
}

export default function RegisterPreview({
    comp,
    device = PREVIEW_DEVICES[3],
    senior = false,
    scale = 1,
    rail = false,
}) {
    /* Fed exactly what the register feeds it: the viewport shrunk by the senior
       factor and the interface scale, so the preview demotes on the same screens
       the real thing does. */
    const layout = useMemo(() => {
        const f = (senior ? 0.86 : 1) / Math.max(0.9, Math.min(1.3, scale || 1));
        const railPx = rail ? 76 : 0;
        try {
            return composeTerminal(comp, Math.round((device.vw - railPx) * f), Math.round(device.vh * f));
        } catch (e) {
            return null;
        }
    }, [comp, device, senior, scale, rail]);

    if (!layout) {
        return (
            <div className="aspect-[16/10] w-full rounded-lg border border-line bg-sunken/50
                            flex items-center justify-center text-2xs text-ink-muted">
                Preview unavailable
            </div>
        );
    }

    const cat = layout.catalog;
    const flr = layout.floor;
    const stacked = layout.regime !== 'columns';

    /* Column tracks, in the same order the register renders them. Percentages
       rather than pixels, because the frame below is a proportional drawing of
       the screen, not a screenshot of it. */
    const avail = Math.max(1, layout.avail);
    const pct = px => `${Math.max(4, (px / avail) * 100)}%`;
    const cols = [];
    if (cat && cat.mode === 'left') cols.push(['catalog', pct(cat.px)]);
    if (flr && flr.mode === 'left') cols.push(['floor', pct(flr.px)]);
    cols.push(['cart', 'minmax(0,1fr)']);
    if (layout.tender.mode === 'column') cols.push(['tender', pct(layout.tender.px)]);
    if (cat && cat.mode === 'right') cols.push(['catalog', pct(cat.px)]);

    const bandRows = cat && cat.h ? Math.max(1, cat.rows || 1) : 0;
    const dockLabels = layout.dock.map(d => d.label);

    return (
        <div className="space-y-2">
            {/* ── THE FRAME ── */}
            <div
                className="w-full rounded-xl border-2 border-ink-faint/40 bg-app p-1.5 shadow-xs
                           flex flex-col gap-1.5 select-none"
                style={{ aspectRatio: `${device.vw} / ${device.vh}` }}
                role="img"
                aria-label={`Register preview at ${device.vw} by ${device.vh}`}
            >
                {/* the bar */}
                <div className="h-3 shrink-0 rounded bg-surface border border-line flex items-center gap-1 px-1">
                    <span className="w-2 h-1 rounded-sm bg-ink-faint/40" />
                    <span className="w-5 h-1 rounded-sm bg-ink-faint/25" />
                    <span className="flex-1" />
                    <span className="w-2 h-1 rounded-sm bg-brand-500/50" />
                </div>

                {/* the working surface */}
                <div className="flex-1 min-h-0 flex flex-col gap-1.5">
                    {cat && cat.mode === 'top' && (
                        <Pane kind="catalog" label="Catalog"
                              sub={`${bandRows} row${bandRows === 1 ? '' : 's'}`}
                              className="shrink-0" style={{ height: `${Math.min(38, bandRows * 16)}%` }} />
                    )}

                    <div
                        className="flex-1 min-h-0 grid gap-1.5"
                        style={stacked
                            ? { gridTemplateRows: 'repeat(auto-fit, minmax(0,1fr))' }
                            : { gridTemplateColumns: cols.map(c => c[1]).join(' ') }}
                    >
                        {stacked ? (
                            <Pane kind="cart" label="Cart" sub={`${layout.cartLines} lines`} />
                        ) : cols.map(([kind], i) => (
                            <Pane
                                key={`${kind}-${i}`}
                                kind={kind}
                                label={kind === 'cart' ? 'Cart' : kind === 'tender' ? 'Payment' : kind === 'floor' ? 'Floor' : 'Catalog'}
                                sub={kind === 'cart'
                                    ? `${layout.cartLines} lines`
                                    : kind === 'tender' ? `${Math.round(layout.tender.px)}px`
                                    : kind === 'floor' ? `${Math.round(flr.px)}px`
                                    : `${Math.round(cat.px)}px`}
                            />
                        ))}
                    </div>

                    {cat && cat.mode === 'bottom' && (
                        <Pane kind="catalog" label="Catalog"
                              sub={`${bandRows} row${bandRows === 1 ? '' : 's'}`}
                              className="shrink-0" style={{ height: `${Math.min(38, bandRows * 16)}%` }} />
                    )}
                </div>

                {/* the dock — a real layout row, so it is drawn as one */}
                {layout.tender.mode === 'bar' ? (
                    <div className="h-5 shrink-0 rounded-md border border-amber-300 dark:border-amber-800
                                    bg-amber-100 dark:bg-amber-950/50 flex items-center justify-between px-1.5">
                        <span className="text-[8px] font-bold text-amber-800 dark:text-amber-300">TOTAL</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">Pay</span>
                    </div>
                ) : dockLabels.length > 0 && (
                    <div className="h-4 shrink-0 flex items-center gap-1">
                        {layout.dock.map(d => (
                            <span
                                key={d.id}
                                className={`text-[8px] font-bold px-1.5 py-0.5 rounded truncate
                                            ${d.primary
                                                ? 'bg-emerald-600 text-white flex-1 text-center'
                                                : 'bg-surface border border-line text-ink-secondary'}`}
                            >
                                {d.label}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* ── WHAT THE LAW DID TO THE WISH ──
                A preview that only draws the happy path teaches nothing. When
                the engine overrode a choice, the reason is printed under the
                picture rather than left for the operator to discover at the
                till. */}
            {layout.notes.length > 0 && (
                <ul className="space-y-1">
                    {layout.notes.map((n, i) => (
                        <li key={i}
                            className="text-3xs leading-relaxed text-amber-800 dark:text-amber-300
                                       bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/50
                                       rounded-lg px-2.5 py-1.5">
                            {n}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
