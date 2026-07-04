import React from 'react';
import { FileText } from 'lucide-react';
import Toggle from '@/Components/Toggle';

// NOTE: This section used to also contain "Auto-Fill Cash Received", "Show Profit
// Margin %" and "Round Off Invoice Totals" — those were byte-for-byte duplicates of
// controls in the "Sales & Invoicing" > "At the register" subsection (same
// pos_auto_fill_cash / show_margin_percentage / round_off_total state keys, editable
// from two different tabs). They were removed from here so each setting has exactly
// one home; see Pages/Admin/Settings.jsx's merged 'sales' case.
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
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-2">On the Invoice</h2>
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
                </div>
            </div>
        </div>
    );
}
