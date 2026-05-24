import { useForm, Link, router } from '@inertiajs/react'

export default function PriceTiers({ product, tiers }) {
    const { store } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        min_qty: '',
        max_qty: '',
        unit_price: '',
    })

    const submit = (e) => {
        e.preventDefault()
        post(route('store.v3.products.tiers.store', { store_slug: store.slug, productId: product.id }), {
            onSuccess: () => reset(),
        })
    }

    const remove = (id) => {
        if (confirm('Remove this price tier?')) {
            router.delete(route('store.v3.products.tiers.destroy', { store_slug: store.slug, productId: product.id, id }))
        }
    }

    return (
        <div className="p-6 max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={route('store.v3.products.edit', { store_slug: store.slug, product: product.id })}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ← {product.name}
                </Link>
                <h1 className="text-2xl font-bold">Price Tiers</h1>
            </div>

            {/* Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm text-blue-800">
                <p className="font-medium mb-1">How tiered pricing works (S-042)</p>
                <p>
                    When a sale spans multiple tiers, the POS calculates a blended average
                    unit price. Each tier covers a quantity range. Ranges must not overlap.
                    Leave Max Qty blank for an open-ended top tier.
                </p>
            </div>

            {/* Existing tiers */}
            {tiers.length > 0 ? (
                <table className="w-full border-collapse border border-gray-200 mb-6">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="border border-gray-200 px-4 py-2 text-left">Min Qty</th>
                            <th className="border border-gray-200 px-4 py-2 text-left">Max Qty</th>
                            <th className="border border-gray-200 px-4 py-2 text-right">Unit Price</th>
                            <th className="border border-gray-200 px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tiers.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50">
                                <td className="border border-gray-200 px-4 py-2">{t.min_qty}</td>
                                <td className="border border-gray-200 px-4 py-2">
                                    {t.max_qty ?? <span className="text-gray-400">∞ (no limit)</span>}
                                </td>
                                <td className="border border-gray-200 px-4 py-2 text-right">
                                    {window.amdSettings?.currency_symbol || ''} {parseFloat(t.unit_price).toLocaleString()}
                                </td>
                                <td className="border border-gray-200 px-4 py-2 text-center">
                                    <button
                                        onClick={() => remove(t.id)}
                                        className="text-red-600 hover:underline text-sm"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="text-gray-500 text-sm mb-6">
                    No price tiers configured. Product uses flat sale price.
                </p>
            )}

            {/* Add new */}
            <div className="border rounded p-4 bg-gray-50">
                <h2 className="font-medium mb-4">Add Price Tier</h2>
                <form onSubmit={submit}>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Min Qty *</label>
                            <input
                                type="number"
                                step="0.0001"
                                placeholder="e.g. 1"
                                value={data.min_qty}
                                onChange={e => setData('min_qty', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                            {errors.min_qty && (
                                <p className="text-red-600 text-sm mt-1">{errors.min_qty}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Max Qty <span className="text-gray-400">(blank = no limit)</span>
                            </label>
                            <input
                                type="number"
                                step="0.0001"
                                placeholder="e.g. 50"
                                value={data.max_qty}
                                onChange={e => setData('max_qty', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                            {errors.max_qty && (
                                <p className="text-red-600 text-sm mt-1">{errors.max_qty}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Unit Price *</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="e.g. 95.00"
                                value={data.unit_price}
                                onChange={e => setData('unit_price', e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                            {errors.unit_price && (
                                <p className="text-red-600 text-sm mt-1">{errors.unit_price}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Adding...' : 'Add Tier'}
                    </button>
                </form>
            </div>
        </div>
    )
}
