import React from 'react';
import { Percent, Plus, Trash2 } from 'lucide-react';
import PremiumSelect from '@/Components/PremiumSelect';

export default function TaxSettingsSection({ data, setData }) {
    const addTax = () => {
        const newTax = {
            id: Date.now(),
            name: 'New Tax',
            rate: 0,
            type: 'percentage'
        };
        setData('tax_rates', [...(data.tax_rates || []), newTax]);
    };

    const removeTax = (id) => {
        const newRates = (data.tax_rates || []).filter(t => t.id !== id);
        setData('tax_rates', newRates);
    };

    const updateTax = (index, field, value) => {
        const newRates = [...(data.tax_rates || [])];
        newRates[index][field] = value;
        setData('tax_rates', newRates);
    };

    const taxOptions = [
        { value: '0', label: 'No Default Tax (0%)' },
        ...(data.tax_rates || []).map((t) => ({
            value: String(t.id),
            label: `${t.name} (${t.type === 'fixed' ? `${t.rate} Fixed` : `${t.rate}%`})`
        }))
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
            {/* Default Tax Rate & Basis Selectors */}
            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-ink">Default Tax Rate</h3>
                        <p className="text-xs text-ink-muted">Choose which tax rate is automatically applied to new sales and invoices</p>
                    </div>
                    <div className="w-full md:w-72">
                        <PremiumSelect
                            options={taxOptions}
                            value={data.default_tax_id ? String(data.default_tax_id) : (data.default_tax_rate || '0')}
                            onChange={(selectedId) => {
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
                            searchable={false}
                            placeholder="Select Default Tax"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-line flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-bold text-ink">Default Pricing Tax Basis</h3>
                        <p className="text-xs text-ink-muted">Specify whether catalog item prices are treated as tax-exclusive or tax-inclusive by default</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setData('default_tax_basis', 'exclusive')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                (data.default_tax_basis || 'exclusive') === 'exclusive'
                                    ? 'bg-brand-600 text-white shadow-sm'
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
                                    ? 'bg-brand-600 text-white shadow-sm'
                                    : 'bg-app text-ink-muted hover:text-ink border border-line'
                            }`}
                        >
                            Inclusive (Included in price)
                        </button>
                    </div>
                </div>
            </div>

            {/* Tax Grid Header & Cards */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h3 className="text-sm font-bold text-ink">Configured Tax Rates</h3>
                    <p className="text-xs text-ink-muted">Active tax rates applied to items and transactions</p>
                </div>
                <button
                    type="button"
                    onClick={addTax}
                    className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0"
                >
                    <Plus size={15} />
                    <span>Add Tax Rate</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(data.tax_rates || []).map((tax, i) => (
                    <div
                        key={tax.id}
                        className="group relative p-5 bg-surface border border-line rounded-2xl shadow-xs hover:border-brand-500/50 hover:shadow-md transition-all duration-normal"
                    >
                        <div className="space-y-4">
                            <div className="space-y-1.5 pr-8">
                                <label className="text-2xs uppercase font-bold tracking-widest text-ink-muted">Tax Name</label>
                                <input
                                    type="text"
                                    value={tax.name}
                                    onChange={(e) => updateTax(i, 'name', e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-base font-bold text-ink focus:ring-0 placeholder:text-ink-faint"
                                    placeholder="e.g. GST 18%"
                                />
                            </div>

                            <div className="flex gap-3">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-2xs uppercase font-bold tracking-widest text-ink-muted">Rate</label>
                                    <input
                                        type="number"
                                        value={tax.rate}
                                        onChange={(e) => updateTax(i, 'rate', e.target.value)}
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl font-bold text-sm text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-2xs uppercase font-bold tracking-widest text-ink-muted">Type</label>
                                    <select
                                        value={tax.type}
                                        onChange={(e) => updateTax(i, 'type', e.target.value)}
                                        className="w-full px-3 py-2 bg-app border border-line rounded-xl font-bold text-sm text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    >
                                        <option value="percentage">% Percent</option>
                                        <option value="fixed">$ Fixed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Delete Action */}
                        <div className="absolute top-4 right-4">
                            <button
                                type="button"
                                onClick={() => removeTax(tax.id)}
                                className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl shadow-xs transition-all opacity-0 group-hover:opacity-100"
                                title="Delete Tax Rate"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State Help */}
                {(!data.tax_rates || data.tax_rates.length === 0) && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-ink-muted border-2 border-dashed border-line rounded-2xl">
                        <Percent size={36} className="mb-3 opacity-30 text-ink-muted" />
                        <p className="font-bold text-sm text-ink">No Tax Rates Configured</p>
                        <p className="text-xs text-ink-muted mt-0.5">Click the button above to add your first tax rate.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
