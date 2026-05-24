import React, { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
    ChevronLeft, ChevronRight, Maximize2, Minimize2, Printer,
    Layout, Type, FileText, Image as ImageIcon, Settings,
    AlignLeft, AlignCenter, AlignRight, Check, X, Palette,
    Monitor, Upload, Play
} from 'lucide-react';
import PrintPreview from '@/Components/PrintPreview';

/**
 * Advanced Print Settings Section
 * Features: Full Screen, Real-time Preview, Dark/Light Mode support, Custom Paper Sizes
 */
import { createPortal } from 'react-dom';

// ... (imports remain the same, ensuring createPortal is added)

export default function PrintSettingsSection({ data, setData }) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [previewMode, setPreviewMode] = useState('light'); // 'light' | 'dark'

    // Handle Full Screen Toggle - Adds flow-root to body to prevent scrolling background
    useEffect(() => {
        if (isFullScreen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isFullScreen]);

    /**
     * Test Print Handler
     * Renders the EXACT same PrintPreview React component (used in the settings preview panel)
     * to a static HTML string and opens it in a print window.
     * This guarantees 100% identical output between what you see in the preview and what prints.
     */
    const handleTestPrint = (currentData) => {
        const type = currentData._print_tab === 'thermal' ? 'thermal' : 'regular';
        const isThermal = type === 'thermal';

        // Determine paper/window dimensions (mirrors PrintPreview logic)
        const MM_TO_PX = 3;
        let width;
        if (isThermal) {
            if (currentData.thermal_page_size === '2inch') width = 58 * MM_TO_PX;
            else if (currentData.thermal_page_size === '4inch') width = 100 * MM_TO_PX;
            else width = 80 * MM_TO_PX;
        } else {
            const paperSizes = { 'A4': 210, 'A5': 148, 'Letter': 216, 'Legal': 216 };
            const pW = currentData.paper_size === 'Custom'
                ? (parseFloat(currentData.custom_paper_width) || 210)
                : (paperSizes[currentData.paper_size] || 210);
            width = currentData.paper_orientation === 'Landscape'
                ? (currentData.paper_size === 'A4' ? 297 : pW) * MM_TO_PX
                : pW * MM_TO_PX;
        }
        const windowWidth = Math.max(width + 80, isThermal ? 340 : 820);

        // Render the exact same PrintPreview component to static HTML
        const rootNode = document.createElement('div');
        const root = createRoot(rootNode);
        flushSync(() => {
            root.render(
                <PrintPreview data={currentData} type={type} mode="light" forPrint={true} />
            );
        });
        const previewHtml = rootNode.innerHTML;
        root.unmount();

        // Grab all Tailwind/app CSS from the current page's stylesheets
        // so the printed output looks exactly like the on-screen preview
        const allStyles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules || []).map(r => r.cssText).join('\n');
                } catch { return ''; }
            })
            .join('\n');

        const printDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Test Print — ${type === 'thermal' ? 'Thermal Receipt' : 'A4 Invoice'}</title>
  <style>
    ${allStyles}
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 16px; background: white; display: flex; justify-content: center; }
    @page {
      margin: 0;
      ${isThermal ? `size: ${width / MM_TO_PX}mm auto;` : `size: ${currentData.paper_size || 'A4'} ${currentData.paper_orientation === 'Landscape' ? 'landscape' : 'portrait'};`}
    }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  ${previewHtml}
</body>
</html>`;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const printDocument = iframe.contentWindow.document;
        printDocument.open();
        printDocument.write(printDoc);
        printDocument.close();

        // Delay slightly to let styles apply, then trigger print dialog
        setTimeout(() => {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();

                // Cleanup after printing to avoid memory leaks
                setTimeout(() => {
                    if (document.body.contains(iframe)) {
                        document.body.removeChild(iframe);
                    }
                }, 1000);
            }
        }, isThermal ? 500 : 300);
    };

    const containerClasses = isFullScreen
        ? "fixed inset-0 z-[99999] bg-slate-100 dark:bg-slate-900 flex flex-col w-screen h-screen"
        : "animate-in fade-in slide-in-from-bottom-2 duration-300 relative h-full flex flex-col";

    const content = (
        <div className={containerClasses}>
            {/* Top Toolbar */}
            <div className={`flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0 ${isFullScreen ? 'shadow-md' : 'rounded-t-2xl'}`}>
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Printer className="text-indigo-600" size={20} />
                        Print Configuration
                    </h2>

                    {/* Mode Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setData('_print_tab', 'regular')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${data._print_tab !== 'thermal'
                                ? 'bg-white dark:bg-slate-600 text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            A4 / Regular
                        </button>
                        <button
                            type="button"
                            onClick={() => setData('_print_tab', 'thermal')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${data._print_tab === 'thermal'
                                ? 'bg-white dark:bg-slate-600 text-emerald-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Thermal / POS
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Test Print Button */}
                    <button
                        type="button"
                        onClick={() => handleTestPrint(data)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-95 mr-2"
                        title="Send a test print with current settings (no need to save first)"
                    >
                        <Play size={14} className="fill-current" />
                        Test Print
                    </button>

                    {/* Preview Mode Toggle */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1 mr-2">
                        <button
                            type="button"
                            onClick={() => setPreviewMode('light')}
                            className={`p-1.5 rounded transition-colors ${previewMode === 'light' ? 'bg-white dark:bg-slate-600 text-amber-500 shadow-sm' : 'text-slate-400'}`}
                            title="Light Mode Preview"
                        >
                            <Monitor size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewMode('dark')}
                            className={`p-1.5 rounded transition-colors ${previewMode === 'dark' ? 'bg-slate-800 text-indigo-400 shadow-sm' : 'text-slate-400'}`}
                            title="Dark Mode Preview"
                        >
                            <Monitor size={14} className="fill-current" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title={sidebarCollapsed ? "Show Settings" : "Hide Settings"}
                    >
                        {sidebarCollapsed ? <Settings size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsFullScreen(!isFullScreen)}
                        className={`p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ${isFullScreen ? 'text-indigo-600 bg-indigo-50 dark:bg-slate-700' : ''}`}
                        title="Full Screen Mode"
                    >
                        {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden bg-slate-100 dark:bg-slate-900/50">
                {/* Scrollable Settings Sidebar */}
                <div className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-0 opacity-0' : 'w-96 opacity-100'}`}>
                    <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                        {data._print_tab !== 'thermal'
                            ? <RegularSettings data={data} setData={setData} />
                            : <ThermalSettings data={data} setData={setData} />
                        }
                    </div>
                </div>

                {/* Preview Area */}
                <div className={`flex-1 overflow-auto flex items-start justify-center p-8 transition-colors duration-300 ${previewMode === 'dark' ? 'bg-slate-900' : 'bg-slate-200'}`}>
                    <div className={`transform transition-all duration-300 ${sidebarCollapsed ? 'scale-100' : 'scale-95 origin-top'}`}>
                        <PrintPreview
                            data={data}
                            type={data._print_tab === 'thermal' ? 'thermal' : 'regular'}
                            mode={previewMode}
                        />
                    </div>
                </div>
            </div>
        </div>
    );

    if (isFullScreen) {
        return createPortal(content, document.body);
    }

    return content;
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

const RegularSettings = ({ data, setData }) => (
    <>
        <Section title="Page Layout" icon={Layout}>
            <ButtonGroup
                label="Paper Size"
                value={data.paper_size}
                onChange={v => setData('paper_size', v)}
                options={[
                    { value: 'A4', label: 'A4' },
                    { value: 'A5', label: 'A5' },
                    { value: 'Letter', label: 'Letter' },
                    { value: 'Legal', label: 'Legal' },
                    { value: 'Custom', label: 'Custom' },
                ]}
            />

            {data.paper_size === 'Custom' && (
                <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in slide-in-from-top-1">
                    <NumberInput label="Width (mm)" value={data.custom_paper_width} onChange={v => setData('custom_paper_width', v)} />
                    <NumberInput label="Height (mm)" value={data.custom_paper_height} onChange={v => setData('custom_paper_height', v)} />
                </div>
            )}

            <div className="mt-4">
                <ButtonGroup
                    label="Orientation"
                    value={data.paper_orientation}
                    onChange={v => setData('paper_orientation', v)}
                    options={[
                        { value: 'Portrait', label: 'Portrait' },
                        { value: 'Landscape', label: 'Landscape' },
                    ]}
                />
            </div>

            <div className="mt-4">
                <Label>Margins (mm)</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <NumberInput label="Top" value={data.margin_top} onChange={v => setData('margin_top', v)} />
                    <NumberInput label="Bottom" value={data.margin_bottom} onChange={v => setData('margin_bottom', v)} />
                    <NumberInput label="Left" value={data.margin_left} onChange={v => setData('margin_left', v)} />
                    <NumberInput label="Right" value={data.margin_right} onChange={v => setData('margin_right', v)} />
                </div>
            </div>
        </Section>

        <Section title="Visual Style" icon={Palette}>
            <div className="space-y-4">
                <div>
                    <Label>Theme Template</Label>
                    <select
                        value={data.print_theme}
                        onChange={e => setData('print_theme', e.target.value)}
                        className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                    >
                        <option value="modern">Modern (Default)</option>
                        <option value="classic">Classic Formal</option>
                        <option value="bold">Bold Header</option>
                    </select>
                </div>

                <ColorPicker
                    label="Accent Color"
                    value={data.print_theme_color}
                    onChange={v => setData('print_theme_color', v)}
                />

                <div className="grid grid-cols-2 gap-3">
                    <SelectInput label="Header Size" value={data.print_company_text_size} onChange={v => setData('print_company_text_size', v)}
                        options={[{ v: '2', l: 'Small' }, { v: '3', l: 'Medium' }, { v: '4', l: 'Large' }, { v: '5', l: 'Huge' }]} />
                    <SelectInput label="Body Text" value={data.print_invoice_text_size} onChange={v => setData('print_invoice_text_size', v)}
                        options={[{ v: '1', l: 'Tiny' }, { v: '2', l: 'Compact' }, { v: '3', l: 'Normal' }, { v: '4', l: 'Large' }]} />
                </div>
            </div>
        </Section>

        <Section title="Header Content" icon={FileText}>
            <TextInput label="Company Name" value={data.business_name} onChange={v => setData('business_name', v)} />
            <Toggle label="Show Logo" checked={data.print_logo} onChange={v => setData('print_logo', v)} />

            {data.print_logo && <LogoUploader data={data} setData={setData} />}

            <Toggle label="Repeat Header on All Pages" checked={data.print_header_all_pages} onChange={v => setData('print_header_all_pages', v)} />
            <Toggle label="Show Original/Duplicate Copy" checked={data.print_original_copy} onChange={v => setData('print_original_copy', v)} />
        </Section>

        <Section title="Table Columns" icon={Layout}>
            <div className="space-y-2">
                <ToggleBtn label="Serial No." checked={data.print_show_sno} onChange={v => setData('print_show_sno', v)} />
                <ToggleBtn label="HSN/SAC Code" checked={data.print_show_hsn} onChange={v => setData('print_show_hsn', v)} />
                <ToggleBtn label="Product Description" checked={data.print_show_description} onChange={v => setData('print_show_description', v)} />
                <ToggleBtn label="Units/Qty" checked={data.print_show_units} onChange={v => setData('print_show_units', v)} />
                <ToggleBtn label="MRP Column" checked={data.print_show_mrp} onChange={v => setData('print_show_mrp', v)} />
                <ToggleBtn label="Discount Column" checked={data.print_show_discount} onChange={v => setData('print_show_discount', v)} />
                <ToggleBtn label="Tax Breakdown" checked={data.print_tax_details} onChange={v => setData('print_tax_details', v)} />
            </div>
        </Section>

        <Section title="Totals & Footer" icon={AlignLeft}>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <ToggleBtn label="Total Qty" checked={data.print_total_quantity} onChange={v => setData('print_total_quantity', v)} />
                <ToggleBtn label="Decimal Amounts" checked={data.print_amount_decimal} onChange={v => setData('print_amount_decimal', v)} />
                <ToggleBtn label="Received Amt" checked={data.print_received_amount} onChange={v => setData('print_received_amount', v)} />
                <ToggleBtn label="Balance Due" checked={data.print_balance_amount} onChange={v => setData('print_balance_amount', v)} />
                <ToggleBtn label="Savings" checked={data.print_you_saved} onChange={v => setData('print_you_saved', v)} />
            </div>

            <SelectInput label="Amount in Words" value={data.print_amount_words} onChange={v => setData('print_amount_words', v)}
                options={[{ v: '0', l: 'None' }, { v: '1', l: 'English' }, { v: '2', l: 'Indian Format' }]} />

            <div className="space-y-2 mt-4">
                <TextInput label="Terms & Conditions" value={data.print_terms} onChange={v => setData('print_terms', v)} placeholder="E.g. No returns..." />
                <TextInput label="Signature Text" value={data.print_signature_text} onChange={v => setData('print_signature_text', v)} />
            </div>
        </Section>
    </>
);

const ThermalSettings = ({ data, setData }) => (
    <>
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 mb-6">
            <Toggle
                label="Set as Default Printer"
                checked={data.default_print_type === 'thermal'}
                onChange={v => setData('default_print_type', v ? 'thermal' : 'regular')}
                color="emerald"
            />
        </div>

        <Section title="Paper Format" icon={FileText}>
            <ButtonGroup
                label="Roll Width"
                value={data.thermal_page_size}
                onChange={v => setData('thermal_page_size', v)}
                options={[
                    { value: '2inch', label: '58mm (2")' },
                    { value: '3inch', label: '80mm (3")' },
                    { value: '4inch', label: '100mm (4")' },
                ]}
                color="emerald"
            />

            <div className="mt-4">
                <Label>Margins (mm)</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                    <NumberInput label="Top" value={data.margin_top} onChange={v => setData('margin_top', v)} />
                    <NumberInput label="Bottom" value={data.margin_bottom} onChange={v => setData('margin_bottom', v)} />
                    <NumberInput label="Left" value={data.margin_left} onChange={v => setData('margin_left', v)} />
                    <NumberInput label="Right" value={data.margin_right} onChange={v => setData('margin_right', v)} />
                </div>
            </div>

            <div className="mt-4">
                <Label>Font Size Scale</Label>
                <input
                    type="range" min="10" max="22" step="1"
                    value={data.thermal_font_size || 12}
                    onChange={e => setData('thermal_font_size', parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Compact</span>
                    <span className="font-bold text-emerald-600">{data.thermal_font_size}pt</span>
                    <span>Large</span>
                </div>
            </div>
        </Section>

        <Section title="Receipt Style" icon={Palette}>
            <Label>Theme Template</Label>
            <select
                value={data.print_theme}
                onChange={e => setData('print_theme', e.target.value)}
                className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
            >
                <option value="modern">Modern Receipt</option>
                <option value="classic">Classic Typewriter</option>
                <option value="bold">Bold Boxed</option>
            </select>

            <div className="mt-4">
                <Toggle label="Show Logo" checked={data.print_logo} onChange={v => setData('print_logo', v)} color="emerald" />
                {data.print_logo && <LogoUploader data={data} setData={setData} />}
            </div>

            <div className="mt-4 space-y-2">
                <ToggleBtn label="Bold Text Mode" checked={data.thermal_use_bold} onChange={v => setData('thermal_use_bold', v)} color="emerald" />
                <ToggleBtn label="Show Batch Codes" checked={data.thermal_show_batch} onChange={v => setData('thermal_show_batch', v)} color="emerald" />
                <ToggleBtn label="Show Expiry Dates" checked={data.thermal_show_expiry} onChange={v => setData('thermal_show_expiry', v)} color="emerald" />
            </div>
        </Section>

        <Section title="Columns & Content" icon={Layout}>
            <div className="space-y-2">
                <ToggleBtn label="Label Headers" checked={data.thermal_show_headers} onChange={v => setData('thermal_show_headers', v)} color="emerald" />
                <ToggleBtn label="Show Serial No." checked={data.thermal_show_sno} onChange={v => setData('thermal_show_sno', v)} color="emerald" />
                <ToggleBtn label="Show Units" checked={data.thermal_show_units} onChange={v => setData('thermal_show_units', v)} color="emerald" />
                <ToggleBtn label="Item Description" checked={data.thermal_show_description} onChange={v => setData('thermal_show_description', v)} color="emerald" />
                <ToggleBtn label="MRP Prices" checked={data.thermal_show_mrp} onChange={v => setData('thermal_show_mrp', v)} color="emerald" />
                <ToggleBtn label="Discounts (%)" checked={data.print_show_discount} onChange={v => setData('print_show_discount', v)} color="emerald" />
                <ToggleBtn label="Tax Details" checked={data.print_tax_details} onChange={v => setData('print_tax_details', v)} color="emerald" />
                <ToggleBtn label="Show Barcode" checked={data.thermal_show_barcode !== false} onChange={v => setData('thermal_show_barcode', v)} color="emerald" />
            </div>
        </Section>

        <Section title="Totals & Footer" icon={AlignLeft}>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <ToggleBtn label="Total Qty" checked={data.print_total_quantity} onChange={v => setData('print_total_quantity', v)} color="emerald" />
                <ToggleBtn label="Decimal Amounts" checked={data.print_amount_decimal} onChange={v => setData('print_amount_decimal', v)} color="emerald" />
                <ToggleBtn label="Received Amt" checked={data.print_received_amount} onChange={v => setData('print_received_amount', v)} color="emerald" />
                <ToggleBtn label="Balance Due" checked={data.print_balance_amount} onChange={v => setData('print_balance_amount', v)} color="emerald" />
                <ToggleBtn label="Savings" checked={data.print_you_saved} onChange={v => setData('print_you_saved', v)} color="emerald" />
            </div>

            <SelectInput label="Amount in Words" value={data.print_amount_words} onChange={v => setData('print_amount_words', v)}
                options={[{ v: '0', l: 'None' }, { v: '1', l: 'English' }, { v: '2', l: 'Indian Format' }]} />

            <div className="space-y-4 mt-4">
                <TextInput label="Terms & Conditions (Bottom)" value={data.print_terms} onChange={v => setData('print_terms', v)} placeholder="E.g. No returns..." />

                <TextInput label="Custom Footer Message" value={data.thermal_custom_footer} onChange={v => setData('thermal_custom_footer', v)} placeholder="E.g. Follow us on Instagram!" />

                <TextInput label="Signature Text" value={data.print_signature_text} onChange={v => setData('print_signature_text', v)} />
            </div>
        </Section>

        <Section title="Hardware Actions" icon={Settings}>
            <Toggle label="Auto Cut Paper" checked={data.thermal_auto_cut} onChange={v => setData('thermal_auto_cut', v)} color="emerald" />
            <Toggle label="Open Cash Drawer" checked={data.thermal_open_drawer} onChange={v => setData('thermal_open_drawer', v)} color="emerald" />

            <div className="grid grid-cols-2 gap-3 mt-4">
                <NumberInput label="Extra Feed (Lines)" value={data.thermal_extra_lines} onChange={v => setData('thermal_extra_lines', v)} />
                <NumberInput label="Copies to Print" value={data.thermal_copies} onChange={v => setData('thermal_copies', v)} />
            </div>
        </Section>
    </>
);

// ----------------------------------------------------------------------
// UI PRIMITIVES
// ----------------------------------------------------------------------

const Section = ({ title, icon: Icon, children }) => (
    <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-700 pb-2">
            <Icon size={14} /> {title}
        </h3>
        <div className="px-1">{children}</div>
    </div>
);

const Label = ({ children }) => (
    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">{children}</div>
);

const ButtonGroup = ({ label, value, onChange, options, color = 'indigo' }) => (
    <div>
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-1">
            {options.map((opt) => (
                <button
                    type="button"
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`flex-1 min-w-[60px] py-2 px-1 text-xs font-bold rounded-lg border transition-all ${value === opt.value
                        ? color === 'emerald'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

const ToggleBtn = ({ label, checked, onChange, color = 'indigo' }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${checked
            ? color === 'emerald'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
    >
        <span className={`text-sm font-bold ${checked ? (color === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' : 'text-indigo-700 dark:text-indigo-400') : 'text-slate-600 dark:text-slate-400'}`}>
            {label}
        </span>
        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${checked
            ? color === 'emerald' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-transparent'
            }`}>
            <Check size={12} strokeWidth={4} />
        </div>
    </button>
);

const Toggle = ({ label, checked, onChange, color = 'indigo' }) => (
    <div className="flex items-center justify-between py-1">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-colors ${checked
                ? color === 'emerald' ? 'bg-emerald-500' : 'bg-indigo-500'
                : 'bg-slate-300 dark:bg-slate-600'
                }`}
        >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${checked ? 'left-6' : 'left-1'}`} />
        </button>
    </div>
);

const TextInput = ({ label, value, onChange, placeholder }) => (
    <div>
        <Label>{label}</Label>
        <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700 dark:text-white"
        />
    </div>
);

const NumberInput = ({ label, value, onChange }) => (
    <div>
        <Label>{label}</Label>
        <input
            type="number"
            value={value || 0}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono font-bold text-center"
        />
    </div>
);

const SelectInput = ({ label, value, onChange, options }) => (
    <div>
        <Label>{label}</Label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
        >
            {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
    </div>
);

// Basic accessible color picker row
const ColorPicker = ({ label, value, onChange }) => {
    const colors = [
        { c: '#0f172a', n: 'Black' },
        { c: '#4f46e5', n: 'Indigo' },
        { c: '#2563eb', n: 'Blue' },
        { c: '#0891b2', n: 'Cyan' },
        { c: '#059669', n: 'Emerald' },
        { c: '#dc2626', n: 'Red' },
        { c: '#d97706', n: 'Amber' },
        { c: '#7c3aed', n: 'Violet' },
        { c: '#db2777', n: 'Pink' },
        { c: '#57534e', n: 'Stone' },
    ];

    return (
        <div>
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-2">
                {colors.map((col) => (
                    <button
                        key={col.c}
                        onClick={() => onChange(col.c)}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${value === col.c ? 'border-indigo-500 ring-1 ring-offset-1 ring-indigo-500' : 'border-transparent'}`}
                        style={{ backgroundColor: col.c }}
                        title={col.n}
                    />
                ))}
            </div>
        </div>
    );
};

const LogoUploader = ({ data, setData }) => (
    <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <Label>Logo Image</Label>

        <div className="flex items-start gap-4 mt-2">
            {data.print_logo_path ? (
                <div className="relative group">
                    <img
                        src={data.print_logo_path}
                        alt="Logo Preview"
                        className="w-20 h-20 object-contain bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            setData(d => ({ ...d, print_logo_path: null, print_logo_file: null }));
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        title="Remove Logo"
                    >
                        <X size={12} />
                    </button>
                </div>
            ) : (
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 gap-1">
                    <ImageIcon size={20} />
                    <span className="text-[9px] font-bold">No Logo</span>
                </div>
            )}

            <div className="flex-1">
                <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                            setData(d => ({
                                ...d,
                                print_logo_file: file,
                                print_logo_path: URL.createObjectURL(file)
                            }));
                        }
                    }}
                />
                <label
                    htmlFor="logo-upload"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                >
                    <Upload size={14} />
                    {data.print_logo_path ? 'Change Logo' : 'Upload Logo'}
                </label>
                <p className="text-[10px] text-slate-400 mt-2 leading-tight">
                    Recommended: PNG with transparent background. Max 2MB.
                </p>
            </div>
        </div>
    </div>
);
