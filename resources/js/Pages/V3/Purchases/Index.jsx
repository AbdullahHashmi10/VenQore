import { usePage, Link } from '@inertiajs/react'
import { formatCurrency } from '@/Utils/format';

export default function PurchaseIndex({ purchases }) {
    const { store } = usePage().props;

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

            <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-200 px-4 py-2 text-left">Invoice #</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Supplier</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">Total</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Method</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Status</th>
                        <th className="border border-gray-200 px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {purchases.data?.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                                {p.invoice_number}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">{p.supplier_name}</td>
                            <td className="border border-gray-200 px-4 py-2">{p.purchase_date}</td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                                {formatCurrency(p.total, store)}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center text-sm capitalize">
                                {p.payment_method}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                                <span className={`text-xs px-2 py-1 rounded ${p.payment_status === 'paid'
                                        ? 'bg-green-100 text-green-700'
                                        : p.payment_status === 'partial'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                    {p.payment_status}
                                </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                                <Link
                                    href={route('store.v3.purchases.show', { store_slug: store.slug, purchase: p.id })}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    View
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
