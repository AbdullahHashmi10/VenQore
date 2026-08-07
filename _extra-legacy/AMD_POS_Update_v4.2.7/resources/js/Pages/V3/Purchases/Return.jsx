import { useForm, Link, usePage } from '@inertiajs/react'
import { formatCurrency, getCurrencySymbol } from '@/Utils/format'

export default function PurchaseReturn({ purchase, items }) {
    const { store } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        return_date: new Date().toISOString().slice(0, 10),
        reason: '',
        items: items.map(item => ({
            purchase_item_id: item.id,
            product_id: item.product_id,
            inventory_batch_id: item.inventory_batch_id,
            product_name: item.product_name,
            sku: item.sku,
            base_unit: item.base_unit,
            unit_cost: parseFloat(item.unit_cost),
            return_qty: '',
            remaining_qty: parseFloat(item.remaining_qty)
        })),
    })

    const updateLine = (index, field, value) => {
        const updated = data.items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        )
        setData('items', updated)
    }

    const removeLine = (index) => {
        setData('items', data.items.filter((_, i) => i !== index))
    }

    const grandTotal = data.items.reduce((sum, item) => {
        const qty = parseFloat(item.return_qty) || 0
        return sum + (qty * item.unit_cost)
    }, 0)

    const submit = (e) => {
        e.preventDefault()
        // Only submit items that have a return quantity > 0
        const itemsToReturn = data.items.filter(item => parseFloat(item.return_qty) > 0)

        post(route('store.v3.purchases.return.store', purchase.id), {
            data: {
                ...data,
                items: itemsToReturn
            }
        })
    }

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('store.v3.purchases.show', purchase.id)} className="text-gray-500 hover:text-gray-700">
                    ← Purchase {purchase.invoice_number}
                </Link>
                <h1 className="text-2xl font-bold">New Purchase Return (B18)</h1>
            </div>

            <div className="bg-white rounded mb-6">
                <p className="mb-2"><strong>Supplier:</strong> {purchase.supplier_name}</p>
                <p><strong>Original Total:</strong> {formatCurrency(purchase.total, store)}</p>
            </div>

            <form onSubmit={submit} className="space-y-6">

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Return Date *</label>
                        <input
                            type="date"
                            value={data.return_date}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={e => setData('return_date', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                        {errors.return_date && <p className="text-red-600 text-sm mt-1">{errors.return_date}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reason *</label>
                        <input
                            type="text"
                            value={data.reason}
                            onChange={e => setData('reason', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Reason for return"
                            required
                        />
                        {errors.reason && <p className="text-red-600 text-sm mt-1">{errors.reason}</p>}
                    </div>
                </div>

                <div>
                    <h3 className="font-bold mb-2">Items Available for Return</h3>
                    <table className="w-full border-collapse border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="border border-gray-200 px-3 py-2 text-left text-sm">Product</th>
                                <th className="border border-gray-200 px-3 py-2 text-right text-sm">Remaining Qty</th>
                                <th className="border border-gray-200 px-3 py-2 text-right text-sm">Batch Unit Cost</th>
                                <th className="border border-gray-200 px-3 py-2 text-right text-sm w-32">Return Qty</th>
                                <th className="border border-gray-200 px-3 py-2 text-right text-sm">Return Value</th>
                                <th className="border border-gray-200 px-3 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, index) => {
                                const returnQty = parseFloat(item.return_qty) || 0
                                const returnValue = returnQty * item.unit_cost

                                return (
                                    <tr key={item.purchase_item_id}>
                                        <td className="border border-gray-200 px-3 py-2 text-sm">
                                            {item.product_name} <span className="text-gray-400 text-xs">({item.sku})</span>
                                        </td>
                                        <td className="border border-gray-200 px-3 py-2 text-sm text-right">
                                            {item.remaining_qty} {item.base_unit}
                                        </td>
                                        <td className="border border-gray-200 px-3 py-2 text-sm text-right">
                                            {getCurrencySymbol(store)} {item.unit_cost.toFixed(4)}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                min="0"
                                                max={item.remaining_qty}
                                                value={item.return_qty}
                                                onChange={e => updateLine(index, 'return_qty', e.target.value)}
                                                className={`w-full text-right border outline-none py-1 px-2 ${errors[`items.${index}.return_qty`] ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="0"
                                            />
                                            {errors[`items.${index}.return_qty`] &&
                                                <p className="text-red-600 text-xs mt-1 text-right">{errors[`items.${index}.return_qty`]}</p>
                                            }
                                        </td>
                                        <td className="border border-gray-200 px-3 py-2 text-sm text-right font-medium">
                                            {getCurrencySymbol(store)} {returnValue.toFixed(2)}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                className="text-red-400 hover:text-red-600 text-lg leading-none"
                                            >
                                                ×
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={4} className="px-3 py-2 text-right font-medium">
                                    Total Return Value:
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-right font-bold text-lg">
                                    {formatCurrency(grandTotal, store)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {errors.items && <p className="text-red-600 text-sm mt-1">{errors.items}</p>}

                {/* General errors passed back from server (like throwing InvalidArgumentException) */}
                {Object.values(errors).filter(e => e.includes('exceeds')).map((err, i) => (
                    <div key={i} className="bg-red-50 text-red-700 p-3 rounded">{err}</div>
                ))}

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={processing || grandTotal === 0}
                        className="bg-blue-600 text-white px-8 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
                    >
                        {processing ? 'Processing...' : `Confirm Return — ${formatCurrency(grandTotal, store)}`}
                    </button>
                    <Link
                        href={route('store.v3.purchases.show', purchase.id)}
                        className="border px-6 py-2 rounded hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    )
}
