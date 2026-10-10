import React from 'react';
import { Printer, Smartphone, Cpu, Play, Check } from 'lucide-react';
import Toggle from '@/Components/Toggle';
import PremiumSelect from '@/Components/PremiumSelect';
import { rememberPrintType } from '@/Utils/printPreference';

const PRINT_TYPE_OPTIONS = [
    { value: 'regular', label: 'Regular A4 / Letter Document Printer' },
    { value: 'thermal', label: 'Thermal Roll Receipt Printer (POS)' }
];

const THERMAL_SIZE_OPTIONS = [
    { value: '2inch', label: '58mm (2-inch roll - 32 chars)' },
    { value: '3inch', label: '80mm (3-inch roll - 48 chars - Standard)' },
    { value: '4inch', label: '100mm (4-inch roll - browser printing)' }
];

function NumberBox({ value, fallback, min, max, onChange }) {
    const n = Number(value);
    const shown = value === undefined || value === null || value === '' || Number.isNaN(n) ? fallback : n;
    return (
        <input type="number" inputMode="numeric" min={min} max={max} value={shown}
               onChange={e => {
                   const v = parseInt(e.target.value, 10);
                   onChange(Number.isNaN(v) ? fallback : Math.min(max, Math.max(min, v)));
               }}
               className="w-20 rounded-lg border border-line bg-app px-2 py-1.5 text-sm text-ink text-center" />
    );
}

export default function PrinterDeviceSection({ data, setData }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Default Mode */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Printer and paper</h3>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Default POS Receipt Format</label>
                        <PremiumSelect
                            options={PRINT_TYPE_OPTIONS}
                            value={data.default_print_type || 'regular'}
                            onChange={(val) => { setData('default_print_type', val); rememberPrintType(val); }}
                            searchable={false}
                            placeholder="Select Printer Type"
                        />
                        <p className="text-3xs text-ink-muted">Chooses thermal or A4 layout. In browser mode, select the physical printer in the print dialog; direct device routing requires VenQore Station.</p>
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
                            description="For Station printing, configure automatic cutting in the printer driver."
                        />

                        <Toggle
                            enabled={data.thermal_open_drawer === true || data.thermal_open_drawer === '1'}
                            onChange={v => setData('thermal_open_drawer', v)}
                            label="Open the cash drawer after a cash sale"
                            description="Station uses the printer driver. Configure its cash-drawer action after printing; standalone drawer control is unavailable."
                        />

                        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-ink">Copies of each receipt</p>
                                <p className="text-xs text-ink-muted">Print 2 if you keep a copy for the shop, for example for credit sales.</p>
                            </div>
                            <NumberBox value={data.thermal_copies} fallback={1} min={1} max={5} onChange={v => setData('thermal_copies', v)} />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-4 py-3">
                            <div>
                                <p className="text-sm font-semibold text-ink">Blank lines at the end</p>
                                <p className="text-xs text-ink-muted">Extra space after the receipt so the cutter or tear bar does not cut through the message.</p>
                            </div>
                            <NumberBox value={data.thermal_extra_lines} fallback={3} min={0} max={10} onChange={v => setData('thermal_extra_lines', v)} />
                        </div>

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
