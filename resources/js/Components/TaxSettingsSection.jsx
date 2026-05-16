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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                        <Percent size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Tax Configuration</h2>
                        <p className="text-slate-500 font-medium">Manage GST, VAT, and other levies.</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={addTax}
                    className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl shadow-emerald-500/20 group hover:scale-[1.02]"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    <span>Add Tax Rate</span>
                </button>
            </div>

            {/* Tax Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(data.tax_rates || []).map((tax, i) => (
                    <div
                        key={tax.id}
                        className="group relative p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[2rem] hover:border-emerald-500 dark:hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight size={24} className="text-emerald-200 dark:text-emerald-900" />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tax Name</label>
                                <input
                                    type="text"
                                    value={tax.name}
                                    onChange={(e) => updateTax(i, 'name', e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-800 dark:text-white focus:ring-0 placeholder:text-slate-300"
                                    placeholder="e.g. GST 18%"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Rate</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={tax.rate}
                                            onChange={(e) => updateTax(i, 'rate', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Type</label>
                                    <select
                                        value={tax.type}
                                        onChange={(e) => updateTax(i, 'type', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
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
                                className="w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-500 text-red-500 hover:text-white rounded-full shadow-sm transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State Help */}
                {(!data.tax_rates || data.tax_rates.length === 0) && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem]">
                        <Percent size={48} className="mb-4 opacity-20" />
                        <p className="font-bold">No Tax Rates Configured</p>
                        <p className="text-sm">Click the button above to add your first tax.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
