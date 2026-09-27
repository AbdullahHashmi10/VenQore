import React, { useState } from 'react';
import { ShoppingCart, RotateCcw, AlertTriangle, Heart, DollarSign } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import PremiumSelect from '@/Components/PremiumSelect';
import { useTermText } from '@/lib/terms';

export default function CheckoutReturnsSection({ data, setData }) {
    const tt = useTermText();
    const [acknowledgeOpenReturn, setAcknowledgeOpenReturn] = useState(false);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Register Checkout Rules */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Register Checkout Rules</h3>

                    <div className="divide-y divide-line">
                        <Toggle
                            enabled={data.pos_auto_fill_cash === true || data.pos_auto_fill_cash === '1'}
                            onChange={v => setData('pos_auto_fill_cash', v)}
                            label="Fill in the amount received"
                            description="When paying by cash, start with the exact bill amount. You can still change it."
                        />

                        <Toggle
                            enabled={data.cash_sale_default === '1' || data.cash_sale_default === true}
                            onChange={v => setData('cash_sale_default', v)}
                            label="Default to 'Cash Sale'"
                            description="Pre-select Cash payment mode instead of asking for tender method during checkout."
                        />

                        <Toggle
                            enabled={Boolean(data.charity_enabled)}
                            onChange={v => setData('charity_enabled', v)}
                            label="Show charity button at checkout"
                            description="Add a charity button to the sales screen for recording donations."
                        />

                        <Toggle
                            enabled={data.stop_sale_negative_stock === '0' || data.stop_sale_negative_stock === false || data.stop_sale_negative_stock === 0}
                            onChange={v => setData('stop_sale_negative_stock', !v)}
                            label="Allow Negative Stock (Overselling)"
                            description="Permits finalizing checkout even when inventory level is 0 or negative."
                            variant="danger"
                        />
                    </div>
                </div>

                {/* Right Card: Total Rounding & Returns */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Round the final bill</h3>

                    {/* Round off totals */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-ink">How to round the amount due</label>
                            <span className="text-3xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded">
                                Cash Checkout Rule
                            </span>
                        </div>
                        <p className="text-xs text-ink-muted">
                            Choose how to round the final amount a customer pays. This does not change item prices or the decimal display setting.
                        </p>

                        <div className="grid grid-cols-5 gap-1.5 max-w-md w-full bg-app p-1.5 rounded-xl border border-line pt-2">
                            {[
                                { value: 'none', label: 'None' },
                                { value: '0', label: 'Whole' },
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
                                        className={`py-1.5 px-1 text-center font-bold text-2xs rounded-lg transition-all ${
                                            isActive
                                                ? 'bg-brand-600 text-white shadow-xs'
                                                : 'text-ink-muted hover:text-ink hover:bg-surface'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Return Policy */}
                    <div className="space-y-3 pt-3 border-t border-line">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Rules for returns</h4>
                        
                        <div className="space-y-1.5">
                            <label className="text-2xs font-bold text-ink">What must staff provide for a return?</label>
                            <PremiumSelect
                                options={[
                                    { value: 'reference', label: 'Reference Number Required (Strict)' },
                                    { value: 'customer_or_reference', label: tt('Customer or Reference') },
                                    { value: 'open', label: 'Open Return — No Reference Needed' }
                                ]}
                                value={data.pos_return_mode || 'reference'}
                                onChange={(val) => {
                                    setData('pos_return_mode', val);
                                    if (val !== 'open') setAcknowledgeOpenReturn(false);
                                }}
                                searchable={false}
                                placeholder="Select Return Mode"
                            />
                        </div>

                        {data.pos_return_mode === 'open' && (
                            <div className="p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl space-y-2 text-xs text-amber-800 dark:text-amber-300">
                                <p className="font-bold flex items-center gap-1.5">
                                    <AlertTriangle size={14} /> Open Returns Warning
                                </p>
                                <p className="text-3xs text-amber-700 dark:text-amber-400">
                                    Open returns cannot be verified against original invoice sales. Staff are responsible for authenticating items.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div className="space-y-1">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Return Window</label>
                                <div className="flex items-center gap-1.5">
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.pos_return_window || ''}
                                        onChange={(e) => setData('pos_return_window', e.target.value)}
                                        placeholder="e.g. 14"
                                        className="w-full px-3 py-1.5 bg-app border border-line rounded-xl text-xs font-bold text-ink outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                    <span className="text-2xs font-bold text-ink-muted">days</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Expired Action</label>
                                <div className="flex bg-app p-1 rounded-xl border border-line">
                                    <button
                                        type="button"
                                        onClick={() => setData('pos_return_window_behavior', 'warn')}
                                        className={`flex-1 py-1 text-3xs font-bold rounded-lg transition-all ${
                                            (data.pos_return_window_behavior || 'warn') === 'warn'
                                                ? 'bg-surface text-brand-600 dark:text-brand-400 shadow-xs'
                                                : 'text-ink-muted'
                                        }`}
                                    >
                                        Warn
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('pos_return_window_behavior', 'block')}
                                        className={`flex-1 py-1 text-3xs font-bold rounded-lg transition-all ${
                                            data.pos_return_window_behavior === 'block'
                                                ? 'bg-surface text-brand-600 dark:text-brand-400 shadow-xs'
                                                : 'text-ink-muted'
                                        }`}
                                    >
                                        Block
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
