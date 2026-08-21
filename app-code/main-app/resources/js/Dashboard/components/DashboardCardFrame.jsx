import React from 'react';
import { HelpCircle, AlertCircle, MoreVertical, Edit2, Trash2 } from 'lucide-react';

/**
 * DashboardCardFrame — VenQore Design System v2.0
 *
 * Surfaces: --vq-surface (card), --vq-sunken (loading skeleton)
 * Text:     --vq-text / --vq-text-2 / --vq-text-3
 * Border:   --vq-line / --vq-line-soft
 * Accent:   --vq-accent-quiet / --vq-accent-text
 * Semantic: --vq-danger (error)
 * Motion:   --vq-dur-fast / --vq-ease
 */
export default function DashboardCardFrame({
    card,
    definition,
    loading,
    error,
    isGated,
    isLocked,
    onEdit,
    onRemove,
    children
}) {
    const title = card?.title_override || definition?.label || 'Metric';
    const description = definition?.description || '';
    const help = definition?.help || '';

    /*
     * Mechanism M1 — exactly one accent-filled card per board, and it must be
     * the headline metric.
     *
     * `card.style.accent` has been persisted, sanitised, budget-enforced and
     * validated since the editor landed, and NOTHING rendered it. The board had
     * the data and drew every card identically, which is the one thing M1 says
     * a board must not do: with no accent card it has not said which number
     * matters.
     *
     * The fill is the mint gradient with inverted text, and in dark mode it also
     * BLOOMS — it gains `--vq-glow-accent`, which the plain cards do not have.
     * That bloom is M6: dark mode is a re-render, not an inversion.
     */
    const accent = Boolean(card?.style?.accent);

    // Handle gated / plan downgrade state: hide card entirely from layout view
    if (isGated) {
        return null; 
    }

    return (
        <div
            style={{
                position: 'relative',
                background: accent ? 'var(--vq-grad-mint)' : 'var(--vq-surface)',
                border: `1px solid ${accent ? 'transparent' : 'var(--vq-line)'}`,
                borderRadius: 'var(--vq-r-lg)',
                padding: '16px',
                boxShadow: accent ? 'var(--vq-glow-accent)' : 'var(--vq-elev-1)',
                color: accent ? 'var(--vq-on-accent)' : 'var(--vq-text)',
                display: 'flex',
                flexDirection: 'column',
                /*
                 * Top-aligned, NOT space-between.
                 *
                 * `space-between` on a column pushes the header up and the body
                 * down, so a card holding one number stretched that number
                 * across whatever height the grid gave it — which is why a
                 * three-element metric block was floating in the middle of a
                 * 400px box with nothing above or below it.
                 *
                 * The fit decides the box; the content sits at the top of it.
                 */
                justifyContent: 'flex-start',
                gap: '10px',
                height: '100%',
                userSelect: 'none',
                transition: `border-color var(--vq-dur-fast) var(--vq-ease), box-shadow var(--vq-dur-fast) var(--vq-ease)`,
            }}
            className="vq-card-frame"
            id={`card-${card.id}`}
            onMouseEnter={e => {
                if (accent) {
                    e.currentTarget.style.boxShadow = 'var(--vq-glow-accent-strong)';
                    return;
                }
                e.currentTarget.style.borderColor = 'var(--vq-line-strong)';
                e.currentTarget.style.boxShadow = 'var(--vq-elev-2)';
            }}
            onMouseLeave={e => {
                if (accent) {
                    e.currentTarget.style.boxShadow = 'var(--vq-glow-accent)';
                    return;
                }
                e.currentTarget.style.borderColor = 'var(--vq-line)';
                e.currentTarget.style.boxShadow = 'var(--vq-elev-1)';
            }}
        >
            {/* ── Card Header ── */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '8px',
                flexShrink: 0,
                marginBottom: '10px',
            }}>
                {/* Title + help icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    {/* Drag handle doubles as title — grab region */}
                    <span
                        className="vq-card-drag-handle"
                        title={description}
                        style={{
                            fontFamily: 'var(--vq-font-mono)',
                            fontSize: 'var(--vq-fs-eyebrow)',
                            lineHeight: 'var(--vq-lh-eyebrow)',
                            letterSpacing: 'var(--vq-ls-eyebrow)',
                            textTransform: 'uppercase',
                            fontWeight: 'var(--vq-fw-medium)',
                            // On the accent fill the eyebrow inverts with everything
                            // else. --vq-text-3 on mint is roughly 1.6:1.
                            color: accent ? 'rgb(255 255 255 / .72)' : 'var(--vq-text-3)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '160px',
                            cursor: isLocked ? 'default' : 'grab',
                        }}
                    >
                        {title}
                    </span>
                    {help && (
                        <div style={{ position: 'relative', flexShrink: 0 }} className="vq-help-trigger">
                            <button
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'help',
                                    color: 'var(--vq-text-3)',
                                    display: 'flex',
                                    transition: `color var(--vq-dur-instant)`,
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.color = 'var(--vq-accent-text)';
                                    e.currentTarget.nextSibling.style.opacity = '1';
                                    e.currentTarget.nextSibling.style.pointerEvents = 'auto';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.color = 'var(--vq-text-3)';
                                    e.currentTarget.nextSibling.style.opacity = '0';
                                    e.currentTarget.nextSibling.style.pointerEvents = 'none';
                                }}
                            >
                                <HelpCircle size={12} />
                            </button>
                            {/* Tooltip */}
                            <div style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: '100%',
                                marginBottom: '6px',
                                transform: 'translateX(-50%)',
                                width: '192px',
                                background: 'var(--vq-raised)',
                                border: '1px solid var(--vq-line)',
                                color: 'var(--vq-text-2)',
                                padding: '8px 10px',
                                borderRadius: 'var(--vq-r-md)',
                                fontSize: 'var(--vq-fs-caption)',
                                lineHeight: 'var(--vq-lh-caption)',
                                fontFamily: 'var(--vq-font-sans)',
                                textAlign: 'center',
                                opacity: 0,
                                pointerEvents: 'none',
                                transition: `opacity var(--vq-dur-instant)`,
                                zIndex: 'var(--vq-z-tooltip)',
                                boxShadow: 'var(--vq-elev-3)',
                            }}>
                                {help}
                            </div>
                        </div>
                    )}
                </div>

                {/* Edit Actions Menu (rendered if layout is unlocked) */}
                {!isLocked && (onEdit || onRemove) && (
                    <div style={{ position: 'relative', flexShrink: 0 }} className="vq-card-menu">
                        <button
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: '2px',
                                cursor: 'pointer',
                                color: 'var(--vq-text-3)',
                                borderRadius: 'var(--vq-r-xs)',
                                display: 'flex',
                                transition: `color var(--vq-dur-instant), background var(--vq-dur-instant)`,
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.color = 'var(--vq-text-2)';
                                e.currentTarget.style.background = 'var(--vq-sunken)';
                                const menu = e.currentTarget.parentElement.querySelector('.vq-card-dropdown');
                                if (menu) { menu.style.opacity = '1'; menu.style.pointerEvents = 'auto'; }
                            }}
                        >
                            <MoreVertical size={14} />
                        </button>
                        
                        <div
                            className="vq-card-dropdown"
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                marginTop: '4px',
                                background: 'var(--vq-raised)',
                                border: '1px solid var(--vq-line)',
                                borderRadius: 'var(--vq-r-md)',
                                boxShadow: 'var(--vq-elev-3)',
                                opacity: 0,
                                pointerEvents: 'none',
                                transition: `opacity var(--vq-dur-fast)`,
                                zIndex: 'var(--vq-z-dropdown)',
                                padding: '4px',
                                minWidth: '120px',
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.opacity = '0';
                                e.currentTarget.style.pointerEvents = 'none';
                            }}
                        >
                            {onEdit && (
                                <button 
                                    onClick={onEdit}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '7px 10px',
                                        fontSize: 'var(--vq-fs-caption)',
                                        fontWeight: 'var(--vq-fw-medium)',
                                        fontFamily: 'var(--vq-font-sans)',
                                        color: 'var(--vq-text-2)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: 'var(--vq-r-sm)',
                                        textAlign: 'left',
                                        transition: `background var(--vq-dur-instant)`,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--vq-sunken)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    <Edit2 size={11} />
                                    <span>Configure</span>
                                </button>
                            )}
                            {onRemove && (
                                <button 
                                    onClick={onRemove}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '7px 10px',
                                        fontSize: 'var(--vq-fs-caption)',
                                        fontWeight: 'var(--vq-fw-medium)',
                                        fontFamily: 'var(--vq-font-sans)',
                                        color: 'var(--vq-danger)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderRadius: 'var(--vq-r-sm)',
                                        textAlign: 'left',
                                        transition: `background var(--vq-dur-instant)`,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--vq-danger-bg)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                >
                                    <Trash2 size={11} />
                                    <span>Delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Card Body & States ── */}
            <div style={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                // Was `center`, which floated the number block in the middle of
                // the card. M2's ladder reads top-down — eyebrow, value, delta —
                // so it starts at the top and a chart fills what is left.
                justifyContent: 'flex-start',
                width: '100%',
                minHeight: 0,
                position: 'relative',
            }}>
                {loading ? (
                    /* Skeleton loader — VQ sunken surface */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        <div style={{
                            height: '28px',
                            width: '62%',
                            background: 'var(--vq-sunken)',
                            borderRadius: 'var(--vq-r-sm)',
                            animation: 'vq-pulse 1.6s ease-in-out infinite',
                        }} />
                        <div style={{
                            height: '14px',
                            width: '34%',
                            background: 'var(--vq-sunken)',
                            borderRadius: 'var(--vq-r-xs)',
                            opacity: 0.6,
                            animation: 'vq-pulse 1.6s ease-in-out 0.3s infinite',
                        }} />
                        <style>{`
                            @keyframes vq-pulse {
                                0%, 100% { opacity: 0.45; }
                                50%       { opacity: 0.9; }
                            }
`}</style>
                    </div>
                ) : error ? (
                    /* Error state */
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: 'var(--vq-text-3)',
                    }}>
                        <AlertCircle size={20} style={{ color: 'var(--vq-danger)', opacity: 0.72 }} />
                        <span style={{
                            fontFamily: 'var(--vq-font-mono)',
                            fontSize: 'var(--vq-fs-eyebrow)',
                            letterSpacing: 'var(--vq-ls-eyebrow)',
                            textTransform: 'uppercase',
                            color: 'var(--vq-text-3)',
                        }}>
                            Failed to load
                        </span>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
