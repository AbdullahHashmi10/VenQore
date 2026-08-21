import { usePage, useForm, Link } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';

/**
 * V3 CONSOLIDATION Phase 2 — goods receipt.
 *
 * Ported from the legacy Pages/Purchases/Receive.jsx. Receiving is what creates
 * the FIFO batches, so the unit cost shown here is the cost that will be locked
 * into the batch and eventually reach COGS.
 *
 * Over-receipt is blocked server-side under a row lock — the client-side cap
 * below is a convenience, not the guard.
 */
export default function PurchaseReceive({ purchase, items }) {
    const { store } = usePage().props;

    const remaining = (item) => Math.max(Number(item.qty) - Number(item.received_qty ?? 0), 0);

    const { data, setData, post, processing, errors } = useForm({
        items: items.map(i => ({
            purchase_item_id: i.id,
            receiving_qty: remaining(i),
            batch_number: '',
            expiry_date: '',
        })),
        notes: '',
    });

    const updateLine = (index, field, value) =>
        setData('items', data.items.map((l, i) => (i === index ? { ...l, [field]: value } : l)));

    const receivingTotal = data.items.reduce((sum, line, index) => {
        const item = items[index];
        return sum + (parseFloat(line.receiving_qty) || 0) * Number(item.unit_cost);
    }, 0);

    const anythingToReceive = data.items.some(l => (parseFloat(l.receiving_qty) || 0) > 0);

    const submit = (e) => {
        e.preventDefault();
        post(route('store.v3.purchases.receive.store', { store_slug: store.slug, purchase: purchase.id }));
    };

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={route('store.v3.purchases.show', { store_slug: store.slug, purchase: purchase.id })}
                    className="text-ink-muted hover:text-ink"
                >
                    ← {purchase.invoice_number}
                </Link>
                <h1 className="text-2xl font-bold">Receive Goods</h1>
                <span className="px-2 py-1 rounded text-xs bg-sunken text-ink-secondary">
                    {purchase.workflow_status}
                </span>
            </div>

            <div className="mb-6 text-sm text-ink-secondary">
                Supplier: <span className="font-medium">{purchase.supplier_name}</span>
                {purchase.reference && <> · Ref {purchase.reference}</>}
            </div>

            <form onSubmit={submit} className="space-y-6">
                <table className="w-full border-collapse border border-line">
                    <thead className="bg-sunken">
                        <tr>
                            <th className="border border-line px-3 py-2 text-left text-sm">Product</th>
                            <th className="border border-line px-3 py-2 text-right text-sm w-24">Ordered</th>
                            <th className="border border-line px-3 py-2 text-right text-sm w-24">Received</th>
                            <th className="border border-line px-3 py-2 text-right text-sm w-24">Remaining</th>
                            <th className="border border-line px-3 py-2 text-right text-sm w-28">Receive now</th>
                            <th className="border border-line px-3 py-2 text-left text-sm w-36">Batch #</th>
                            <th className="border border-line px-3 py-2 text-left text-sm w-40">Expiry</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const rem = remaining(item);
                            return (
                                <tr key={item.id} className={rem === 0 ? 'bg-sunken text-ink-muted' : ''}>
                                    <td className="border border-line px-3 py-2 text-sm">
                                        <div>{item.product_name}</div>
                                        <div className="text-xs text-ink-muted">
                                            {item.sku} · {formatCurrency(item.unit_cost, store)}/{item.base_unit}
                                        </div>
                                    </td>
                                    <td className="border border-line px-3 py-2 text-right text-sm">{item.qty}</td>
                                    <td className="border border-line px-3 py-2 text-right text-sm">{item.received_qty ?? 0}</td>
                                    <td className="border border-line px-3 py-2 text-right text-sm font-medium">{rem}</td>
                                    <td className="border border-line px-2 py-1">
                                        <input
                                            type="number" step="0.0001" min="0" max={rem}
                                            disabled={rem === 0}
                                            value={data.items[index].receiving_qty}
                                            onChange={e => updateLine(index, 'receiving_qty', e.target.value)}
                                            className="w-full text-right border-0 outline-none py-1 disabled:bg-transparent"
                                        />
                                    </td>
                                    <td className="border border-line px-2 py-1">
                                        <input
                                            type="text" disabled={rem === 0}
                                            value={data.items[index].batch_number}
                                            onChange={e => updateLine(index, 'batch_number', e.target.value)}
                                            className="w-full border-0 outline-none py-1 disabled:bg-transparent"
                                            placeholder="Optional"
                                        />
                                    </td>
                                    <td className="border border-line px-2 py-1">
                                        <input
                                            type="date" disabled={rem === 0}
                                            value={data.items[index].expiry_date}
                                            onChange={e => updateLine(index, 'expiry_date', e.target.value)}
                                            className="w-full border-0 outline-none py-1 disabled:bg-transparent"
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={4} className="px-3 py-2 text-right font-medium">Value being received:</td>
                            <td colSpan={3} className="border border-line px-3 py-2 font-bold">
                                {formatCurrency(receivingTotal, store)}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <div>
                    <label className="block text-sm font-medium mb-1">Receipt notes</label>
                    <textarea
                        value={data.notes}
                        onChange={e => setData('notes', e.target.value)}
                        rows={3}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Condition on arrival, short shipment, damage…"
                    />
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                        {Object.values(errors).map((err, i) => <div key={i}>{err}</div>)}
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={processing || !anythingToReceive}
                        className="bg-green-600 text-white px-8 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                        {processing ? 'Receiving…' : 'Receive Goods'}
                    </button>
                    <Link
                        href={route('store.v3.purchases.show', { store_slug: store.slug, purchase: purchase.id })}
                        className="border px-6 py-2 rounded hover:bg-interactive-hover"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
