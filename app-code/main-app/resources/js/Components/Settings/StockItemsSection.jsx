import React from 'react';
import { Package, Barcode, Layers, DollarSign, Bell } from 'lucide-react';
import Toggle from '@/Components/Toggle';

export default function StockItemsSection({ data, setData }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Inventory Tracking Mode */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Track your stock</h3>

                    <div className="divide-y divide-line">
                        <Toggle
                            enabled={data.stock_maintenance !== '0' && data.stock_maintenance !== false}
                            onChange={v => setData('stock_maintenance', v)}
                            label="Track stock quantities"
                            description="Update available quantities when you buy or sell items."
                            icon={Package}
                        />

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
        </div>
    );
}
