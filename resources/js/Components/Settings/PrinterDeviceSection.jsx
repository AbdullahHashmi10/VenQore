import React from 'react';
import { Printer, Smartphone, Cpu, Play, Check } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import PremiumSelect from '@/Components/PremiumSelect';

const PRINT_TYPE_OPTIONS = [
    { value: 'regular', label: 'Regular A4 / Letter Document Printer' },
    { value: 'thermal', label: 'Thermal Roll Receipt Printer (POS)' }
];

const THERMAL_SIZE_OPTIONS = [
    { value: '2inch', label: '58mm (2-inch roll - 32 chars)' },
    { value: '3inch', label: '80mm (3-inch roll - 48 chars - Standard)' },
    { value: '4inch', label: '100mm (4-inch roll - 64 chars)' }
];

export default function PrinterDeviceSection({ data, setData }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Default Mode */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Printer and paper</h3>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Default POS Print Destination</label>
                        <PremiumSelect
                            options={PRINT_TYPE_OPTIONS}
                            value={data.default_print_type || 'regular'}
                            onChange={(val) => setData('default_print_type', val)}
                            searchable={false}
                            placeholder="Select Printer Type"
                        />
                        <p className="text-3xs text-ink-muted">Choose whether checkout automatically opens thermal slip or full A4 preview.</p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-line">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Thermal Paper Roll Width</label>
                        <PremiumSelect
                            options={THERMAL_SIZE_OPTIONS}
                            value={data.thermal_page_size || '3inch'}
                            onChange={(val) => setData('thermal_page_size', val)}
                            searchable={false}
                            placeholder="Select Paper Size"
                        />
                    </div>
                </div>

                {/* Right Card: Peripherals & ESC/POS Actions */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">What the printer does after a sale</h3>

                    <div className="divide-y divide-line">
                        <Toggle
                            enabled={data.thermal_auto_cut !== '0' && data.thermal_auto_cut !== false}
                            onChange={v => setData('thermal_auto_cut', v)}
                            label="Cut the receipt automatically"
                            description="Cut the paper after each receipt, if your printer supports it."
                        />

                        <Toggle
                            enabled={data.thermal_open_drawer === true || data.thermal_open_drawer === '1'}
                            onChange={v => setData('thermal_open_drawer', v)}
                            label="Open the cash drawer after a cash sale"
                            description="Open a connected cash drawer when a cash sale is completed."
                        />

                        <Toggle
                            enabled={data.thermal_use_bold !== '0' && data.thermal_use_bold !== false}
                            onChange={v => setData('thermal_use_bold', v)}
                            label="Make receipt headings bolder"
                            description="Print darker headings that are easier to read."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
