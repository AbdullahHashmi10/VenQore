import React, { useState } from 'react';
import { usePage, Head } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PremiumButton from '@/Components/PremiumButton';
import StockModuleTabs from '@/Components/StockModuleTabs';
import { Tag, Printer, Search, Plus, Trash2, Settings } from 'lucide-react';
import AsyncProductCombobox from '@/Components/AsyncProductCombobox';

export default function LabelsIndex({ products }) {
    const { store } = usePage().props;
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [settings, setSettings] = useState({
        width: 50,
        height: 30,
        show_price: true,
        show_name: true,
        show_barcode: true,
        show_qrcode: false,
    });

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToSelection = (product) => {
        if (!product) return;
        const existing = selectedItems.find(item => item.id === product.id);
        if (existing) {
            setSelectedItems(selectedItems.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setSelectedItems([...selectedItems, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id, newQty) => {
        if (newQty < 1) return;
        setSelectedItems(selectedItems.map(item =>
            item.id === id ? { ...item, quantity: newQty } : item
        ));
    };

    const removeFromSelection = (id) => {
        setSelectedItems(selectedItems.filter(item => item.id !== id));
    };

    const handlePrint = () => {
        if (selectedItems.length === 0) return;

        // Build query string or post form
        // Since we need to download a file, a form submission is better, or window.open with params
        // But for POST with JSON body, we need to use axios with blob response or a hidden form.
        // Inertia isn't great for file downloads that are result of POST.
        // We'll use a hidden form submission approach.

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = route('store.labels.print', { store_slug: store.slug });
        form.target = '_blank';

        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = '_token';
        csrfInput.value = csrfToken;
        form.appendChild(csrfInput);

        selectedItems.forEach((item, index) => {
            const idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.name = `items[${index}][id]`;
            idInput.value = item.id;
            form.appendChild(idInput);

            const qtyInput = document.createElement('input');
            qtyInput.type = 'hidden';
            qtyInput.name = `items[${index}][quantity]`;
            qtyInput.value = item.quantity;
            form.appendChild(qtyInput);
        });

        Object.keys(settings).forEach(key => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `settings[${key}]`;
            input.value = settings[key];
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
    };

    return (
        <OneGlanceLayout title="Label Printing" activeMenu="Stock">
            <Head title="Label Printing" />

            <div className="h-full flex flex-col">
                <StockModuleTabs activeTab="labels" />

                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-full text-brand-600 dark:text-brand-400">
                                <Tag size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-ink">Barcode Labels</h2>
                                <p className="text-ink-muted">Generate and print product labels.</p>
                            </div>
                        </div>
                        <PremiumButton onClick={handlePrint} disabled={selectedItems.length === 0}>
                            <Printer size={18} />
                            Generate PDF
                        </PremiumButton>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left: Product Selection */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Search */}
                            <div className="bg-surface p-4 rounded-xl border border-line">
                                <AsyncProductCombobox
                                    onSelect={addToSelection}
                                    defaultOptions={products}
                                    placeholder="Search products to add..."
                                />
                            </div>

                            {/* Selected Items Table */}
                            <div className="bg-surface rounded-xl border border-line overflow-hidden">
                                <div className="p-4 border-b border-line font-bold text-ink-secondary">
                                    Selected Products ({selectedItems.length})
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-app">
                                            <tr>
                                                <th className="p-3 text-left text-xs font-bold text-ink-muted uppercase">Product</th>
                                                <th className="p-3 text-center text-xs font-bold text-ink-muted uppercase w-32">Quantity</th>
                                                <th className="p-3 text-right text-xs font-bold text-ink-muted uppercase w-16"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-line">
                                            {selectedItems.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="p-8 text-center text-ink-muted">
                                                        No items selected. Search and add products above.
                                                    </td>
                                                </tr>
                                            ) : (
                                                selectedItems.map(item => (
                                                    <tr key={item.id}>
                                                        <td className="p-3">
                                                            <div className="font-bold text-ink">{item.name}</div>
                                                            <div className="text-xs text-ink-muted">{item.sku}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                    className="w-6 h-6 rounded bg-sunken flex items-center justify-center hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="w-8 text-center font-bold text-ink-secondary">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                    className="w-6 h-6 rounded bg-sunken flex items-center justify-center hover:bg-interactive-hover dark:hover:bg-interactive-hover"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-right">
                                                            <button
                                                                onClick={() => removeFromSelection(item.id)}
                                                                className="text-red-400 hover:text-red-600 p-1"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right: Settings */}
                        <div className="space-y-6">
                            <div className="bg-surface p-6 rounded-xl border border-line">
                                <div className="flex items-center gap-2 mb-4 text-ink font-bold">
                                    <Settings size={18} />
                                    Label Settings
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-ink-muted uppercase mb-1">Label Size (mm)</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-xs text-ink-muted mb-1 block">Width</span>
                                                <input
                                                    type="number"
                                                    value={settings.width}
                                                    onChange={(e) => setSettings({ ...settings, width: parseFloat(e.target.value) })}
                                                    className="w-full px-3 py-2 rounded-lg bg-app border border-line text-sm"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-xs text-ink-muted mb-1 block">Height</span>
                                                <input
                                                    type="number"
                                                    value={settings.height}
                                                    onChange={(e) => setSettings({ ...settings, height: parseFloat(e.target.value) })}
                                                    className="w-full px-3 py-2 rounded-lg bg-app border border-line text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.show_name}
                                                onChange={(e) => setSettings({ ...settings, show_name: e.target.checked })}
                                                className="rounded text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-sm text-ink-secondary">Show Product Name</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.show_price}
                                                onChange={(e) => setSettings({ ...settings, show_price: e.target.checked })}
                                                className="rounded text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-sm text-ink-secondary">Show Price</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.show_barcode}
                                                onChange={(e) => setSettings({ ...settings, show_barcode: e.target.checked })}
                                                className="rounded text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-sm text-ink-secondary">Show Barcode</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={settings.show_qrcode}
                                                onChange={(e) => setSettings({ ...settings, show_qrcode: e.target.checked })}
                                                className="rounded text-brand-600 focus:ring-brand-500"
                                            />
                                            <span className="text-sm text-ink-secondary">Show QR Code (Store Link)</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Preview (Visual approximation) */}
                            <div className="bg-surface p-6 rounded-xl border border-line">
                                <div className="mb-4 text-ink font-bold text-sm">Preview</div>
                                <div className="flex justify-center bg-sunken p-8 rounded-lg">
                                    <div
                                        className="bg-white border border-line shadow-sm flex flex-col items-center justify-center p-2 text-center overflow-hidden"
                                        style={{
                                            width: `${settings.width * 2}px`,
                                            height: `${settings.height * 2}px`
                                        }}
                                    >
                                        {settings.show_name && <div className="font-bold text-2xs leading-tight mb-1">Sample Product</div>}
                                        {settings.show_barcode && (
                                            <div className="w-full flex flex-col items-center">
                                                <div className="h-4 w-3/4 bg-neutral-800 mb-0.5"></div>
                                                <div className="text-4xs text-ink-muted">12345678</div>
                                            </div>
                                        )}
                                        {settings.show_qrcode && (
                                            <div className="w-8 h-8 border border-line-strong bg-sunken flex items-center justify-center text-4xs font-bold my-1 p-0.5">
                                                QR
                                            </div>
                                        )}
                                        {settings.show_price && <div className="font-bold text-xs mt-1">$19.99</div>}
                                    </div>
                                </div>
                                <p className="text-xs text-ink-muted mt-2 text-center">Not to scale. Visual approximation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
