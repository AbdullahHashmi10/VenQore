import { usePage, useForm, Link } from '@inertiajs/react';
import { formatCurrency } from '@/Utils/format';
import { useState } from 'react';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';
import AsyncPartyCombobox from '@/Components/AsyncPartyCombobox';

export default function PurchaseCreate({ suppliers, products, warehouses }) {
    const { store } = usePage().props;
    const defaultWarehouse = warehouses.find(w => w.is_default) ?? warehouses[0]

    const { data, setData, post, processing, errors, clearErrors } = useForm({
        supplier_id: '',
        warehouse_id: defaultWarehouse?.id ?? '',
        payment_method: 'cash',
        purchase_date: new Date().toISOString().slice(0, 10),
        supplier_invoice: '',
        items: [{ product_id: '', qty: '', unit_cost: '', tax_rate: '0', business_pct: '100' }],
        zero_cost_acknowledged: false,
    })

    const addLine = () => {
        setData('items', [...data.items, { product_id: '', qty: '', unit_cost: '', tax_rate: '0', business_pct: '100' }])
    }

    const removeLine = (index) => {
        setData('items', data.items.filter((_, i) => i !== index))
    }

    const updateLine = (index, field, value) => {
        const updated = data.items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item
        )
        setData('items', updated)
    }

    const onProductSelect = (index, productId) => {
        const product = products.find(p => p.id === productId)
        updateLine(index, 'product_id', productId)
        if (product) updateLine(index, 'tax_rate', product.tax_rate ?? '0')
    }

    // Live totals
    const lineTotal = (item) => {
        const qty = parseFloat(item.qty) || 0
        const cost = parseFloat(item.unit_cost) || 0
        const tax = parseFloat(item.tax_rate) || 0
        const net = qty * cost
        return { net, tax: net * tax / 100, gross: net + net * tax / 100 }
    }

    const grandTotal = data.items.reduce((sum, item) => sum + lineTotal(item).gross, 0)

    const submit = (e) => {
        e.preventDefault()
        post(route('store.v3.purchases.store', { store_slug: store.slug }))
    }

    return (
        <div className="p-6 max-w-5xl">
            <div className="flex items-center gap-4 mb-6">
                <Link href={route('store.v3.purchases.index', { store_slug: store.slug })} className="text-gray-500 hover:text-gray-700">
                    ← Purchases
                </Link>
                <h1 className="text-2xl font-bold">New Purchase ({data.payment_method === 'cash' ? 'B3 Cash' : 'B6 Credit'})</h1>
            </div>

            <form onSubmit={submit} className="space-y-6">

                {/* Header */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Supplier *</label>
                        <AsyncPartyCombobox
                            type="supplier"
                            value={data.supplier_id}
                            onSelect={(s) => setData('supplier_id', s ? s.id : '')}
                            defaultOptions={suppliers}
                            placeholder="Search supplier..."
                            className="w-full"
                        />
                        {errors.supplier_id && <p className="text-red-600 text-sm mt-1">{errors.supplier_id}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Warehouse *</label>
                        <select
                            value={data.warehouse_id}
                            onChange={e => setData('warehouse_id', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            {warehouses.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Purchase Date *</label>
                        <input
                            type="date"
                            value={data.purchase_date}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={e => setData('purchase_date', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Supplier Invoice #</label>
                        <input
                            type="text"
                            value={data.supplier_invoice}
                            onChange={e => setData('supplier_invoice', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Optional"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Payment Method *</label>
                        <select
                            value={data.payment_method}
                            onChange={e => setData('payment_method', e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        >
                            <option value="cash">Cash (Paid now)</option>
                            <option value="credit">Credit (Pay later)</option>
                        </select>
                    </div>
                </div>

                {/* Line items */}
                <div>
                    <table className="w-full border-collapse border border-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="border border-gray-200 px-3 py-2 text-left text-sm">Product</th>
                                <th className="border border-gray-200 px-3 py-2 text-right text-sm w-24">Qty</th>
                                <th className="border border-gray-200 px-3 py-2 text-right text-sm w-32">Unit Cost</th>
                                <th className="border border-gray-200 px-3 py-2 text-right text-sm w-20">Tax %</th>
                                <th className="border border-gray-200 px-3 py-2 text-right text-sm w-24">Business %</th>
                                <th className="border border-gray-200 px-3 py-2 text-right text-sm w-32">Line Total</th>
                                <th className="border border-gray-200 px-3 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map((item, index) => {
                                const totals = lineTotal(item)
                                return (
                                    <tr key={index}>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <AsyncProductCombobox
                                                value={item.product_id}
                                                onSelect={(p) => onProductSelect(index, p ? p.id : '')}
                                                defaultOptions={products}
                                                placeholder="Search product..."
                                                className="w-full"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <input
                                                type="number"
                                                step="0.0001"
                                                value={item.qty}
                                                onChange={e => updateLine(index, 'qty', e.target.value)}
                                                className="w-full text-right border-0 outline-none py-1"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unit_cost}
                                                onChange={e => updateLine(index, 'unit_cost', e.target.value)}
                                                className="w-full text-right border-0 outline-none py-1"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.tax_rate}
                                                onChange={e => updateLine(index, 'tax_rate', e.target.value)}
                                                className="w-full text-right border-0 outline-none py-1"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.business_pct}
                                                onChange={e => updateLine(index, 'business_pct', e.target.value)}
                                                className="w-full text-right border-0 outline-none py-1"
                                                placeholder="100"
                                            />
                                        </td>
                                        <td className="border border-gray-200 px-3 py-2 text-right text-sm">
                                            <div>{formatCurrency(totals.gross, store)}</div>
                                            {totals.tax > 0 && (
                                                <div className="text-xs text-gray-400">
                                                    tax: {totals.tax.toFixed(2)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="border border-gray-200 px-2 py-1 text-center">
                                            {data.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(index)}
                                                    className="text-red-400 hover:text-red-600 text-lg leading-none"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={5} className="px-3 py-2 text-right font-medium">
                                    Grand Total ({data.payment_method === 'cash' ? 'Cash to Pay' : 'Payable'}):
                                </td>
                                <td className="border border-gray-200 px-3 py-2 text-right font-bold">
                                    {formatCurrency(grandTotal, store)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>

                    <button
                        type="button"
                        onClick={addLine}
                        className="mt-2 text-blue-600 hover:underline text-sm"
                    >
                        + Add line
                    </button>
                </div>

                {/* Errors */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                        {Object.values(errors).map((err, i) => (
                            <div key={i}>{err}</div>
                        ))}
                    </div>
                )}

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-green-600 text-white px-8 py-2 rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                        {processing ? 'Posting...' : `Post Purchase — ${formatCurrency(grandTotal, store)}`}
                    </button>
                    <Link
                        href={route('store.v3.purchases.index', { store_slug: store.slug })}
                        className="border px-6 py-2 rounded hover:bg-gray-50"
                    >
                        Cancel
                    </Link>
                </div>
            </form>

            {errors.zero_cost_acknowledged && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded p-6 max-w-sm w-full shadow-xl">
                        <h3 className="font-bold text-lg text-red-600 mb-2">Zero Unit Cost Warning</h3>
                        <p className="mb-6 text-sm text-gray-700">{errors.zero_cost_acknowledged}</p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => clearErrors('zero_cost_acknowledged')}
                                className="px-4 py-2 border rounded hover:bg-gray-50 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setData('zero_cost_acknowledged', true)
                                    clearErrors('zero_cost_acknowledged')
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                                Confirm Zero Cost
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
