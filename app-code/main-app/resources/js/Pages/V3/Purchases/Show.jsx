import { usePage, Link, router } from '@inertiajs/react';
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';

/**
 * V3 CONSOLIDATION Phase 2 — parity with the legacy Purchases/Show screen.
 *
 * Adds: edit / receive / void actions, landed costs, returns, derived paid
 * amount, and the FULL journal history including reversals.
 *
 * The journal section shows every entry the document ever raised — original,
 * reversal and payment — because "which entries are live?" is exactly the
 * question an editable posted document has to be able to answer.
 */

const paymentBadge = (status) => ({
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
}[status] ?? 'bg-red-100 text-red-700');

const workflowBadge = (status) => ({
    received: 'bg-blue-100 text-blue-700',
    partial: 'bg-amber-100 text-amber-700',
    pending: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-gray-200 text-gray-500',
}[status] ?? 'bg-gray-100 text-gray-600');

export default function PurchaseShow({
    purchase,
    items,
    journalEntries = [],
    journalLines = [],
    landedCosts = [],
    returns = [],
    paidAmount = 0,
}) {
    const { store } = usePage().props;
    const isCancelled = purchase.workflow_status === 'cancelled';
    const canReceive = ['pending', 'partial'].includes(purchase.workflow_status);
    const outstanding = Number(purchase.total) - Number(paidAmount);

    const linesFor = (entryId) => journalLines.filter(l => l.journal_entry_id === entryId);

    const voidPurchase = () => {
        const reason = window.prompt(
            'Voiding reverses this purchase\'s journal entries and releases its stock batches.\n\n' +
            'The record is kept, never deleted. Reason (optional):'
        );
        if (reason === null) return;

        router.delete(
            route('store.v3.purchases.destroy', { store_slug: store.slug, purchase: purchase.id }),
            { data: { reason } }
        );
    };

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('store.v3.purchases.index', { store_slug: store.slug })}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ← Purchases
                    </Link>
                    <h1 className="text-2xl font-bold">Purchase — {purchase.invoice_number}</h1>
                </div>

                <div className="flex gap-2">
                    {canReceive && !isCancelled && (
                        <Link
                            href={route('store.v3.purchases.receive', { store_slug: store.slug, purchase: purchase.id })}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-medium"
                        >
                            Receive Goods
                        </Link>
                    )}
                    {!isCancelled && (
                        <Link
                            href={route('store.v3.purchases.edit', { store_slug: store.slug, purchase: purchase.id })}
                            className="border px-4 py-2 rounded hover:bg-gray-50 font-medium"
                        >
                            Edit
                        </Link>
                    )}
                    {!isCancelled && (
                        <Link
                            href={route('store.v3.purchases.return.create', { store_slug: store.slug, purchaseId: purchase.id })}
                            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 font-medium"
                        >
                            Return
                        </Link>
                    )}
                    {!isCancelled && (
                        <button
                            type="button"
                            onClick={voidPurchase}
                            className="border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-100 font-medium"
                        >
                            Void
                        </button>
                    )}
                </div>
            </div>

            {isCancelled && (
                <div className="mb-6 bg-gray-100 border border-gray-300 rounded p-3 text-sm text-gray-700">
                    <strong>This purchase is voided.</strong> Its journal entries have been reversed and its
                    stock batches released. The record is retained for the audit trail.
                </div>
            )}

            {/* Header info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded border">
                <div>
                    <p className="text-sm text-gray-500">Supplier</p>
                    <p className="font-medium">{purchase.supplier_name}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{purchase.purchase_date}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Due</p>
                    <p className="font-medium">{purchase.due_date ?? '—'}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="font-medium">{purchase.reference ?? '—'}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-lg">{formatCurrency(purchase.total, store)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Paid <span className="text-xs">(from ledger)</span></p>
                    <p className="font-medium">{formatCurrency(paidAmount, store)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Outstanding</p>
                    <p className={`font-medium ${outstanding > 0.01 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(outstanding, store)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex gap-1 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded ${workflowBadge(purchase.workflow_status)}`}>
                            {purchase.workflow_status}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${paymentBadge(purchase.payment_status)}`}>
                            {purchase.payment_status}
                        </span>
                    </div>
                </div>
            </div>

            {purchase.notes && (
                <div className="mb-6 text-sm">
                    <p className="text-gray-500 mb-1">Notes</p>
                    <p className="whitespace-pre-wrap border rounded p-3 bg-white">{purchase.notes}</p>
                </div>
            )}

            {/* Items */}
            <h2 className="font-semibold mb-2">Line Items</h2>
            <table className="w-full border-collapse border border-gray-200 mb-6">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-200 px-4 py-2 text-left">Product</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">Qty</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">Received</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">Unit Cost</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">Tax</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">Line Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map(item => (
                        <tr key={item.id}>
                            <td className="border border-gray-200 px-4 py-2">
                                {item.product_name}
                                <span className="text-gray-400 text-xs ml-2">{item.sku}</span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                                {item.qty} {item.base_unit}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right text-sm">
                                {item.received_qty ?? 0}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                                {getCurrencySymbol(store)} {parseFloat(item.unit_cost).toFixed(4)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right text-sm">
                                {item.tax_rate}%
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right font-medium">
                                {formatCurrency(item.line_total, store)}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-gray-50 text-sm">
                    <tr>
                        <td colSpan={5} className="border border-gray-200 px-4 py-1 text-right">Subtotal</td>
                        <td className="border border-gray-200 px-4 py-1 text-right">{formatCurrency(purchase.subtotal, store)}</td>
                    </tr>
                    {Number(purchase.discount) > 0 && (
                        <tr>
                            <td colSpan={5} className="border border-gray-200 px-4 py-1 text-right">Discount</td>
                            <td className="border border-gray-200 px-4 py-1 text-right">−{formatCurrency(purchase.discount, store)}</td>
                        </tr>
                    )}
                    <tr>
                        <td colSpan={5} className="border border-gray-200 px-4 py-1 text-right">Tax</td>
                        <td className="border border-gray-200 px-4 py-1 text-right">{formatCurrency(purchase.tax, store)}</td>
                    </tr>
                    {Number(purchase.round_off) !== 0 && (
                        <tr>
                            <td colSpan={5} className="border border-gray-200 px-4 py-1 text-right">Round off</td>
                            <td className="border border-gray-200 px-4 py-1 text-right">{formatCurrency(purchase.round_off, store)}</td>
                        </tr>
                    )}
                </tfoot>
            </table>

            {/* Landed costs */}
            {landedCosts.length > 0 && (
                <>
                    <h2 className="font-semibold mb-2">Landed Costs</h2>
                    <p className="text-xs text-gray-500 mb-2">
                        Capitalised into the unit cost of the goods above, so they reach COGS through FIFO.
                    </p>
                    <table className="w-full border-collapse border border-gray-200 mb-6 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="border border-gray-200 px-4 py-2 text-left">Category</th>
                                <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                                <th className="border border-gray-200 px-4 py-2 text-left">Allocation</th>
                                <th className="border border-gray-200 px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {landedCosts.map(cost => (
                                <tr key={cost.id}>
                                    <td className="border border-gray-200 px-4 py-2">{cost.category}</td>
                                    <td className="border border-gray-200 px-4 py-2 text-gray-500">{cost.description}</td>
                                    <td className="border border-gray-200 px-4 py-2 capitalize">{cost.allocation_method}</td>
                                    <td className="border border-gray-200 px-4 py-2 text-right">
                                        {formatCurrency(cost.amount, store)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Returns */}
            {returns.length > 0 && (
                <>
                    <h2 className="font-semibold mb-2">Returns</h2>
                    <table className="w-full border-collapse border border-gray-200 mb-6 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                                <th className="border border-gray-200 px-4 py-2 text-left">Reason</th>
                                <th className="border border-gray-200 px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returns.map(r => (
                                <tr key={r.id}>
                                    <td className="border border-gray-200 px-4 py-2">{r.return_date}</td>
                                    <td className="border border-gray-200 px-4 py-2">{r.reason}</td>
                                    <td className="border border-gray-200 px-4 py-2 text-right">
                                        {formatCurrency(r.total_amount, store)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}

            {/* Journal history */}
            <h2 className="font-semibold mb-2">Journal History</h2>
            {journalEntries.length === 0 && (
                <p className="text-sm text-gray-400 border rounded p-4">
                    No journal entries yet. This purchase posts to the ledger when the goods are received.
                </p>
            )}

            <div className="space-y-4">
                {journalEntries.map(entry => (
                    <div
                        key={entry.id}
                        className={`border rounded overflow-hidden ${
                            Number(entry.is_reversed) === 1 ? 'opacity-60' : ''
                        }`}
                    >
                        <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 border-b flex justify-between items-center gap-3">
                            <span>{entry.description} — {entry.entry_date}</span>
                            <span className="flex gap-2 shrink-0">
                                <span className="text-xs px-2 py-1 rounded bg-white border capitalize">
                                    {String(entry.reference_type).replace('_', ' ')}
                                </span>
                                {Number(entry.is_reversed) === 1 && (
                                    <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600">
                                        reversed
                                    </span>
                                )}
                            </span>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 text-sm">
                                    <th className="px-4 py-2 text-left">Account</th>
                                    <th className="px-4 py-2 text-right">Debit</th>
                                    <th className="px-4 py-2 text-right">Credit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {linesFor(entry.id).map((line, i) => (
                                    <tr key={i} className="border-t">
                                        <td className="px-4 py-2 text-sm">
                                            <span className="font-mono text-gray-400 mr-2">{line.code}</span>
                                            {line.account_name}
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm">
                                            {parseFloat(line.debit) > 0
                                                ? `${getCurrencySymbol(store)} ${parseFloat(line.debit).toFixed(2)}`
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm">
                                            {parseFloat(line.credit) > 0
                                                ? `${getCurrencySymbol(store)} ${parseFloat(line.credit).toFixed(2)}`
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </div>
    );
}
