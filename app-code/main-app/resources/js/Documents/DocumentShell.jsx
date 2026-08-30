import React from 'react';
import { Head } from '@inertiajs/react';
import {
    PanelLeft, PanelLeftClose, Plus, X, ChevronDown, Settings,
    AlertTriangle, Receipt,
} from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import '@/Documents/document-law.css';

/**
 * DocumentShell — the frame every document is drawn in.
 *
 * The bar with the rail toggle and the tabs, the scrolling body, the divider,
 * the totals column, the dock that appears when the total scrolls out of
 * sight: none of that is about invoices in particular, and every one of the
 * old screens carried its own slightly-drifted copy of it. One copy, here.
 *
 * The shell knows nothing about money, stock or parties. It takes a document
 * spec so it can put the right words on things, the chrome state from
 * useDocumentChrome, and slots for the parts that differ.
 */
export default function DocumentShell({
    doc,                    /* the spec from documentTypes.js               */
    chrome,                 /* everything from useDocumentChrome            */
    isEdit = false,
    locked = false,         /* posted / converted — read only               */
    lockNote,
    subtitle,               /* the small line under the title               */

    /* tabs — only for documents that can have several open at once */
    tabs = [],              /* [{ id, label, count }]                       */
    activeTab,
    onTab,
    onCloseTab,
    onNewTab,

    tools,                  /* extra buttons on the right of the bar        */
    notice,                 /* a banner above the document                  */
    header,                 /* the party / details zone                     */
    extra,                  /* a block between the header and the lines —
                               landed costs, a schedule, whatever this
                               document has that the others do not          */
    strip,                  /* the folded one-line version of that zone     */
    lines,                  /* the items zone                               */
    totals,                 /* the totals column                            */
    dock,                   /* { total, totalLabel, balance, balanceLabel, actions } */
    children,               /* modals and overlays                          */
}) {
    const {
        rootRef, scrollRef, bodyRef, sumRef, splitRef,
        showRail, setShowRail, textSize, law, asCards, pinned, dockOn,
        detailsOpen, onSplitDown, onSplitKey, setSettingsOpen, setTotalsSheet,
    } = chrome;

    const title = isEdit ? doc.title.edit : doc.title.new;
    const showTabs = doc.tabs && tabs.length > 0 && !isEdit;

    return (
        <OneGlanceLayout
            title={title}
            activeMenu={doc.menu}
            fullScreen={false}
            hideHeader
            noPadding
            hideSidebar={!showRail}
        >
            <Head title={title} />

            <div
                ref={rootRef}
                className="vqdoc"
                data-scale={textSize}
                data-dock={dockOn ? 'on' : 'off'}
                style={{ '--d-split': `${law.split}%` }}
            >
                {/* ══ THE BAR ══════════════════════════════════════════════ */}
                <header className="vqdoc-bar">
                    <button
                        type="button"
                        className="vqdoc-icon"
                        onClick={() => setShowRail(!showRail)}
                        aria-pressed={!showRail}
                        title={showRail ? 'Hide the navigation rail' : 'Show the navigation rail'}
                    >
                        {showRail ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
                    </button>

                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', marginRight: 6 }}>
                        <span className="vqdoc-title">{title}</span>
                        <span className="vqdoc-sub">{subtitle}</span>
                    </div>

                    {locked && (
                        <span className="vqdoc-note" data-tone="warn" style={{ padding: '6px 12px', gap: 6 }}>
                            <AlertTriangle size={13} /> {lockNote || 'Read only'}
                        </span>
                    )}

                    {showTabs && !asCards && (
                        <>
                            <span className="sep" />
                            <div className="vqdoc-tabs" role="tablist" aria-label={`Open ${doc.name.toLowerCase()}s`}>
                                {tabs.map((t, idx) => (
                                    <span
                                        key={t.id}
                                        role="tab"
                                        aria-selected={activeTab === t.id}
                                        className="vqdoc-tab"
                                        onClick={() => onTab?.(t.id)}
                                    >
                                        <span className="lbl">{t.label || `${doc.title.tab} ${idx + 1}`}</span>
                                        {t.count > 0 && (
                                            <span className="num" style={{ opacity: .6, fontSize: 'var(--d-t-micro)' }}>{t.count}</span>
                                        )}
                                        <span className="x" onClick={(e) => { e.stopPropagation(); onCloseTab?.(t); }}>
                                            <X size={12} strokeWidth={2.5} />
                                        </span>
                                    </span>
                                ))}
                                {onNewTab && (
                                    <button type="button" className="vqdoc-icon sm" title={`Start another ${doc.name.toLowerCase()}`} onClick={onNewTab}>
                                        <Plus size={15} />
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {showTabs && asCards && (
                        <button type="button" className="vqdoc-tab" style={{ maxWidth: '40%' }} onClick={() => onTab?.('__list__')}>
                            <span className="lbl">
                                {tabs.find((t) => t.id === activeTab)?.label || doc.title.tab}
                            </span>
                            <ChevronDown size={13} />
                        </button>
                    )}

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {tools}
                        <button type="button" className="vqdoc-icon" title="Screen settings" onClick={() => setSettingsOpen(true)}>
                            <Settings size={17} />
                        </button>
                    </div>
                </header>

                {/* ══ THE DOCUMENT ═════════════════════════════════════════ */}
                <div
                    className="vqdoc-scroll"
                    ref={scrollRef}
                    data-fill={law.summary === 'side' && !asCards ? '1' : '0'}
                >
                    {notice}

                    {detailsOpen ? header : strip}

                    {/* Folds away with the header, because it belongs to the
                        same "what is this document" part of the screen — and is
                        capped so it can never push the lines off the bottom. */}
                    {detailsOpen && extra && <div className="vqdoc-extra">{extra}</div>}

                    <div
                        className="vqdoc-body"
                        data-sum={law.summary === 'hidden' ? 'below' : law.summary}
                        ref={bodyRef}
                    >
                        {lines}

                        {law.summary === 'side' && (
                            <button
                                type="button"
                                ref={splitRef}
                                className="vqdoc-split"
                                aria-label="Resize the totals column"
                                onPointerDown={onSplitDown}
                                onKeyDown={onSplitKey}
                            />
                        )}

                        {law.summary !== 'hidden' && (
                            <aside className={`vqdoc-sumcol ${pinned ? 'stick' : ''}`} ref={sumRef}>
                                {totals}
                            </aside>
                        )}
                    </div>
                </div>

                {/* ══ THE DOCK ═════════════════════════════════════════════
                    It overlays rather than reserving a strip, so a document
                    with three lines on it does not carry an empty bar at the
                    bottom of the screen for nothing. */}
                {dock && (
                    <div className="vqdoc-dockrow">
                        <div className={`vqdoc-dock ${dockOn ? 'on' : ''}`}>
                            {dock.total !== undefined && (
                                <div style={{ minWidth: 0 }}>
                                    <div className="k">{dock.totalLabel || 'Total'}</div>
                                    <div className="v">{dock.total}</div>
                                </div>
                            )}
                            {dock.balance !== undefined && (
                                <div style={{ minWidth: 0 }}>
                                    <div className="k">{dock.balanceLabel}</div>
                                    <div className="bal">{dock.balance}</div>
                                </div>
                            )}
                            {law.summary === 'hidden' && totals && (
                                <button type="button" className="vqdoc-icon" onClick={() => setTotalsSheet(true)} title="Totals" aria-label="Totals">
                                    <Receipt size={17} />
                                </button>
                            )}
                            {dock.actions}
                        </div>
                    </div>
                )}
            </div>

            {/* When the totals column is turned off the dock's receipt button
                is the only way back to the discount, the tax and the amount
                paid. It used to set a flag nothing rendered, which quietly made
                those unreachable on a phone. */}
            {chrome.totalsSheet && totals && (
                <div
                    className="vqdoc-scope vqdoc-scrim"
                    style={{ height: 'auto', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 24 }}
                    onMouseDown={(e) => { if (e.target === e.currentTarget) chrome.setTotalsSheet(false); }}
                >
                    <div className="vqdoc-modal" style={{ width: 'min(420px, 100%)' }}>
                        <header>
                            <span className="ico"><Receipt size={18} /></span>
                            <span className="t"><h3>Totals</h3></span>
                            <button type="button" className="vqdoc-icon quiet" onClick={() => chrome.setTotalsSheet(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </header>
                        <div className="body flush">{totals}</div>
                    </div>
                </div>
            )}

            {children}
        </OneGlanceLayout>
    );
}

/* ── the pieces every screen builds its zones out of ──────────────────────
   Small enough that a page could write them by hand, shared so that thirteen
   pages do not each invent their own spelling of the same thing. */

export function Zone({ title, count, tone, actions, children, onFocusCapture, className = '' }) {
    return (
        <section className={`vqdoc-zone ${className}`} onFocusCapture={onFocusCapture}>
            {(title || actions) && (
                <div className="vqdoc-zone-h" data-tone={tone}>
                    <span>{title}</span>
                    {count !== undefined && <span className="count">{count}</span>}
                    <span className="spacer" />
                    {actions}
                </div>
            )}
            {children}
        </section>
    );
}

export function Field({ label, span = 2, children, hint, required, error }) {
    return (
        <div className="vqdoc-f" data-span={span} data-bad={error ? 'true' : undefined}>
            <span className="vqdoc-lbl">
                {label}
                {required && <span className="req">*</span>}
            </span>
            {children}
            {/* An error said next to the field it belongs to outlives the toast
                that said it once and vanished. */}
            {error ? <span className="err">{error}</span> : (hint && <span className="hint">{hint}</span>)}
        </div>
    );
}

/**
 * A dialog, with the header/body/footer the stylesheet already dresses.
 *
 * Occasional detail — a consignment's freight and duty, a schedule, a reason
 * code — belongs in one of these rather than stacked down the page. Inline it
 * grows without limit: seven landed costs pushed the items and the totals off
 * the bottom of a container that does not scroll, and the document became
 * unreachable behind its own trimmings.
 */
export function Sheet({ title, hint, icon, onClose, children, footer, width = 640 }) {
    return (
        <Scrim onClose={onClose}>
            <div className="vqdoc-modal" style={{ width: `min(${width}px, 100%)` }}>
                <header>
                    {icon && <span className="ico">{icon}</span>}
                    <span className="t">
                        <h3>{title}</h3>
                        {hint && <p>{hint}</p>}
                    </span>
                    <button type="button" className="vqdoc-icon quiet" onClick={onClose} aria-label="Close">
                        <X size={18} />
                    </button>
                </header>
                <div className="body">{children}</div>
                {footer && <footer>{footer}</footer>}
            </div>
        </Scrim>
    );
}

export function Scrim({ onClose, align = 'center', children, padding }) {
    return (
        <div
            className="vqdoc-scope vqdoc-scrim"
            style={{
                height: 'auto',
                ...(align === 'end' ? { alignItems: 'flex-end', justifyContent: 'flex-end', padding: padding ?? 24 } : {}),
            }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            {children}
        </div>
    );
}
