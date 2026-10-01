import React from 'react';
import { 
    User, 
    Phone, 
    Mail, 
    Calendar, 
    FileText, 
    Warehouse, 
    Banknote, 
    Plus, 
    Trash2, 
    CreditCard,
    DollarSign,
    Receipt
} from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';

export default function SalesReviewView({
    document,
    payload,
    isEditing,
    onChangePayload,
    store,
    warehouses = [],
    bankAccounts = []
}) {
    const isReturn = document.document_type === 'sales_return';
    const isProposal = document.document_type === 'proposal';
    const items = payload.items || [];

    const handleFieldChange = (key, val) => {
        onChangePayload({
            ...payload,
            [key]: val
        });
    };

    const handleItemChange = (index, field, val) => {
        const nextItems = [...items];
        const updatedItem = { ...nextItems[index], [field]: val };
        
        const qty = parseFloat(field === 'quantity' ? val : updatedItem.quantity) || 0;
        const rate = parseFloat(field === 'unit_price' || field === 'rate' || field === 'price' ? val : (updatedItem.unit_price ?? updatedItem.rate ?? updatedItem.price ?? 0)) || 0;
        const disc = parseFloat(field === 'discount' ? val : (updatedItem.discount || 0)) || 0;
        const discType = updatedItem.discount_type || 'fixed';
        
        const lineBase = qty * rate;
        const discAmt = discType === 'percent' ? (lineBase * disc) / 100 : disc;
        updatedItem.total = Math.max(0, lineBase - discAmt);
        
        nextItems[index] = updatedItem;

        const newSubtotal = nextItems.reduce((acc, it) => acc + (parseFloat(it.total) || 0), 0);
        const delivery = parseFloat(payload.delivery_charge || payload.shipping || 0) || 0;
        const extra = parseFloat(payload.extra_charge_value || 0) || 0;
        const tax = parseFloat(payload.tax_total || payload.tax || 0) || 0;
        const newGrandTotal = newSubtotal + delivery + extra + tax;

        onChangePayload({
            ...payload,
            items: nextItems,
            subtotal: newSubtotal,
            grand_total: newGrandTotal,
            total_amount: newGrandTotal,
            amount: newGrandTotal
        });
    };

    const handleDeleteItem = (index) => {
        if (items.length <= 1) return;
        const nextItems = items.filter((_, i) => i !== index);
        const newSubtotal = nextItems.reduce((acc, it) => acc + (parseFloat(it.total) || 0), 0);
        const delivery = parseFloat(payload.delivery_charge || payload.shipping || 0) || 0;
        const extra = parseFloat(payload.extra_charge_value || 0) || 0;
        const tax = parseFloat(payload.tax_total || payload.tax || 0) || 0;
        const newGrandTotal = newSubtotal + delivery + extra + tax;

        onChangePayload({
            ...payload,
            items: nextItems,
            subtotal: newSubtotal,
            grand_total: newGrandTotal,
            total_amount: newGrandTotal,
            amount: newGrandTotal
        });
    };

    const handleAddItem = () => {
        const newItem = {
            id: `new-${Date.now()}`,
            product_name: 'Custom Product / Item',
            quantity: 1,
            unit_price: 0,
            rate: 0,
            discount: 0,
            total: 0
        };
        const nextItems = [...items, newItem];
        onChangePayload({
            ...payload,
            items: nextItems
        });
    };

    const customerName = payload.customer_name || payload.party_name || 'Walk-in Customer';
    const customerPhone = payload.party_phone || payload.phone || null;
    const customerEmail = payload.party_email || payload.email || null;
    const customerBalance = parseFloat(payload.party_balance ?? 0);

    const subtotal = parseFloat(payload.subtotal ?? payload.items?.reduce((s, it) => s + (parseFloat(it.total) || 0), 0) ?? 0);
    const taxTotal = parseFloat(payload.tax_total ?? payload.tax ?? 0);
    const deliveryCharge = parseFloat(payload.delivery_charge ?? payload.shipping ?? 0);
    const extraCharge = parseFloat(payload.extra_charge_value ?? 0);
    const grandTotal = parseFloat(payload.grand_total ?? payload.total_amount ?? payload.amount ?? document.amount ?? 0);
    const amountPaid = parseFloat(payload.paid_amount ?? payload.amount_paid ?? payload.settlement_amount ?? 0);
    const balanceRemaining = Math.max(0, grandTotal - amountPaid);

    return (
        <div className="space-y-4">
            {/* Top Zone: Party & Document Metadata */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Customer Profile Card (Span 7) */}
                <div className="lg:col-span-7 p-4 rounded-xl bg-surface border border-line shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base shrink-0 border border-emerald-500/20">
                                {customerName[0]?.toUpperCase() || 'C'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm sm:text-base font-bold text-ink">
                                        {customerName}
                                    </h2>
                                    <span className="text-3xs uppercase font-bold px-1.5 py-0.5 rounded bg-sunken text-ink-muted">
                                        Customer
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-2xs text-ink-muted">
                                    {customerPhone && (
                                        <span className="flex items-center gap-1 font-mono">
                                            <Phone size={11} /> {customerPhone}
                                        </span>
                                    )}
                                    {customerEmail && (
                                        <span className="flex items-center gap-1">
                                            <Mail size={11} /> {customerEmail}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Balance Badge */}
                        <div className="text-right shrink-0">
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">Customer Balance</span>
                            <span className={`text-xs sm:text-sm font-bold tabular-nums px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                                customerBalance > 0 
                                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20' 
                                    : customerBalance < 0 
                                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                        : 'bg-sunken text-ink-muted'
                            }`}>
                                {formatCurrency(customerBalance, store)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metadata Card (Span 5) */}
                <div className="lg:col-span-5 p-4 rounded-xl bg-surface border border-line shadow-xs grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <span className="text-3xs font-semibold text-ink-muted uppercase block">Invoice Date</span>
                        {isEditing ? (
                            <input
                                type="date"
                                value={payload.sale_date || payload.date || ''}
                                onChange={(e) => handleFieldChange('sale_date', e.target.value)}
                                className="w-full mt-1 px-2 py-1 text-xs rounded border border-line bg-surface text-ink font-mono"
                            />
                        ) : (
                            <span className="font-semibold text-ink flex items-center gap-1 mt-0.5 tabular-nums">
                                <Calendar size={12} className="text-ink-muted" />
                                {payload.sale_date || payload.date || new Date().toLocaleDateString('en-PK')}
                            </span>
                        )}
                    </div>

                    <div>
                        <span className="text-3xs font-semibold text-ink-muted uppercase block">Reference #</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={payload.reference || ''}
                                onChange={(e) => handleFieldChange('reference', e.target.value)}
                                placeholder="Ref #"
                                className="w-full mt-1 px-2 py-1 text-xs rounded border border-line bg-surface text-ink font-mono"
                            />
                        ) : (
                            <span className="font-semibold text-ink flex items-center gap-1 mt-0.5 font-mono">
                                <FileText size={12} className="text-ink-muted" />
                                {payload.reference || '—'}
                            </span>
                        )}
                    </div>

                    <div>
                        <span className="text-3xs font-semibold text-ink-muted uppercase block">Warehouse</span>
                        <span className="font-semibold text-ink flex items-center gap-1 mt-0.5">
                            <Warehouse size={12} className="text-ink-muted" />
                            {payload.warehouse_name || 'Main Warehouse'}
                        </span>
                    </div>

                    <div>
                        <span className="text-3xs font-semibold text-ink-muted uppercase block">Payment Status</span>
                        <span className="font-semibold text-ink uppercase tracking-wide mt-0.5 block">
                            {balanceRemaining === 0 ? 'Fully Paid' : 'Credit / Part Paid'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Document Line Items Table */}
            <div className="rounded-xl bg-surface border border-line shadow-xs overflow-hidden">
                <div className="px-4 py-2.5 border-b border-line bg-sunken/40 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
                        <span>Line Items</span>
                        <span className="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-sunken text-ink">
                            {items.length}
                        </span>
                    </h3>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleAddItem}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-2xs font-bold bg-primary-600 hover:bg-primary-700 text-white transition-colors"
                        >
                            <Plus size={11} /> Add Item
                        </button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-sunken/60 text-3xs uppercase font-bold text-ink-muted border-b border-line">
                            <tr>
                                <th className="px-3 py-2 w-8 text-center">#</th>
                                <th className="px-3 py-2">Item Description</th>
                                <th className="px-3 py-2 text-right w-24">Qty</th>
                                <th className="px-3 py-2 text-right w-28">Price</th>
                                <th className="px-3 py-2 text-right w-24">Disc</th>
                                <th className="px-3 py-2 text-right w-32">Total</th>
                                {isEditing && <th className="px-2 py-2 w-10 text-center"></th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={isEditing ? 7 : 6} className="px-4 py-6 text-center text-xs text-ink-muted italic">
                                        No line items recorded in this invoice.
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => {
                                    const itemName = item.product_name || item.name || item.item_name || 'Item';
                                    const sku = item.sku || item.barcode || null;
                                    const price = parseFloat(item.unit_price ?? item.rate ?? item.price ?? 0);
                                    const qty = parseFloat(item.quantity ?? item.qty ?? 1);
                                    const disc = parseFloat(item.discount ?? 0);
                                    const lineTotal = parseFloat(item.total ?? (qty * price - disc));

                                    return (
                                        <tr key={item.id || idx} className="hover:bg-interactive-hover/40 transition-colors">
                                            <td className="px-3 py-2.5 text-center text-ink-muted font-mono text-3xs">
                                                {idx + 1}
                                            </td>
                                            <td className="px-3 py-2.5">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={item.product_name || item.name || ''}
                                                        onChange={(e) => handleItemChange(idx, 'product_name', e.target.value)}
                                                        className="w-full px-2 py-1 text-xs rounded border border-line bg-surface text-ink font-semibold"
                                                    />
                                                ) : (
                                                    <div>
                                                        <span className="font-bold text-ink block">{itemName}</span>
                                                        {sku && <span className="text-3xs font-mono text-ink-muted">SKU: {sku}</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-right tabular-nums">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={qty}
                                                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                                                        className="w-20 px-2 py-1 text-xs rounded border border-line bg-surface text-ink text-right font-mono"
                                                    />
                                                ) : (
                                                    <span className="font-semibold text-ink">{qty}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-right tabular-nums">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={price}
                                                        onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                                                        className="w-24 px-2 py-1 text-xs rounded border border-line bg-surface text-ink text-right font-mono"
                                                    />
                                                ) : (
                                                    <span className="font-semibold text-ink">{formatCurrency(price, store)}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-right tabular-nums text-ink-muted">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        value={disc}
                                                        onChange={(e) => handleItemChange(idx, 'discount', e.target.value)}
                                                        className="w-20 px-2 py-1 text-xs rounded border border-line bg-surface text-ink text-right font-mono"
                                                    />
                                                ) : (
                                                    <span>{disc > 0 ? formatCurrency(disc, store) : '—'}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-right tabular-nums font-bold text-ink">
                                                {formatCurrency(lineTotal, store)}
                                            </td>
                                            {isEditing && (
                                                <td className="px-2 py-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteItem(idx)}
                                                        className="text-ink-muted hover:text-rose-600 transition-colors p-1"
                                                        title="Remove Line"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Bottom Section: Settlement & Totals Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                {/* Settlement Info (Span 7) */}
                <div className="lg:col-span-7 p-4 rounded-xl bg-surface border border-line shadow-xs space-y-3">
                    <h4 className="text-3xs uppercase font-bold text-ink-muted tracking-wider">Settlement & Payment</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-sunken/60 border border-line">
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">Payment Method</span>
                            <span className="font-bold text-ink capitalize flex items-center gap-1.5 mt-0.5">
                                <Banknote size={13} className="text-emerald-600" />
                                {payload.payment_method || payload.paymentMethod || 'Cash'}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-sunken/60 border border-line">
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">Amount Received</span>
                            <span className="font-bold text-ink tabular-nums mt-0.5 block">
                                {formatCurrency(amountPaid, store)}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-sunken/60 border border-line">
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">Remaining Balance</span>
                            <span className={`font-bold tabular-nums mt-0.5 block ${balanceRemaining > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}`}>
                                {formatCurrency(balanceRemaining, store)}
                            </span>
                        </div>
                        {(payload.payment_method === 'cheque' || payload.paymentMethod === 'cheque') && (
                            <>
                                <div className="p-2.5 rounded-lg bg-sunken/60 border border-line">
                                    <span className="text-3xs font-semibold text-ink-muted uppercase block">Cheque Number</span>
                                    <span className="font-bold font-mono text-ink mt-0.5 block">
                                        {payload.payment_reference || payload.cheque_number || '—'}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-lg bg-sunken/60 border border-line">
                                    <span className="text-3xs font-semibold text-ink-muted uppercase block">Cheque Date</span>
                                    <span className="font-bold text-ink mt-0.5 block">
                                        {payload.cheque_date || '—'}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {payload.notes && (
                        <div className="pt-2 border-t border-line/60">
                            <span className="text-3xs font-semibold text-ink-muted uppercase block">Notes:</span>
                            <p className="text-xs text-ink mt-0.5 italic">{payload.notes}</p>
                        </div>
                    )}
                </div>

                {/* Financial Summary Card (Span 5) */}
                <div className="lg:col-span-5 p-4 rounded-xl bg-surface border border-line shadow-xs space-y-2 text-xs">
                    <div className="flex items-center justify-between text-ink-muted">
                        <span>Items Subtotal:</span>
                        <span className="font-semibold text-ink tabular-nums">{formatCurrency(subtotal, store)}</span>
                    </div>

                    {deliveryCharge > 0 && (
                        <div className="flex items-center justify-between text-ink-muted">
                            <span>Delivery / Shipping:</span>
                            <span className="font-semibold text-ink tabular-nums">+{formatCurrency(deliveryCharge, store)}</span>
                        </div>
                    )}

                    {taxTotal > 0 && (
                        <div className="flex items-center justify-between text-ink-muted">
                            <span>Tax Total:</span>
                            <span className="font-semibold text-ink tabular-nums">+{formatCurrency(taxTotal, store)}</span>
                        </div>
                    )}

                    {extraCharge > 0 && (
                        <div className="flex items-center justify-between text-ink-muted">
                            <span>Packing / Extra:</span>
                            <span className="font-semibold text-ink tabular-nums">+{formatCurrency(extraCharge, store)}</span>
                        </div>
                    )}

                    <div className="pt-2 border-t border-line flex items-center justify-between">
                        <span className="text-sm font-bold text-ink">Grand Total:</span>
                        <span className="text-base sm:text-lg font-bold text-ink tabular-nums">
                            {formatCurrency(grandTotal, store)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
