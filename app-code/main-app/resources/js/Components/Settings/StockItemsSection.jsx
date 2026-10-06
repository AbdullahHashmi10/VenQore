import React, { useState } from 'react';
import { Package, Barcode, Layers, DollarSign, Bell, ShieldAlert, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import Modal from '@/Components/Modal';

export default function StockItemsSection({ data, setData }) {
    const isCurrentlyTracking = data.stock_maintenance !== '0' && data.stock_maintenance !== false;
    const [showDisableModal, setShowDisableModal] = useState(false);

    const handleToggleStockTracking = (enabled) => {
        if (!enabled) {
            // Cautious confirmation before turning OFF stock tracking
            setShowDisableModal(true);
        } else {
            setData('stock_maintenance', true);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Inventory Tracking Mode */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Track your stock</h3>

                    <div className="divide-y divide-line">
                        <div className="py-2 space-y-2">
                            <Toggle
                                enabled={isCurrentlyTracking}
                                onChange={handleToggleStockTracking}
                                label="Track stock quantities"
                                description="Update available quantities when you buy or sell items."
                                icon={Package}
                            />

                            {!isCurrentlyTracking && (
                                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/70 rounded-xl space-y-1 animate-in fade-in">
                                    <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-200 font-bold text-xs">
                                        <Sparkles size={13} className="text-teal-600 dark:text-teal-400" />
                                        <span>Unlimited Selling Mode Active</span>
                                    </div>
                                    <p className="text-3xs text-teal-700 dark:text-teal-300 leading-normal">
                                        Inventory limits and out-of-stock warnings are disabled. Your staff can sell products freely, and your Inventory page tracks <strong>Total Units Sold</strong>.
                                    </p>
                                </div>
                            )}
                        </div>

                        <Toggle
                            enabled={data.barcode_scan_enabled === true || data.barcode_scan_enabled === '1'}
                            onChange={v => setData('barcode_scan_enabled', v)}
                            label="Use a barcode scanner"
                            description="Scan items on sales and purchase screens."
                            icon={Barcode}
                        />

                        <Toggle
                            enabled={data.batch_tracking_enabled === true || data.batch_tracking_enabled === '1'}
                            onChange={v => setData('batch_tracking_enabled', v)}
                            label="Track batches and expiry dates"
                            description="Track distinct inventory lots with manufacturing dates, expiry dates, and lot numbers."
                            icon={Layers}
                        />
                    </div>
                </div>

                {/* Right Card: Pricing Tiers & Safety Alerts */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Prices and low-stock warnings</h3>

                    <div className="divide-y divide-line">
                        <Toggle
                            enabled={data.wholesale_price_enabled === true || data.wholesale_price_enabled === '1'}
                            onChange={v => setData('wholesale_price_enabled', v)}
                            label="Wholesale prices"
                            description="Set separate prices for customers who buy in bulk."
                            icon={DollarSign}
                        />

                        <Toggle
                            enabled={data.low_stock_alerts === true || data.low_stock_alerts === '1'}
                            onChange={v => setData('low_stock_alerts', v)}
                            label="Show low-stock warnings"
                            description="Display in-app warning highlights when stock drops below minimum threshold."
                            icon={Bell}
                        />

                        <div className="py-3.5 space-y-1.5">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">
                                Warn when stock falls to
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    value={data.low_stock_threshold || 10}
                                    onChange={(e) => setData('low_stock_threshold', parseInt(e.target.value, 10) || 0)}
                                    className="w-32 px-3.5 py-2 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                                />
                                <span className="text-xs font-bold text-ink-muted">units</span>
                            </div>
                            <p className="text-3xs text-ink-muted">Items with on-hand quantity at or below this value trigger alerts.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cautious Confirmation Modal for Disabling Stock Maintenance */}
            <Modal show={showDisableModal} onClose={() => setShowDisableModal(false)} maxWidth="md">
                <div className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-2xl shrink-0">
                            <ShieldAlert size={28} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-ink">Disable Stock Quantity Tracking?</h2>
                            <p className="text-xs text-ink-muted mt-1">
                                Switch to Unlimited / Restaurant Selling Mode. Please review how this affects your store:
                            </p>
                        </div>
                    </div>

                    <div className="bg-app border border-line rounded-xl p-4 space-y-3 text-xs">
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-ink">Sell Freely Without Stock Limits:</strong>
                                <p className="text-ink-secondary mt-0.5">
                                    You can sell as many products as you want in POS, Dine-In, Delivery, and Takeaway without purchasing stock or creating purchase orders.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-ink">No Out-of-Stock or Negative Warnings:</strong>
                                <p className="text-ink-secondary mt-0.5">
                                    Cashiers and servers will never be blocked or nagged by out-of-stock or negative inventory warnings.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-ink">Units Sold Displayed in Inventory:</strong>
                                <p className="text-ink-secondary mt-0.5">
                                    In your Inventory catalog, items will display <strong>Total Units Sold</strong> instead of on-hand inventory levels.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <strong className="text-ink">Stock Deductions Paused:</strong>
                                <p className="text-ink-secondary mt-0.5">
                                    Existing inventory levels won't be deducted on sales while tracking is turned off.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setShowDisableModal(false)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold text-ink-secondary bg-sunken hover:bg-interactive-hover transition-colors"
                        >
                            Keep Tracking Stock
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setData('stock_maintenance', '0');
                                setShowDisableModal(false);
                            }}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                        >
                            <Sparkles size={14} />
                            Confirm & Enable Unlimited Selling
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
