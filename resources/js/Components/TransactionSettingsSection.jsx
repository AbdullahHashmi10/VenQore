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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
            {/* Header */}
            <div className="p-8 rounded-xl bg-gradient-to-br from-brand-50 to-blue-50 dark:from-neutral-800 dark:to-neutral-900 border border-brand-100 dark:border-line relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg ">
                        <FileText size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-ink tracking-tight mb-2">On the Invoice</h2>
                        <p className="text-ink-muted font-medium">Control how your bills look and behave.</p>
                    </div>
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-line p-6">
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
