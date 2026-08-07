import { Link, router, usePage } from '@inertiajs/react';

export default function ProductIndex({ products }) {
    const { store } = usePage().props;
    const deactivate = (id) => {
        if (confirm('Deactivate this product?')) {
            router.delete(route('store.v3.products.destroy', { store_slug: store?.slug, product: id }))
        }
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Products</h1>
                <Link
                    href={route('store.v3.products.create', { store_slug: store?.slug })}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    + New Product
                </Link>
            </div>

            <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="border border-gray-200 px-4 py-2 text-left">SKU</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Unit</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">Sale Price</th>
                        <th className="border border-gray-200 px-4 py-2 text-right">Tax %</th>
                        <th className="border border-gray-200 px-4 py-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50">
                            <td className="border border-gray-200 px-4 py-2 font-mono text-sm">
                                {product.sku}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">{product.name}</td>
                            <td className="border border-gray-200 px-4 py-2">{product.base_unit}</td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                                {window.amdSettings?.currency_symbol || ''} {product.sale_price.toLocaleString()}
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-right">
                                {product.tax_rate}%
                            </td>
                            <td className="border border-gray-200 px-4 py-2 text-center space-x-2">
                                <Link
                                    href={route('store.v3.products.edit', { store_slug: store?.slug, product: product.id })}
                                    className="text-blue-600 hover:underline"
                                >
                                    Edit
                                </Link>
                                <button
                                    onClick={() => deactivate(product.id)}
                                    className="text-red-600 hover:underline"
                                >
                                    Deactivate
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {products.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                    No products yet. Create your first product.
                </p>
            )}
        </div>
    )
}
