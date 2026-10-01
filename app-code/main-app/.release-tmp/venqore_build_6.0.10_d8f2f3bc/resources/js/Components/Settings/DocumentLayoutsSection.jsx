import React from 'react';
import { Printer, Layout, Sparkles, DollarSign, Info } from 'lucide-react';
import PrintSettingsSection from '@/Components/PrintSettingsSection';
import Toggle from '@/Components/Toggle';

export default function DocumentLayoutsSection({ data, setData, saveSettings }) {
    const isPrintDecimalsEnabled = data.print_amount_decimal !== '0' && data.print_amount_decimal !== false;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            {/* Shared Amounts on Printed Documents Control */}
            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-line">
                    <div>
                        <h3 className="text-sm font-bold text-ink">Amounts on Printed Documents</h3>
                        <p className="text-xs text-ink-muted">
                            Single shared precision rule for all printed templates (A4 invoices, B2B PDFs, and thermal receipts)
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-app px-3.5 py-2 rounded-xl border border-line">
                        <span className="text-2xs font-bold text-ink-muted uppercase">Preview:</span>
                        <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                            {isPrintDecimalsEnabled ? 'Rs. 1,234.50' : 'Rs. 1,235'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <Toggle
                        label="Print Fractional Decimals on Documents"
                        description="When disabled, all printed lines and totals are rounded to whole numbers without decimal places."
                        enabled={isPrintDecimalsEnabled}
                        onChange={(v) => setData('print_amount_decimal', v ? '1' : '0')}
                    />

                    <div className="p-3 bg-app rounded-xl border border-line text-2xs text-ink-muted flex items-start gap-2">
                        <Info size={14} className="text-brand-600 shrink-0 mt-0.5" />
                        <span>
                            To configure screen/system-wide number formatting instead of printouts, visit{' '}
                            <strong>Business &gt; Region &amp; Numbers</strong>.
                        </span>
                    </div>
                </div>
            </div>

            {/* Interactive Layout Designer & Realtime Preview */}
            <PrintSettingsSection data={data} setData={setData} saveSettings={saveSettings} />
        </div>
    );
}
