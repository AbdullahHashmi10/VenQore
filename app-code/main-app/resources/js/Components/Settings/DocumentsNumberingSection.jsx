import React from 'react';
import { FileText, Hash, Receipt, ShoppingCart, FileCheck, RotateCcw } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import PremiumSelect from '@/Components/PremiumSelect';

const BILLING_TYPE_OPTIONS = [
    { value: 'full', label: 'Standard Full Invoice (A4 / B2B Default)' },
    { value: 'quick', label: 'Quick Retail Cash Slip' },
    { value: 'tax_invoice', label: 'Formal Tax Invoice (FBR/VAT Compliant)' }
];

export default function DocumentsNumberingSection({ data, setData }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            {/* Document Layout Defaults */}
            <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Document Numbering &amp; Compliance</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="divide-y divide-line">
                        <Toggle
                            enabled={data.invoice_number_enabled === '1' || data.invoice_number_enabled === true || data.invoice_number_enabled !== '0'}
                            onChange={v => setData('invoice_number_enabled', v)}
                            label="Sequential Invoice Numbering"
                            description="Display sequential numeric IDs on customer receipts and PDF invoices."
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Default Invoice Billing Mode</label>
                        <PremiumSelect
                            options={BILLING_TYPE_OPTIONS}
                            value={data.billing_type || 'full'}
                            onChange={(val) => setData('billing_type', val)}
                            searchable={false}
                            placeholder="Select Billing Mode"
                        />
                        <p className="text-3xs text-ink-muted">Controls the default invoice styling and tax breakdown on sales creation.</p>
                    </div>
                </div>
            </div>

            {/* Prefix Strings */}
            <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-y-2 border-b border-line pb-3">
                    <div>
                        <h3 className="text-sm font-bold text-ink">Document Numbering Prefixes</h3>
                        <p className="text-xs text-ink-muted mt-0.5">Prefix strings prepended to sequential numbers for cross-department accounting</p>
                    </div>
                    <Hash size={18} className="text-ink-muted" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
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
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <p className="text-3xs text-ink-muted font-mono">e.g. {data.sale_prefix || 'INV-'}001024</p>
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
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <p className="text-3xs text-ink-muted font-mono">e.g. {data.purchase_prefix || 'PUR-'}000451</p>
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
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <p className="text-3xs text-ink-muted font-mono">e.g. {data.quotation_prefix || 'QTN-'}000089</p>
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
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <p className="text-3xs text-ink-muted font-mono">e.g. {data.return_prefix || 'RET-'}000012</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
