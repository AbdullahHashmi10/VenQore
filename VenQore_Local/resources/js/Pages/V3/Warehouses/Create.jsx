import { useForm, Link, usePage } from '@inertiajs/react'

export default function WarehouseCreate() {
    const { store } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '',
        is_default: false,
    })

    const submit = (e) => {
        e.preventDefault()
        post(route('store.v3.warehouses.store', { store_slug: store?.slug }))
    }

    return (
        <div className="p-6 max-w-xl">
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('store.v3.warehouses.index', { store_slug: store?.slug })} className="text-gray-500 hover:text-gray-700">
                    ← Warehouses
                </Link>
                <h1 className="text-2xl font-bold">New Warehouse</h1>
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="e.g. Main Store, Warehouse B"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <textarea
                        value={data.address}
                        onChange={e => setData('address', e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        rows={3}
                        placeholder="Optional physical address"
                    />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.is_default}
                        onChange={e => setData('is_default', e.target.checked)}
                    />
                    <span className="text-sm">Set as default warehouse</span>
                </label>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {processing ? 'Saving...' : 'Create Warehouse'}
                    </button>
                    <Link
                        href={route('store.v3.warehouses.index', { store_slug: store?.slug })}
                        className="border px-6 py-2 rounded hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    )
}
