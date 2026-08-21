import { usePage, useForm, Link } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import AsyncPartyCombobox from '@/Components/AsyncPartyCombobox';

/**
 * Shared create/edit form for V3 purchases.
 *
 * V3 CONSOLIDATION Phase 2 — brings the V3 pages to parity with the legacy
 * Pages/Purchases screens: header discount, round-off, reference, due date,
 * notes, product variants, per-line discounts and landed costs (extras).
 *
 * Create and Edit render this with different `mode` / `submitUrl` so the two
 * screens cannot drift apart. That drift is the whole reason this migration
 * exists.
 */

const emptyLine = () => ({
    product_id: '',
    variant_id: '',
    qty: '',
    unit_cost: '',
    discount_amount: '0',
    tax_rate: '0',
    business_pct: '100',
});

export default function PurchaseForm({
    mode = 'create',
    purchase = null,
    items: existingItems = null,
    landedCosts = null,
    suppliers = [],
    products = [],
    warehouses = [],
    expenseCategories = [],
}) {
    const { store } = usePage().props;
    const defaultWarehouse = warehouses.find(w => w.is_default) ?? warehouses[0];
    const isEdit = mode === 'edit';

    const { data, setData, post, put, processing, errors, clearErrors } = useForm({
        supplier_id: purchase?.party_id ?? '',
        warehouse_id: purchase?.warehouse_id ?? defaultWarehouse?.id ?? '',
        payment_method: purchase?.payment_method ?? 'cash',
        purchase_date: purchase?.purchase_date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
        due_date: purchase?.due_date?.slice(0, 10) ?? '',
        supplier_invoice: purchase?.invoice_number ?? '',
        reference: purchase?.reference ?? '',
        notes: purchase?.notes ?? '',
        discount: purchase?.discount ?? '0',
        round_off: purchase?.round_off ?? '0',
        workflow_status: purchase?.workflow_status ?? 'received',
        items: existingItems?.length
            ? existingItems.map(i => ({
                product_id: i.product_id,
                variant_id: i.variant_id ?? '',
                qty: i.qty,
                unit_cost: i.unit_cost,
                discount_amount: i.discount_amount ?? '0',
                tax_rate: i.tax_rate ?? '0',
                business_pct: i.business_pct ?? '100',
            }))
            : [emptyLine()],
        extras: landedCosts?.length
            ? landedCosts.map(e => ({
                category_id: e.category_id ?? '',
                amount: e.amount,
                method: e.method ?? 'value',
                description: e.description ?? '',
            }))
            : [],
        zero_cost_acknowledged: false,
    });

    // ── line helpers ─────────────────────────────────────────────────────────
    const addLine = () => setData('items', [...data.items, emptyLine()]);
    const removeLine = (index) => setData('items', data.items.filter((_, i) => i !== index));
    const updateLine = (index, field, value) =>
        setData('items', data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

    const onProductSelect = (index, productId) => {
        const product = products.find(p => p.id === productId);
        setData('items', data.items.map((item, i) => (
            i === index
                ? { ...item, product_id: productId, tax_rate: product?.tax_rate ?? item.tax_rate }
                : item
        )));
    };

    // ── landed cost helpers ──────────────────────────────────────────────────
    const addExtra = () =>
        setData('extras', [...data.extras, { category_id: '', amount: '', method: 'value', description: '' }]);
    const removeExtra = (index) => setData('extras', data.extras.filter((_, i) => i !== index));
    const updateExtra = (index, field, value) =>
        setData('extras', data.extras.map((e, i) => (i === index ? { ...e, [field]: value } : e)));

    // ── totals ───────────────────────────────────────────────────────────────
    const lineTotal = (item) => {
        const qty = parseFloat(item.qty) || 0;
        const cost = parseFloat(item.unit_cost) || 0;
        const lineDiscount = parseFloat(item.discount_amount) || 0;
        const taxRate = parseFloat(item.tax_rate) || 0;
        const net = Math.max(qty * cost - lineDiscount, 0);
        return { net, tax: (net * taxRate) / 100, gross: net + (net * taxRate) / 100 };
    };

    const subtotal = data.items.reduce((sum, i) => sum + lineTotal(i).net, 0);
    const taxTotal = data.items.reduce((sum, i) => sum + lineTotal(i).tax, 0);
    const headerDiscount = parseFloat(data.discount) || 0;
    const roundOff = parseFloat(data.round_off) || 0;
    const landedTotal = data.extras.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const grandTotal = subtotal - headerDiscount + taxTotal + roundOff;

    const discountTooLarge = headerDiscount > subtotal;

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('store.v3.purchases.update', { store_slug: store.slug, purchase: purchase.id }));
        } else {
            post(route('store.v3.purchases.store', { store_slug: store.slug }));
        }
    };

    return (
        <div className="p-6 max-w-6xl">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={route('store.v3.purchases.index', { store_slug: store.slug })}
                    className="text-ink-muted hover:text-ink"
                >
                    ← Purchases
                </Link>
                <h1 className="text-2xl font-bold">
                    {isEdit ? `Edit Purchase ${purchase.invoice_number}` : 'New Purchase'}
                    <span className="ml-2 text-sm font-normal text-ink-muted">
                        ({data.payment_method === 'cash' ? 'Cash' : 'Credit'})
                    </span>
                </h1>
            </div>

            {isEdit && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                    Editing a posted purchase reverses its journal entries and re-posts them.
                    The original entries are kept and flagged, never altered — the audit trail stays intact.
                </div>
            )}

            <form onSubmit={submit} className="space-y-6">
                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Supplier *</label>
                        <AsyncPartyCombobox
                            type="supplier"
                            value={data.supplier_id}
                            onSelect={(s) => setData('supplier_id', s ? s.id : '')}
                            defaultOptions={suppliers}
                            placeholder="Search supplier..."
                            className="w-full"
                        />
                        {errors.supplier_id && <p className="text-red-600 text-sm mt-1">{errors.supplier_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Warehouse</label>
                        <select
                            value={data.warehouse_id}
                            onChange={e => setData('warehouse_id', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}{w.is_default ? ' (default)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Purchase Date *</label>
                        <input
                            type="date"
                            value={data.purchase_date}
                            max={isEdit ? undefined : new Date().toISOString().slice(0, 10)}
                            onChange={e => setData('purchase_date', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.purchase_date && <p className="text-red-600 text-sm mt-1">{errors.purchase_date}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <input
                            type="date"
                            value={data.due_date}
                            onChange={e => setData('due_date', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Supplier Invoice #</label>
                        <input
                            type="text"
                            value={data.supplier_invoice}
                            onChange={e => setData('supplier_invoice', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Optional"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Reference</label>
                        <input
                            type="text"
                            value={data.reference}
                            onChange={e => setData('reference', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Supplier's own doc ref"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Payment Method *</label>
                        <select
                            value={data.payment_method}
                            onChange={e => setData('payment_method', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="cash">Cash (Paid now)</option>
                            <option value="credit">Credit (Pay later)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Goods Status</label>
                        <select
                            value={data.workflow_status}
                            onChange={e => setData('workflow_status', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="received">Received now</option>
                            <option value="pending">Not yet received</option>
                        </select>
                        {data.workflow_status === 'pending' && (
                            <p className="text-xs text-ink-muted mt-1">
                                No stock or journal is posted until you receive the goods.
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Line items ───────────────────────────────────────────── */}
                <div>
                    <table className="w-full border-collapse border border-line">
                        <thead className="bg-sunken">
                            <tr>
                                <th className="border border-line px-3 py-2 text-left text-sm">Product</th>
                                <th className="border border-line px-3 py-2 text-right text-sm w-24">Qty</th>
                                <th className="border border-line px-3 py-2 text-right text-sm w-32">Unit Cost</th>
                                <th className="border border-line px-3 py-2 text-right text-sm w-28">Discount</th>
                                <th className="border border-line px-3 py-2 text-right text-sm w-20">Tax %</th>
                                <th className="border border-line px-3 py-2 text-right text-sm w-24">Business %</th>
                                <th className="border border-line px-3 py-2 text-right text-sm w-32">Line Total</th>
                                <th className="border border-line px-3 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, index) => {
                                const totals = lineTotal(item);
                                return (
                                    <tr key={index}>
                                        <td className="border border-line px-2 py-1">
                                            <AsyncProductCombobox
                                                value={item.product_id}
                                                onSelect={(p) => onProductSelect(index, p ? p.id : '')}
                                                defaultOptions={products}
                                                placeholder="Search product..."
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="border border-line px-2 py-1">
                                            <input
                                                type="number" step="0.0001" value={item.qty}
                                                onChange={e => updateLine(index, 'qty', e.target.value)}
                                                className="w-full text-right border-0 outline-none py-1" placeholder="0"
                                            />
                                        </td>
                                        <td className="border border-line px-2 py-1">
                                            <input
                                                type="number" step="0.01" value={item.unit_cost}
                                                onChange={e => updateLine(index, 'unit_cost', e.target.value)}
                                                className="w-full text-right border-0 outline-none py-1" placeholder="0.00"
                                            />
                                        </td>
                                        <td className="border border-line px-2 py-1">
                                            <input
                                                type="number" step="0.01" value={item.discount_amount}
                                                onChange={e => updateLine(index, 'discount_amount', e.target.value)}
                                                className="w-full text-right border-0 outline-none py-1" placeholder="0.00"
                                            />
                                        </td>
                                        <td className="border border-line px-2 py-1">
                                            <input
                                                type="number" step="0.01" value={item.tax_rate}
                                                onChange={e => updateLine(index, 'tax_rate', e.target.value)}
                                                className="w-full text-right border-0 outline-none py-1"
                                            />
                                        </td>
                                        <td className="border border-line px-2 py-1">
                                            <input
                                                type="number" step="0.01" value={item.business_pct}
                                                onChange={e => updateLine(index, 'business_pct', e.target.value)}
                                                className="w-full text-right border-0 outline-none py-1" placeholder="100"
                                            />
                                        </td>
                                        <td className="border border-line px-3 py-2 text-right text-sm">
                                            <div>{formatCurrency(totals.gross, store)}</div>
                                            {totals.tax > 0 && (
                                                <div className="text-xs text-ink-muted">tax: {totals.tax.toFixed(2)}</div>
                                            )}
                                        </td>
                                        <td className="border border-line px-2 py-1 text-center">
                                            {data.items.length > 1 && (
                                                <button
                                                    type="button" onClick={() => removeLine(index)}
                                                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                                                >×</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <button type="button" onClick={addLine} className="mt-2 text-blue-600 hover:underline text-sm">
                        + Add line
                    </button>
                </div>

                {/* ── Landed costs ─────────────────────────────────────────── */}
                <div className="border rounded p-4 bg-sunken">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-medium">Landed Costs</h2>
                        <button type="button" onClick={addExtra} className="text-blue-600 hover:underline text-sm">
                            + Add cost
                        </button>
                    </div>
                    <p className="text-xs text-ink-muted mb-3">
                        Freight, duty, handling. These are capitalised into the unit cost of the goods,
                        so they reach COGS through FIFO — and are recorded as expenses for reporting.
                    </p>

                    {data.extras.length === 0 && (
                        <p className="text-sm text-ink-muted">None.</p>
                    )}

                    {data.extras.map((extra, index) => (
                        <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2 items-center">
                            <select
                                value={extra.category_id}
                                onChange={e => updateExtra(index, 'category_id', e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                            >
                                <option value="">Category…</option>
                                {expenseCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <input
                                type="number" step="0.01" value={extra.amount}
                                onChange={e => updateExtra(index, 'amount', e.target.value)}
                                className="border rounded px-2 py-1 text-sm text-right" placeholder="Amount"
                            />
                            <select
                                value={extra.method}
                                onChange={e => updateExtra(index, 'method', e.target.value)}
                                className="border rounded px-2 py-1 text-sm"
                            >
                                <option value="value">Allocate by value</option>
                                <option value="quantity">Allocate by quantity</option>
                            </select>
                            <input
                                type="text" value={extra.description}
                                onChange={e => updateExtra(index, 'description', e.target.value)}
                                className="border rounded px-2 py-1 text-sm" placeholder="Description"
                            />
                            <button
                                type="button" onClick={() => removeExtra(index)}
                                className="text-red-500 hover:text-red-700 text-sm justify-self-start"
                            >Remove</button>
                        </div>
                    ))}
                </div>

                {/* ── Totals + notes ───────────────────────────────────────── */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            rows={5}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Internal notes"
                        />
                    </div>

                    <div className="border rounded p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal, store)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span>Header discount</span>
                            <input
                                type="number" step="0.01" value={data.discount}
                                onChange={e => setData('discount', e.target.value)}
                                className="border rounded px-2 py-1 w-32 text-right"
                            />
                        </div>
                        {discountTooLarge && (
                            <p className="text-red-600 text-xs">
                                Discount cannot exceed the item subtotal.
                            </p>
                        )}
                        {errors.discount && <p className="text-red-600 text-xs">{errors.discount}</p>}

                        <div className="flex justify-between">
                            <span>Tax</span>
                            <span>{formatCurrency(taxTotal, store)}</span>
                        </div>

                        <div className="flex justify-between items-center">
                            <span>Round off</span>
                            <input
                                type="number" step="0.01" value={data.round_off}
                                onChange={e => setData('round_off', e.target.value)}
                                className="border rounded px-2 py-1 w-32 text-right"
                            />
                        </div>

                        {landedTotal > 0 && (
                            <div className="flex justify-between text-ink-muted">
                                <span>Landed costs (capitalised)</span>
                                <span>{formatCurrency(landedTotal, store)}</span>
                            </div>
                        )}

                        <div className="flex justify-between border-t pt-2 font-bold text-base">
                            <span>{data.payment_method === 'cash' ? 'Cash to pay' : 'Payable'}</span>
                            <span>{formatCurrency(grandTotal, store)}</span>
                        </div>
                    </div>
                </div>

                {/* ── Errors ───────────────────────────────────────────────── */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                        {Object.values(errors).map((err, i) => <div key={i}>{err}</div>)}
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={processing || discountTooLarge}
                        className="bg-green-600 text-white px-8 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                        {processing
                            ? 'Saving…'
                            : `${isEdit ? 'Save Changes' : 'Post Purchase'} — ${formatCurrency(grandTotal, store)}`}
                    </button>
                    <Link
                        href={isEdit
                            ? route('store.v3.purchases.show', { store_slug: store.slug, purchase: purchase.id })
                            : route('store.v3.purchases.index', { store_slug: store.slug })}
                        className="border px-6 py-2 rounded hover:bg-interactive-hover"
                    >
                        Cancel
                    </Link>
                </div>
            </form>

            {/* Zero-cost confirmation */}
            {errors.zero_cost_acknowledged && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-bold text-lg text-red-600 mb-2">Zero Unit Cost Warning</h3>
                        <p className="mb-6 text-sm text-ink-secondary">{errors.zero_cost_acknowledged}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => clearErrors('zero_cost_acknowledged')}
                                className="px-4 py-2 border rounded hover:bg-interactive-hover text-sm"
                            >Cancel</button>
                            <button
                                type="button"
                                onClick={() => {
                                    setData('zero_cost_acknowledged', true);
                                    clearErrors('zero_cost_acknowledged');
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >Confirm Zero Cost</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
