import React from 'react';
import { FileText, Hash, Receipt, ShoppingCart, FileCheck, RotateCcw } from 'lucide-react';
import Toggle from '@/Components/Toggle';

export default function TransactionSettingsSection({ data, setData }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
            {/* Header */}
            <div className="p-6 md:p-8 rounded-2xl bg-surface border border-line relative overflow-hidden shadow-xs">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
                        <FileText size={26} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-ink tracking-tight">On the Invoice & Document Numbering</h2>
                        <p className="text-sm text-ink-muted">Control invoice identifiers, prefixes, and default transaction behavior.</p>
                    </div>
                </div>
            </div>

            {/* General Transaction Defaults */}
            <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Register & Display Defaults</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Toggle
                        enabled={data.invoice_number_enabled === '1' || data.invoice_number_enabled === true}
                        onChange={v => setData('invoice_number_enabled', v)}
                        label="Show Invoice Number"
                        description="Display sequential invoice ID on receipts and printouts"
                    />
                    <Toggle
                        enabled={data.cash_sale_default === '1' || data.cash_sale_default === true}
                        onChange={v => setData('cash_sale_default', v)}
                        label="Default to 'Cash Sale'"
                        description="Pre-select Cash mode during quick register checkout"
                    />
                    <div className="space-y-1.5 col-span-1 md:col-span-2 pt-2 border-t border-line">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Default Invoice Billing Mode</label>
                        <select
                            value={data.billing_type || 'full'}
                            onChange={e => setData('billing_type', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                        >
                            <option value="full">Standard Full Invoice (Default)</option>
                            <option value="quick">Quick Retail Slip</option>
                            <option value="tax_invoice">Formal Tax Invoice (FBR/VAT Compliant)</option>
                        </select>
                        <p className="text-3xs text-ink-muted">Selects default layout and compliance rules during sales invoicing.</p>
                    </div>
                </div>
            </div>

            {/* Document Numbering Prefixes */}
            <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-line pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Document Numbering Prefixes</h3>
                        <p className="text-xs text-ink-muted mt-0.5">Custom prefix string prepended to document numbers for accounting identification.</p>
                    </div>
                    <Hash size={18} className="text-ink-muted" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Receipt size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Sales Invoice Prefix</span>
                        </label>
                        <input
                            type="text"
                            value={data.sale_prefix ?? 'INV-'}
                            onChange={e => setData('sale_prefix', e.target.value)}
                            placeholder="INV-"
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-ink-faint"
                        />
                        <p className="text-3xs text-ink-muted">e.g. {data.sale_prefix || 'INV-'}001024</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <ShoppingCart size={13} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Purchase Prefix</span>
                        </label>
                        <input
                            type="text"
                            value={data.purchase_prefix ?? 'PUR-'}
                            onChange={e => setData('purchase_prefix', e.target.value)}
                            placeholder="PUR-"
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-ink-faint"
                        />
                        <p className="text-3xs text-ink-muted">e.g. {data.purchase_prefix || 'PUR-'}000451</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <FileCheck size={13} className="text-sky-600 dark:text-sky-400" />
                            <span>Quotation Prefix</span>
                        </label>
                        <input
                            type="text"
                            value={data.quotation_prefix ?? 'QTN-'}
                            onChange={e => setData('quotation_prefix', e.target.value)}
                            placeholder="QTN-"
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-ink-faint"
                        />
                        <p className="text-3xs text-ink-muted">e.g. {data.quotation_prefix || 'QTN-'}000089</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <RotateCcw size={13} className="text-amber-600 dark:text-amber-400" />
                            <span>Return Prefix</span>
                        </label>
                        <input
                            type="text"
                            value={data.return_prefix ?? 'RET-'}
                            onChange={e => setData('return_prefix', e.target.value)}
                            placeholder="RET-"
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-ink-faint"
                        />
                        <p className="text-3xs text-ink-muted">e.g. {data.return_prefix || 'RET-'}000012</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
