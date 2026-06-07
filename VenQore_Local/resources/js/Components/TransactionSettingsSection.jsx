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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Prefix & Numbering */}
                <div className="space-y-6">
                    <div className="p-6 bg-white dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-700 h-full">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <span className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600"><Info size={18} /></span>
                            Prefixes & Numbering
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2 group">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Sale Invoice Prefix</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.sale_prefix}
                                        onChange={(e) => setData('sale_prefix', e.target.value)}
                                        className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-base font-bold focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 uppercase"
                                        placeholder="INV-"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">AUTO</span>
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800" />

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Billing Experience</label>
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setData('billing_type', 'lite')}
                                        className={`py-3 rounded-lg text-sm font-bold transition-all ${data.billing_type === 'lite' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        ⚡ Lite POS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('billing_type', 'full')}
                                        className={`py-3 rounded-lg text-sm font-bold transition-all ${data.billing_type === 'full' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        🛠️ Full Invoice
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 px-2">
                                    {data.billing_type === 'lite' ? 'Fast checkout for retail. Minimal fields.' : 'Detailed entry with taxes, discounts per item.'}
                                </p>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Toggles Grid */}
                <div className="grid grid-cols-1 gap-4 content-start">
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
                        enabled={data.round_off_total === '1' || data.round_off_total === true}
                        onChange={v => setData('round_off_total', v)}
                        label="Round Off Totals"
                        description="Auto-round 10.55 to 11.00"
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
                </div>

            </div>
        </div>
    );
}
