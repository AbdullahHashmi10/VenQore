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

    // Handle gated / plan downgrade state: hide card entirely from layout view
    if (isGated) {
        return null; 
    }

    return (
        <div
            style={{
                position: 'relative',
                background: 'var(--vq-surface)',
                border: '1px solid var(--vq-line)',
                borderRadius: 'var(--vq-r-lg)',
                padding: '16px',
                boxShadow: 'var(--vq-elev-1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                userSelect: 'none',
                transition: `border-color var(--vq-dur-fast) var(--vq-ease), box-shadow var(--vq-dur-fast) var(--vq-ease)`,
            }}
            className="vq-card-frame"
            id={`card-${card.id}`}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--vq-line-strong)';
                e.currentTarget.style.boxShadow = 'var(--vq-elev-2)';
            }}
            onMouseLeave={e => {
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
                            color: 'var(--vq-text-3)',
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
                justifyContent: 'center',
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
