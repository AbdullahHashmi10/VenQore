import React from 'react';
import { FileText, Percent, Info, Calendar } from 'lucide-react';
import Toggle from '@/Components/Toggle';

export default function TransactionSettingsSection({ data, setData }) {

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border border-indigo-100 dark:border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-2">Invoice Configuration</h2>
                        <p className="text-slate-500 font-medium">Control how your bills look and behave.</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Toggle
                        enabled={data.invoice_number_enabled === '1' || data.invoice_number_enabled === true}
                        onChange={v => setData('invoice_number_enabled', v)}
                        label="Show Invoice Number"
                        description="Display sequential invoice ID on print"
                    />
                    <Toggle
                        enabled={data.cash_sale_default === '1' || data.cash_sale_default === true}
                        onChange={v => setData('cash_sale_default', v)}
                        label="Default to 'Cash Sale'"
                        description="Pre-select Cash as payment mode"
                    />
                    <Toggle
                        enabled={data.pos_auto_fill_cash === '1' || data.pos_auto_fill_cash === true}
                        onChange={v => setData('pos_auto_fill_cash', v)}
                        label="Auto-Fill Cash Received"
                        description="Assume exact change if field is empty"
                    />
                    <Toggle
                        enabled={data.show_margin_percentage === '1' || data.show_margin_percentage === true}
                        onChange={v => setData('show_margin_percentage', v)}
                        label="Show Profit Margin %"
                        description="Visible only to admins during sale"
                    />
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 md:col-span-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Round Off Invoice Totals</label>
                            <p className="text-xs text-slate-500">Choose rounding precision for sales and purchases</p>
                            <div className="grid grid-cols-6 gap-1 mt-2">
                                {[
                                    { value: 'none', label: 'None' },
                                    { value: '0', label: 'Whole' },
                                    { value: '1', label: '.0' },
                                    { value: '2', label: '.00' },
                                    { value: '3', label: '.000' },
                                    { value: '4', label: '.0000' }
                                ].map((opt) => {
                                    const currentVal = data.round_off_total === true || data.round_off_total === '1' ? '0' : (data.round_off_total || 'none');
                                    const isActive = currentVal === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setData('round_off_total', opt.value)}
                                            className={`py-2 px-1 text-center font-bold text-[11px] rounded-lg border transition-all ${isActive
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                                : 'border-transparent bg-slate-100 dark:bg-slate-700/50 text-slate-500 hover:bg-slate-200/50'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
