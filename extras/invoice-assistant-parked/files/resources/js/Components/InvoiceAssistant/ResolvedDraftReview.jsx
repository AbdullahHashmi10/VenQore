import React from 'react';
import { AlertTriangle } from 'lucide-react';

const SOURCES = {
    store_policy: 'Store price',
    requested_override: 'Price you asked for',
};

/**
 * Read-only review of what the assistant understood. It shows the draft; it is
 * not the invoice. Totals are labelled a preview because the editor and the
 * server calculate the real ones.
 */
export default function ResolvedDraftReview({ draft, money }) {
    if (!draft) return null;
    const lines = draft.lines || [];
    const pending = draft.lines_pending || [];
    const t = draft.totals_preview;
    const fmt = (v) => (money ? money(Number(v)) : String(v));
    const pay = draft.payment || {};

    return (
        <section aria-label="What the assistant understood" style={{ display: 'grid', gap: 'var(--d-s4, 16px)' }}>
            <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: 'var(--d-s2, 8px) var(--d-s4, 16px)', margin: 0 }}>
                <dt style={{ color: 'var(--vq-text-2)' }}>Customer</dt>
                <dd style={{ margin: 0 }}>{draft.customer?.name || <em>Not chosen yet</em>}</dd>
                <dt style={{ color: 'var(--vq-text-2)' }}>Payment</dt>
                <dd style={{ margin: 0 }}>
                    {pay.method === 'credit' ? 'On account' : pay.method === 'cash' ? 'Paid now' : '—'}
                    {pay.amount_source === 'explicit' ? ` · ${fmt(pay.amount_paid)} received (as you said)` : ' · no amount received yet'}
                </dd>
                <dt style={{ color: 'var(--vq-text-2)' }}>Date</dt>
                <dd style={{ margin: 0 }}>{draft.invoice_date || '—'}{draft.due_date ? ` · due ${draft.due_date}` : ''}</dd>
                {draft.notes ? (<><dt style={{ color: 'var(--vq-text-2)' }}>Note</dt><dd style={{ margin: 0 }}>{draft.notes}</dd></>) : null}
            </dl>

            {(lines.length > 0 || pending.length > 0) && (
                <table className="vqdoc-dtable">
                    <caption style={{ position: 'absolute', left: '-9999px' }}>Lines on the draft invoice</caption>
                    <thead>
                        <tr>
                            <th scope="col">Item</th>
                            <th scope="col" className="n">Qty</th>
                            <th scope="col" className="n">Price</th>
                            <th scope="col">Basis</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lines.map((l) => (
                            <tr key={l.line_key}>
                                <td>
                                    {l.name}
                                    {l.sku ? <span style={{ color: 'var(--vq-text-2)' }}> · {l.sku}</span> : null}
                                    {l.discount_percent && Number(l.discount_percent) > 0 ? <span> · {l.discount_percent}% off</span> : null}
                                </td>
                                <td className="n">{l.quantity}{l.sale_uom ? ` ${l.sale_uom}` : ''}</td>
                                <td className="n">{fmt(l.unit_price)}</td>
                                <td style={{ color: 'var(--vq-text-2)' }}>{SOURCES[l.price_source] || ''}</td>
                            </tr>
                        ))}
                        {pending.map((l) => (
                            <tr key={`p-${l.line_key}`} style={{ opacity: 0.7 }}>
                                <td>{l.name || l.sku || 'Item to confirm'}</td>
                                <td className="n">{l.quantity ?? '?'}</td>
                                <td className="n">—</td>
                                <td>Needs your answer</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {t && lines.length > 0 && (
                <div className="vqdoc-sum">
                    <div className="vqdoc-sum-row"><span className="k">Subtotal</span><span className="v">{fmt(t.subtotal)}</span></div>
                    {Number(t.discount) > 0 && <div className="vqdoc-sum-row"><span className="k">Discount</span><span className="v">−{fmt(t.discount)}</span></div>}
                    {Number(t.tax) > 0 && <div className="vqdoc-sum-row"><span className="k">Tax</span><span className="v">{fmt(t.tax)}</span></div>}
                    <div className="vqdoc-total"><span className="k">Estimated total</span><span className="v">{fmt(t.total)}</span></div>
                    <p style={{ margin: 'var(--d-s2, 8px) 0 0', color: 'var(--vq-text-2)' }}>{t.note}</p>
                </div>
            )}

            {(draft.warnings || []).length > 0 && (
                <ul aria-label="Warnings" style={{ margin: 0, paddingLeft: 'var(--d-s5, 20px)', display: 'grid', gap: 'var(--d-s2, 8px)' }}>
                    {draft.warnings.map((w, i) => (
                        <li key={`${w.code}-${w.line_key || ''}-${i}`}>
                            <AlertTriangle size={14} aria-hidden="true" style={{ verticalAlign: '-2px' }} /> {w.message}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
