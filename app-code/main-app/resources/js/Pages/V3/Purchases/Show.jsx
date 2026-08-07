import { usePage, Link } from '@inertiajs/react'
import { formatCurrency, getCurrencySymbol } from '@/Utils/format';

export default function PurchaseShow({ purchase, items, journalEntry, journalLines }) {
    const { store } = usePage().props;

    return (
        <div className="p-6 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href={route('store.v3.purchases.index', { store_slug: store.slug })} className="text-gray-500 hover:text-gray-700">
                        ← Purchases
                    </Link>
                    <h1 className="text-2xl font-bold">Purchase — {purchase.invoice_number}</h1>
                </div>
                <Link
                    href={route('store.v3.purchases.return.create', { store_slug: store.slug, purchaseId: purchase.id })}
                    className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded hover:bg-red-100 font-medium"
                >
                    Return Purchase
                </Link>
            </div>

            {/* Header info */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded border">
                <div>
                    <p className="text-sm text-gray-500">Supplier</p>
                    <p className="font-medium">{purchase.supplier_name}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{purchase.purchase_date}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-lg">{formatCurrency(purchase.total, store)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="capitalize">{purchase.payment_method}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`text-sm px-2 py-1 rounded ${purchase.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {purchase.payment_status}
                    </span>
                </div>
            </div>

            {/* Items */}
            <h2 className="font-semibold mb-2">Line Items</h2>
            <table className="w-full border-collapse border border-gray-200 mb-6">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-200 px-4 py-2 text-left">Product</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">Qty</th>
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
            </table>

            {/* Journal entry — always show so user can verify posting */}
            <h2 className="font-semibold mb-2">Journal Entry</h2>
            <div className="border rounded overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-sm text-gray-500 border-b">
                    {journalEntry?.description} — {journalEntry?.entry_date}
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
                        {journalLines.map((line, i) => (
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
        </div>
    )
}
