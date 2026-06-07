import { useForm, Link, usePage } from '@inertiajs/react'

export default function ProductCreate() {
    const { store } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        sku: '',
        base_unit: 'PCS',
        sale_price: '',
        tax_rate: '0',
        price_includes_tax: false,
        reorder_level: '0',
        is_manufactured: false,
    })

    const submit = (e) => {
        e.preventDefault()
        post(route('store.v3.products.store', { store_slug: store?.slug }))
    }

    return (
        <div className="p-6 max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('store.v3.products.index', { store_slug: store?.slug })} className="text-gray-500 hover:text-gray-700">
                    ← Products
                </Link>
                <h1 className="text-2xl font-bold">New Product</h1>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Product Name *</label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">SKU *</label>
                        <input
                            type="text"
                            value={data.sku}
                            onChange={e => setData('sku', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Base Unit *</label>
                        <select
                            value={data.base_unit}
                            onChange={e => setData('base_unit', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            {['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'DOZ', 'GM', 'ML'].map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Sale Price *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.sale_price}
                            onChange={e => setData('sale_price', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                        {errors.sale_price && <p className="text-red-600 text-sm mt-1">{errors.sale_price}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tax Rate %</label>
                        <input
                            type="number"
                            step="0.01"
                            value={data.tax_rate}
                            onChange={e => setData('tax_rate', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>

                <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.price_includes_tax}
                            onChange={e => setData('price_includes_tax', e.target.checked)}
                        />
                        <span className="text-sm">Price includes tax</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.is_manufactured}
                            onChange={e => setData('is_manufactured', e.target.checked)}
                        />
                        <span className="text-sm">Has BOM (manufactured product)</span>
                    </label>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Create Product'}
                    </button>
                    <Link
                        href={route('store.v3.products.index', { store_slug: store?.slug })}
                        className="border px-6 py-2 rounded hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    )
}
