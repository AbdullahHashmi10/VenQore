import { Link, router, usePage } from '@inertiajs/react'

export default function WarehouseIndex({ warehouses, errors }) {
    const { store } = usePage().props;
    const deactivate = (id) => {
        if (confirm('Deactivate this warehouse?')) {
            router.delete(route('store.v3.warehouses.destroy', { store_slug: store?.slug, warehouse: id }))
        }
    }

    return (
        <div className="p-6 max-w-3xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Warehouses</h1>
                <Link
                    href={route('store.v3.warehouses.create', { store_slug: store?.slug })}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + New Warehouse
                </Link>
            </div>

            {errors?.warehouse && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {errors.warehouse}
                </div>
            )}

            <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Address</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Default</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Status</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {warehouses.map(w => (
                        <tr key={w.id} className={`hover:bg-gray-50 ${!w.is_active ? 'opacity-50' : ''}`}>
                            <td className="border border-gray-200 px-4 py-2 font-medium">
                                {w.name}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-sm text-gray-500">
                                {w.address ?? '—'}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                                {w.is_default
                                    ? <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">DEFAULT</span>
                                    : '—'
                                }
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center">
                                <span className={`text-xs px-2 py-1 rounded ${w.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {w.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center space-x-2">
                                <Link
                                    href={route('store.v3.warehouses.edit', { store_slug: store?.slug, warehouse: w.id })}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    Edit
                                </Link>
                                {w.is_active && !w.is_default && (
                                    <button
                                        onClick={() => deactivate(w.id)}
                                        className="text-red-600 hover:underline text-sm"
                                    >
                                        Deactivate
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
