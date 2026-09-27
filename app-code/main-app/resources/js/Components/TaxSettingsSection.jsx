import React, { useState } from 'react';
import { Percent, Plus, Trash2, ArrowUpRight } from 'lucide-react';

export default function TaxSettingsSection({ data, setData }) {

    // Helper to add a new tax rate
    const addTax = () => {
        const newTax = {
            id: Date.now(),
            name: 'New Tax',
            rate: 0,
            type: 'percentage'
        };
        setData('tax_rates', [...data.tax_rates, newTax]);
    };

    const removeTax = (id) => {
        const newRates = data.tax_rates.filter(t => t.id !== id);
        setData('tax_rates', newRates);
    };

    const updateTax = (index, field, value) => {
        const newRates = [...data.tax_rates];
        newRates[index][field] = value;
        setData('tax_rates', newRates);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 bg-surface rounded-xl border border-line shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                        <Percent size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-ink tracking-tight">Tax Configuration</h2>
                        <p className="text-ink-muted font-medium">Manage GST, VAT, and other levies.</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={addTax}
                    className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span>Add Tax Rate</span>
                </button>
            </div>

            {/* Default Tax Rate & Basis Selectors (M09) */}
            <div className="p-6 bg-surface rounded-xl border border-line space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-ink">Default Tax Rate</h3>
                        <p className="text-xs text-ink-muted">Choose which tax rate is automatically applied to new sales and invoices.</p>
                    </div>
                    <select
                        value={data.default_tax_id ? String(data.default_tax_id) : (data.default_tax_rate || '0')}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId === '0') {
                                setData(d => ({ ...d, default_tax_rate: '0', default_tax_id: '' }));
                            } else {
                                const found = (data.tax_rates || []).find(t => String(t.id) === selectedId || String(t.rate) === selectedId);
                                setData(d => ({
                                    ...d,
                                    default_tax_rate: found ? String(found.rate) : selectedId,
                                    default_tax_id: found ? String(found.id) : selectedId
                                }));
                            }
                        }}
                        className="px-4 py-2.5 bg-app border border-line rounded-xl font-bold text-sm text-ink focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64 cursor-pointer"
                    >
                        <option value="0">No Default Tax (0%)</option>
                        {(data.tax_rates || []).map((t) => (
                            <option key={t.id} value={String(t.id)}>
                                {t.name} ({t.type === 'fixed' ? `${t.rate} Fixed` : `${t.rate}%`})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="pt-4 border-t border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold text-ink">Default Pricing Tax Basis</h3>
                        <p className="text-xs text-ink-muted">Specify whether catalog item prices are treated as tax-exclusive or tax-inclusive by default.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setData('default_tax_basis', 'exclusive')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                (data.default_tax_basis || 'exclusive') === 'exclusive'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-app text-ink-muted hover:text-ink border border-line'
                            }`}
                        >
                            Exclusive (Added on top)
                        </button>
                        <button
                            type="button"
                            onClick={() => setData('default_tax_basis', 'inclusive')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                data.default_tax_basis === 'inclusive'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-app text-ink-muted hover:text-ink border border-line'
                            }`}
                        >
                            Inclusive (Included in price)
                        </button>
                    </div>
                </div>
            </div>

            {/* Tax Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(data.tax_rates || []).map((tax, i) => (
                    <div
                        key={tax.id}
                        className="group relative p-6 bg-surface border border-line rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:shadow-xl transition-all duration-slow"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight size={24} className="text-emerald-200 dark:text-emerald-900" />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-2xs uppercase font-bold tracking-widest text-ink-muted">Tax Name</label>
                                <input
                                    type="text"
                                    value={tax.name}
                                    onChange={(e) => updateTax(i, 'name', e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-xl font-bold text-ink focus:ring-0 placeholder:text-ink-faint"
                                    placeholder="e.g. GST 18%"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1">
                                    <label className="text-2xs uppercase font-bold tracking-widest text-ink-muted">Rate</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={tax.rate}
                                            onChange={(e) => updateTax(i, 'rate', e.target.value)}
                                            className="w-full px-4 py-3 bg-app border border-line rounded-xl font-bold text-ink focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-2xs uppercase font-bold tracking-widest text-ink-muted">Type</label>
                                    <select
                                        value={tax.type}
                                        onChange={(e) => updateTax(i, 'type', e.target.value)}
                                        className="w-full px-4 py-3 bg-app border border-line rounded-xl font-bold text-ink focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                                    >
                                        <option value="percentage">% Percent</option>
                                        <option value="fixed">$ Fixed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Delete Action */}
                        <div className="absolute -top-3 -right-3">
                            <button
                                type="button"
                                onClick={() => removeTax(tax.id)}
                                className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 scale-75"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State Help */}
                {(!data.tax_rates || data.tax_rates.length === 0) && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-ink-muted border-2 border-dashed border-line rounded-xl">
                        <Percent size={48} className="mb-4 opacity-20" />
                        <p className="font-bold">No Tax Rates Configured</p>
                        <p className="text-sm">Click the button above to add your first tax.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
