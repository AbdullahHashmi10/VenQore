import React, { useState } from 'react';
import { X, Check, Users } from 'lucide-react';

/** Pick a size / flavour for a product that has variants. */
export function VariantPicker({ product, variants, money, onCancel, onPick }) {
    if (!product) return null;
    return (
        <div className="vqt-modal-scrim" onMouseDown={onCancel}>
            <div className="vqt-modal bg-surface border border-line" role="dialog" aria-modal="true" aria-label={`Choose for ${product.name}`} onMouseDown={(e) => e.stopPropagation()}>
                <header className="vqt-modal-h">
                    <h2 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>{product.name}</h2>
                    <button type="button" className="vqt-icon-btn" onClick={onCancel} aria-label="Cancel"><X size={16} /></button>
                </header>
                <div className="vqt-modal-b space-y-2">
                    {variants.map((v) => (
                        <button key={v.id} type="button" onClick={() => onPick(v)}
                            className="w-full text-left p-3 rounded-xl border border-line hover:bg-sunken flex justify-between items-center">
                            <span className="font-bold text-ink">{v.name || v.sku}</span>
                            <span className="font-bold text-brand-600 vq-num">{money(v.price)}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Pick a free table (and covers) to turn a takeaway / delivery order into dine-in. */
export function TablePicker({ positions, onCancel, onPick, busy }) {
    const [covers, setCovers] = useState(2);
    const free = positions.filter((p) => !p.occupancy_id && p.status === 'available');
    return (
        <div className="vqt-modal-scrim" onMouseDown={onCancel}>
            <div className="vqt-modal vqt-modal-wide bg-surface border border-line" role="dialog" aria-modal="true" aria-label="Choose a table" onMouseDown={(e) => e.stopPropagation()}>
                <header className="vqt-modal-h">
                    <h2 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>Seat this order at a table</h2>
                    <button type="button" className="vqt-icon-btn" onClick={onCancel} aria-label="Cancel"><X size={16} /></button>
                </header>
                <div className="vqt-modal-b space-y-3">
                    <label className="foh-covers"><Users size={14} aria-hidden="true" /> Guests
                        <input type="number" min="1" max="99" value={covers} onChange={(e) => setCovers(Math.max(1, Math.min(99, Number(e.target.value) || 1)))} />
                    </label>
                    <div className="vqt-move-grid">
                        {free.map((p) => (
                            <button key={p.id} type="button" className="vqt-move-target" disabled={busy} onClick={() => onPick(p, covers)}>
                                <span className="vqt-move-code">{p.code}</span>
                                <span className="vqt-move-verb">Seat here</span>
                                <span className="vqt-move-sub vq-clip">seats {p.capacity || 0}</span>
                            </button>
                        ))}
                        {free.length === 0 && <p className="text-sm text-ink-muted p-4">No free table right now.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Small yes/no used for discarding and collecting. */
export function ConfirmBar({ title, body, confirmLabel = 'Confirm', danger = false, onCancel, onConfirm }) {
    return (
        <div className="vqt-modal-scrim" onMouseDown={onCancel}>
            <div className="vqt-modal bg-surface border border-line" role="alertdialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
                <header className="vqt-modal-h"><h2 className="font-bold text-ink" style={{ fontSize: 'var(--vq-t-lg)' }}>{title}</h2></header>
                {body && <p className="vqt-modal-note">{body}</p>}
                <footer className="vqt-modal-f">
                    <button type="button" className="vqt-btn" onClick={onCancel}>Cancel</button>
                    <button type="button" className={`vqt-btn ${danger ? 'vqt-act-danger' : 'vqt-btn-go'}`} onClick={onConfirm}><Check size={16} /> {confirmLabel}</button>
                </footer>
            </div>
        </div>
    );
}
