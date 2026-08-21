import { usePage, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { formatCurrency } from '@/Utils/format';

/**
 * V3 CONSOLIDATION Phase 2 — parity with the legacy PurchasesList screen:
 * search, workflow/payment filters, and the separate status badges.
 *
 * `payment_status` and `workflow_status` are shown as TWO badges on purpose.
 * Legacy overloaded them into one column, which is what left unpaid purchases
 * stuck displaying "pending".
 */

const paymentBadge = (status) => ({
    paid: 'bg-green-100 text-green-700',
    partial: 'bg-yellow-100 text-yellow-700',
}[status] ?? 'bg-red-100 text-red-700');

const workflowBadge = (status) => ({
    received: 'bg-blue-100 text-blue-700',
    partial: 'bg-amber-100 text-amber-700',
    pending: 'bg-neutral-100 text-ink-secondary',
    cancelled: 'bg-neutral-200 text-ink-muted line-through',
}[status] ?? 'bg-neutral-100 text-ink-secondary');

export default function PurchaseIndex({ purchases, filters = {} }) {
    const { store } = usePage().props;
    const [search, setSearch] = useState(filters.search ?? '');

    const applyFilters = (patch) => {
        router.get(
            route('store.v3.purchases.index', { store_slug: store.slug }),
            { search, ...filters, ...patch },
            { preserveState: true, replace: true }
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Purchases</h1>
                <Link
                    href={route('store.v3.purchases.create', { store_slug: store.slug })}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + New Purchase
                </Link>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
                <form
                    onSubmit={(e) => { e.preventDefault(); applyFilters({}); }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Invoice #, reference or supplier…"
                        className="border rounded px-3 py-2 text-sm w-72"
                    />
                    <button type="submit" className="border px-4 py-2 rounded text-sm hover:bg-interactive-hover">
                        Search
                    </button>
                </form>

                <select
                    value={filters.workflow_status ?? ''}
                    onChange={e => applyFilters({ workflow_status: e.target.value })}
                    className="border rounded px-3 py-2 text-sm"
                >
                    <option value="">All goods statuses</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partially received</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
                </select>

                <select
                    value={filters.payment_status ?? ''}
                    onChange={e => applyFilters({ payment_status: e.target.value })}
                    className="border rounded px-3 py-2 text-sm"
                >
                    <option value="">All payment statuses</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                </select>
            </div>

            <table className="w-full border-collapse border border-line">
                <thead className="bg-sunken">
                    <tr>
                        <th className="border border-line px-4 py-2 text-left">Invoice #</th>
                        <th className="border border-line px-4 py-2 text-left">Supplier</th>
                        <th className="border border-line px-4 py-2 text-left">Date</th>
                        <th className="border border-line px-4 py-2 text-left">Due</th>
                        <th className="border border-line px-4 py-2 text-right">Total</th>
                        <th className="border border-line px-4 py-2 text-center">Goods</th>
                        <th className="border border-line px-4 py-2 text-center">Payment</th>
                        <th className="border border-line px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {purchases.data?.length === 0 && (
                        <tr>
                            <td colSpan={8} className="border border-line px-4 py-8 text-center text-ink-muted">
                                No purchases match these filters.
                            </td>
                        </tr>
                    )}

                    {purchases.data?.map(p => (
                        <tr key={p.id} className="hover:bg-interactive-hover">
                            <td className="border border-line px-4 py-2 font-mono text-sm">
                                {p.invoice_number}
                                {p.reference && (
                                    <div className="text-xs text-ink-muted font-sans">{p.reference}</div>
                                )}
                            </td>
                            <td className="border border-line px-4 py-2">{p.supplier_name}</td>
                            <td className="border border-line px-4 py-2">{p.purchase_date}</td>
                            <td className="border border-line px-4 py-2 text-sm text-ink-muted">
                                {p.due_date ?? '—'}
                            </td>
                            <td className="border border-line px-4 py-2 text-right">
                                {formatCurrency(p.total, store)}
                            </td>
                            <td className="border border-line px-4 py-2 text-center">
                                <span className={`text-xs px-2 py-1 rounded ${workflowBadge(p.workflow_status)}`}>
                                    {p.workflow_status}
                                </span>
                            </td>
                            <td className="border border-line px-4 py-2 text-center">
                                <span className={`text-xs px-2 py-1 rounded ${paymentBadge(p.payment_status)}`}>
                                    {p.payment_status}
                                </span>
                            </td>
                            <td className="border border-line px-4 py-2 text-center whitespace-nowrap">
                                <Link
                                    href={route('store.v3.purchases.show', { store_slug: store.slug, purchase: p.id })}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    View
                                </Link>
                                {['pending', 'partial'].includes(p.workflow_status) && (
                                    <>
                                        {' ·'}
                                        <Link
                                            href={route('store.v3.purchases.receive', { store_slug: store.slug, purchase: p.id })}
                                            className="text-green-600 hover:underline text-sm"
                                        >
                                            Receive
                                        </Link>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {purchases.links && (
                <div className="flex gap-1 mt-4 flex-wrap">
                    {purchases.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? '#'}
                            className={`px-3 py-1 border rounded text-sm ${
                                link.active ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-interactive-hover'
                            } ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
