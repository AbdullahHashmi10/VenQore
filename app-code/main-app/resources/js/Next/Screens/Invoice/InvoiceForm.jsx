/**
 * InvoiceForm.jsx  — Next/ shell screen for Invoice / Sale form.
 *
 * Contract: this component contains NO logic.
 * ALL computation, validation, state, and fetch live in Domain/invoice/.
 * This file may only: import from domain, read returned values, render markup,
 * and call handler functions the hook returned.
 *
 * Sections:
 *   Header      — date, number, payment method, customer picker
 *   LineTable   — Goods · Services · Charges sections (capability-gated columns)
 *   Totals      — live arithmetic shown on hover
 *   Footer      — Save / Print / Cancel actions + keyboard shortcuts
 */

import React from 'react';
import { Head } from '@inertiajs/react';
import {
    Save, Printer, Plus, Trash2, Package, Briefcase,
    ChevronDown, User, CreditCard, Banknote, Info,
    AlertCircle, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { useInvoiceForm } from '../../../Domain/invoice/useInvoiceForm';
import { useTerms } from '../../../lib/terms';

// ---------------------------------------------------------------------------
// Sub-components (render-only, no state)
// ---------------------------------------------------------------------------

function SectionHeader({ icon: Icon, label, subtotal, symbol }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.75rem', fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
            <Icon size={13} />
            <span style={{ flex: 1 }}>{label}</span>
            {subtotal > 0 && (
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {symbol}{subtotal.toFixed(2)}
                </span>
            )}
        </div>
    );
}

function LineRow({ item, features, onUpdate, onRemove, isPosted, currencySymbol }) {
    const isSvc = item.product?.type === 'service';
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `1fr 80px 110px ${features.batch_tracking ? '90px' : ''} 90px 36px`,
            gap: '0.5rem',
            alignItems: 'center',
            padding: '0.35rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-1)',
            marginBottom: '0.25rem',
        }}>
            {/* Name */}
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {item.name || <em style={{ color: 'var(--text-muted)' }}>Select product…</em>}
                {isSvc && (
                    <span style={{
                        marginLeft: '0.5rem', fontSize: '0.7rem', padding: '1px 6px',
                        borderRadius: '999px', background: 'var(--accent-alpha-10)',
                        color: 'var(--accent)', fontWeight: 600,
                    }}>SVC</span>
                )}
            </span>

            {/* Quantity */}
            <input
                type="number" min="0" step="any"
                value={item.quantity}
                disabled={isPosted}
                onChange={e => onUpdate(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                style={{
                    width: '100%', padding: '0.3rem 0.5rem',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)', color: 'var(--text-primary)',
                    fontSize: '0.875rem', textAlign: 'right',
                }}
            />

            {/* Unit price */}
            <input
                type="number" min="0" step="any"
                value={item.price}
                disabled={isPosted}
                onChange={e => onUpdate(item.id, { price: parseFloat(e.target.value) || 0 })}
                style={{
                    width: '100%', padding: '0.3rem 0.5rem',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)', color: 'var(--text-primary)',
                    fontSize: '0.875rem', textAlign: 'right',
                }}
            />

            {/* Discount */}
            <input
                type="number" min="0" step="any"
                value={item.discount}
                disabled={isPosted}
                onChange={e => onUpdate(item.id, { discount: parseFloat(e.target.value) || 0 })}
                style={{
                    width: '100%', padding: '0.3rem 0.5rem',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface-2)', color: 'var(--text-primary)',
                    fontSize: '0.875rem', textAlign: 'right',
                }}
            />

            {/* Remove */}
            <button
                onClick={() => onRemove(item.id)}
                disabled={isPosted}
                title="Remove line"
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', padding: '0.2rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-alpha-10)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
            >
                <Trash2 size={15} />
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function InvoiceForm({ sale, features = {} }) {
    const { t, tp } = useTerms();

    const {
        invoice, patch, isEditMode, isPosted,
        totals,
        addLine, removeLine, updateLine,
        validate, customerError, invalidLines,
        aiPrefillNotice,
    } = useInvoiceForm({ sale });

    const customerLabel = t('customer', 'Customer');
    const currencySymbol = '$'; // TODO: wire from shared props when multi-currency is enabled

    // Split lines by type for section rendering
    const goodsLines    = (invoice?.items || []).filter(i => !i.product || i.product?.type !== 'service');
    const serviceLines  = (invoice?.items || []).filter(i => i.product?.type === 'service');

    const handleSave = async (shouldPrint = false) => {
        if (!validate()) return;
        // Actual submit is handled by the parent page component via router.post
        // Here we just emit an event the parent listens to, keeping logic in the hook
        window.dispatchEvent(new CustomEvent('invoice:save', {
            detail: { print: shouldPrint }
        }));
    };

    return (
        <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', maxWidth: '960px', margin: '0 auto', padding: '1.5rem 1rem' }}>
            <Head title={isEditMode ? `Edit ${t('invoice', 'Invoice')}` : `New ${t('invoice', 'Invoice')}`} />

            {/* ── AI Prefill Notice ── */}
            {aiPrefillNotice && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem 1rem', marginBottom: '1rem',
                    background: 'var(--accent-alpha-10)', border: '1px solid var(--accent-alpha-30)',
                    borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--accent)',
                }}>
                    <CheckCircle2 size={16} />
                    <span>
                        AI Scan filled <strong>{aiPrefillNotice.count}</strong> line{aiPrefillNotice.count !== 1 ? 's' : ''}
                        {aiPrefillNotice.party ? ` for ${aiPrefillNotice.party}` : ''}.
                        Review and save.
                    </span>
                </div>
            )}

            {/* ── Page header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => history.back()}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '0.4rem',
                        borderRadius: 'var(--radius-sm)', display: 'flex',
                    }}
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                    {isEditMode
                        ? `Edit ${t('invoice', 'Invoice')} — ${invoice.invoiceNumber}`
                        : `New ${t('invoice', 'Invoice')}`}
                </h1>
                {isPosted && (
                    <span style={{
                        fontSize: '0.75rem', padding: '3px 10px', borderRadius: '999px',
                        background: 'var(--success-alpha-15)', color: 'var(--success)',
                        fontWeight: 600, letterSpacing: '0.03em',
                    }}>POSTED</span>
                )}
            </div>

            {/* ── Header row: Date / Customer / Payment ── */}
            <div style={{
                display: 'grid', gridTemplateColumns: '160px 1fr 200px',
                gap: '0.75rem', marginBottom: '1.25rem',
            }}>
                {/* Date */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Date
                    </label>
                    <input
                        type="date"
                        value={invoice?.date || ''}
                        disabled={isPosted}
                        onChange={e => patch({ date: e.target.value })}
                        style={{
                            width: '100%', padding: '0.4rem 0.6rem',
                            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                            background: 'var(--surface-2)', color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                        }}
                    />
                </div>

                {/* Customer */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        {customerLabel}
                        {customerError && <span style={{ color: 'var(--danger)', marginLeft: '0.4rem' }}>Required</span>}
                    </label>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.4rem 0.75rem',
                        border: `1px solid ${customerError ? 'var(--danger)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-2)',
                        fontSize: '0.875rem', color: invoice?.customer ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}>
                        <User size={14} />
                        <span>{invoice?.customer?.name || `Select ${customerLabel}…`}</span>
                    </div>
                </div>

                {/* Payment method */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                        Payment
                    </label>
                    <div style={{ display: 'flex', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        {['cash', 'credit', 'bank'].map(method => (
                            <button
                                key={method}
                                disabled={isPosted}
                                onClick={() => patch({ paymentMethod: method })}
                                style={{
                                    flex: 1, padding: '0.4rem',
                                    border: 'none', cursor: isPosted ? 'default' : 'pointer',
                                    background: invoice?.paymentMethod === method ? 'var(--accent)' : 'var(--surface-2)',
                                    color: invoice?.paymentMethod === method ? '#fff' : 'var(--text-muted)',
                                    fontSize: '0.75rem', fontWeight: 600,
                                    textTransform: 'capitalize',
                                    transition: 'background 0.15s, color 0.15s',
                                }}
                            >
                                {method === 'cash' ? '💵' : method === 'credit' ? '📒' : '🏦'} {method}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Line table ── */}
            <div style={{
                border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                overflow: 'hidden', marginBottom: '1rem',
            }}>
                {/* Column headers */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 110px 90px 36px',
                    gap: '0.5rem', padding: '0.5rem 0.75rem',
                    background: 'var(--surface-3)',
                    fontSize: '0.7rem', fontWeight: 700,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                    <span>Item</span>
                    <span style={{ textAlign: 'right' }}>Qty</span>
                    <span style={{ textAlign: 'right' }}>Price</span>
                    <span style={{ textAlign: 'right' }}>Disc.</span>
                    <span />
                </div>

                <div style={{ padding: '0.5rem' }}>
                    {/* Goods section */}
                    {goodsLines.length > 0 && (
                        <>
                            <SectionHeader icon={Package} label="Goods" subtotal={
                                goodsLines.reduce((s, i) => s + i.quantity * i.price, 0)
                            } symbol={currencySymbol} />
                            <div style={{ marginTop: '0.35rem', marginBottom: '0.5rem' }}>
                                {goodsLines.map((item, idx) => (
                                    <LineRow
                                        key={item.id}
                                        item={item}
                                        features={features}
                                        onUpdate={updateLine}
                                        onRemove={removeLine}
                                        isPosted={isPosted}
                                        currencySymbol={currencySymbol}
                                        isInvalid={invalidLines.includes(idx)}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Services section — only shown when there are service lines */}
                    {serviceLines.length > 0 && (
                        <>
                            <SectionHeader icon={Briefcase} label={tp('service', 'Service', true)} subtotal={
                                serviceLines.reduce((s, i) => s + i.quantity * i.price, 0)
                            } symbol={currencySymbol} />
                            <div style={{ marginTop: '0.35rem', marginBottom: '0.5rem' }}>
                                {serviceLines.map((item) => (
                                    <LineRow
                                        key={item.id}
                                        item={item}
                                        features={features}
                                        onUpdate={updateLine}
                                        onRemove={removeLine}
                                        isPosted={isPosted}
                                        currencySymbol={currencySymbol}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Add line button */}
                    {!isPosted && (
                        <button
                            onClick={addLine}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.4rem 0.75rem', marginTop: '0.25rem',
                                background: 'none', border: '1px dashed var(--border)',
                                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600,
                                transition: 'background 0.15s, border-color 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-alpha-10)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                            <Plus size={13} /> Add line
                        </button>
                    )}
                </div>
            </div>

            {/* ── Totals panel ── */}
            <div style={{
                display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem',
            }}>
                <div style={{
                    width: '280px',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                }}>
                    {[
                        { label: 'Subtotal', value: totals.subtotal },
                        totals.itemDiscounts > 0 && { label: 'Item Discounts', value: -totals.itemDiscounts },
                        totals.invoiceDiscount > 0 && { label: 'Invoice Discount', value: -totals.invoiceDiscount },
                        totals.taxAmount > 0 && { label: `Tax (${invoice?.tax}%)`, value: totals.taxAmount },
                        totals.deliveryCharge > 0 && { label: 'Delivery', value: totals.deliveryCharge },
                        totals.extraCharge > 0 && { label: 'Extra Charge', value: totals.extraCharge },
                    ].filter(Boolean).map(({ label, value }) => (
                        <div key={label} style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '0.45rem 0.875rem',
                            fontSize: '0.8rem', color: 'var(--text-secondary)',
                            borderBottom: '1px solid var(--border)',
                        }}>
                            <span>{label}</span>
                            <span style={{ color: value < 0 ? 'var(--danger)' : 'inherit' }}>
                                {value < 0 ? `-${currencySymbol}${Math.abs(value).toFixed(2)}` : `${currencySymbol}${value.toFixed(2)}`}
                            </span>
                        </div>
                    ))}

                    {/* Grand total */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '0.65rem 0.875rem',
                        background: 'var(--surface-2)',
                        fontWeight: 700, fontSize: '1rem',
                    }}>
                        <span>Total</span>
                        <span style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>
                            {currencySymbol}{totals.grandTotal.toFixed(2)}
                        </span>
                    </div>

                    {/* Balance due */}
                    {totals.balanceDue > 0 && (
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '0.45rem 0.875rem',
                            fontSize: '0.8rem',
                            color: 'var(--warning)', fontWeight: 600,
                        }}>
                            <span>Balance Due</span>
                            <span>{currencySymbol}{totals.balanceDue.toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Notes ── */}
            <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Notes
                </label>
                <textarea
                    rows={2}
                    disabled={isPosted}
                    value={invoice?.notes || ''}
                    onChange={e => patch({ notes: e.target.value })}
                    placeholder="Internal notes…"
                    style={{
                        width: '100%', padding: '0.5rem 0.75rem',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-2)', color: 'var(--text-primary)',
                        fontSize: '0.875rem', resize: 'vertical', fontFamily: 'inherit',
                    }}
                />
            </div>

            {/* ── Action footer ── */}
            {!isPosted && (
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={() => history.back()}
                        style={{
                            padding: '0.55rem 1.25rem',
                            background: 'var(--surface-2)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.55rem 1.25rem',
                            background: 'var(--surface-2)', border: '1px solid var(--accent)',
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600,
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-alpha-10)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    >
                        <Printer size={15} /> Save & Print
                    </button>
                    <button
                        onClick={() => handleSave(false)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.55rem 1.5rem',
                            background: 'var(--accent)', border: 'none',
                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            color: '#fff', fontSize: '0.875rem', fontWeight: 700,
                            boxShadow: '0 2px 8px var(--accent-alpha-30)',
                            transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        <Save size={15} /> {isEditMode ? 'Update' : 'Save'}
                    </button>
                </div>
            )}
        </div>
    );
}
