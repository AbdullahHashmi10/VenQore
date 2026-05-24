import { useForm, Link, router } from '@inertiajs/react'

export default function UomConversions({ product, conversions }) {
    const { store } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        sale_uom: '',
        conversion_factor: '',
    })

    const submit = (e) => {
        e.preventDefault()
        post(route('store.v3.products.uom.store', { store_slug: store.slug, productId: product.id }), {
            onSuccess: () => reset(),
        })
    }

    const remove = (id) => {
        if (confirm('Remove this UOM conversion?')) {
            router.delete(route('store.v3.products.uom.destroy', { store_slug: store.slug, productId: product.id, id }))
        }
    }

    const baseUnit = product.base_unit ?? product.unit ?? 'PCS'

    return (
        <div className="p-6 max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href={route('store.v3.products.edit', { store_slug: store.slug, product: product.id })}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ← {product.name}
                </Link>
                <h1 className="text-2xl font-bold">UOM Conversions</h1>
            </div>

            {/* Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm text-blue-800">
                <p className="font-medium mb-1">How conversions work</p>
                <p>
                    Base unit for this product is <strong>{baseUnit}</strong>.
                    Set a conversion factor so the POS can sell in alternate units.
                </p>
                <p className="mt-1">
                    Formula: <code>base_qty = sale_qty ÷ factor</code>
                    &nbsp;— e.g. factor 1000 means 500 GRAMS deducts 0.5 {baseUnit} from stock.
                </p>
            </div>

            {/* Existing conversions */}
            {conversions.length > 0 ? (
                <table className="w-full border-collapse border border-gray-200 mb-6">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="border border-gray-200 px-4 py-2 text-left">Sale UOM</th>
                            <th className="border border-gray-200 px-4 py-2 text-left">Factor</th>
                            <th className="border border-gray-200 px-4 py-2 text-left">Example</th>
                            <th className="border border-gray-200 px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {conversions.map(c => (
                            <tr key={c.id} className="hover:bg-gray-50">
                                <td className="border border-gray-200 px-4 py-2 font-mono">
                                    {c.sale_uom}
                                </td>
                                <td className="border border-gray-200 px-4 py-2">
                                    {c.conversion_factor}
                                </td>
                                <td className="border border-gray-200 px-4 py-2 text-gray-500 text-sm">
                                    1000 {c.sale_uom} = {(1000 / c.conversion_factor).toFixed(4)} {baseUnit}
                                </td>
                                <td className="border border-gray-200 px-4 py-2 text-center">
                                    <button
                                        onClick={() => remove(c.id)}
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
                    No UOM conversions configured. Product sells in {baseUnit} only.
                </p>
            )}

            {/* Add new */}
            <div className="border rounded p-4 bg-gray-50">
                <h2 className="font-medium mb-4">Add UOM Conversion</h2>
                <form onSubmit={submit} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Sale UOM</label>
                        <input
                            type="text"
                            placeholder="e.g. GRAMS"
                            value={data.sale_uom}
                            onChange={e => setData('sale_uom', e.target.value.toUpperCase())}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.sale_uom && (
                            <p className="text-red-600 text-sm mt-1">{errors.sale_uom}</p>
                        )}
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                            Factor (1 {baseUnit} = ? sale units)
                        </label>
                        <input
                            type="number"
                            step="0.000001"
                            placeholder="e.g. 1000"
                            value={data.conversion_factor}
                            onChange={e => setData('conversion_factor', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.conversion_factor && (
                            <p className="text-red-600 text-sm mt-1">{errors.conversion_factor}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Add
                    </button>
                </form>
            </div>
        </div>
    )
}
