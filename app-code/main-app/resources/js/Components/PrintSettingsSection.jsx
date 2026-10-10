import PrintService from '@/Utils/PrintService';
import { rememberPrintType } from '@/Utils/printPreference';
import React, { useState, useEffect } from 'react';
import {
 ChevronLeft, ChevronRight, Maximize2, Minimize2, Printer,
 Layout, Type, FileText, Image as ImageIcon, Settings,
 AlignLeft, AlignCenter, AlignRight, Check, X, Palette,
 Monitor, Upload, Play, Save
} from 'lucide-react';
import PrintPreview from '@/Components/PrintPreview';
import Swal from 'sweetalert2';

/**
 * Advanced Print Settings Section
 * Features: Full Screen, Real-time Preview, Dark/Light Mode support, Custom Paper Sizes
 */
import { createPortal } from 'react-dom';

import { vq } from '@/theme/runtime';
import { useTermText } from '@/lib/terms';
import { useAMDStation, AMDStation, isAMDStationAvailable } from '@/Utils/AMDStation';
const isTruthy = (val, defaultValue = false) => {
    if (val === undefined || val === null || val === '') return defaultValue;
    if (typeof val === 'boolean') return val;
    if (val === '1' || val === 1 || val === 'true') return true;
    if (val === '0' || val === 0 || val === 'false') return false;
    return Boolean(val);
};

export default function PrintSettingsSection({ data, setData, saveSettings }) {
 const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
 const [isFullScreen, setIsFullScreen] = useState(false);
 const [previewMode, setPreviewMode] = useState('light'); // 'light' | 'dark'
 const [activePrintTab, setActivePrintTab] = useState(() => {
   // Prefer the saved DB value (comes from Inertia props) over localStorage.
   // localStorage may be stale if settings were changed from another session/tab.
   const dbType = data?.default_print_type;
   if (['thermal', 'regular', 'b2b'].includes(dbType)) {
     return dbType;
   }
   const saved = typeof window !== 'undefined' ? window.localStorage.getItem('active_printer_subtab') : null;
   if (['thermal', 'regular', 'b2b', 'hardware'].includes(saved)) {
     return saved;
   }
   return 'regular';
 });

 // Keep activePrintTab in sync when data.default_print_type changes
 // (e.g., after user saves settings and Inertia reloads props, or toggle is clicked)
 useEffect(() => {
   const dbType = data?.default_print_type;
   if (['thermal', 'regular', 'b2b'].includes(dbType) && dbType !== activePrintTab && activePrintTab !== 'hardware') {
     setActivePrintTab(dbType);
   }
 }, [data?.default_print_type]);

 // Persist printer sub-tab selection (thermal vs regular) across refreshes and sync with default format
 const handleSubtabChange = (tabName) => {
   setActivePrintTab(tabName);
   if (typeof window !== 'undefined') {
     window.localStorage.setItem('active_printer_subtab', tabName);
   }
   if (['thermal', 'regular', 'b2b'].includes(tabName)) {
     setData('default_print_type', tabName);
     rememberPrintType(tabName);
     if (typeof window !== 'undefined' && window.amdSettings) {
       window.amdSettings.default_print_type = tabName;
     }
   }
 };

 // Handle Full Screen Toggle - Adds flow-root to body to prevent scrolling background & listens for Escape (U05)
 useEffect(() => {
 if (isFullScreen) {
 document.body.style.overflow = 'hidden';
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 setIsFullScreen(false);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => {
 document.body.style.overflow = '';
 window.removeEventListener('keydown', handleKeyDown);
 };
 } else {
 document.body.style.overflow = '';
 }
 }, [isFullScreen]);

 // Test through the same pipeline as actual transactions.
 const handleTestPrint = async (currentData) => {
   const type = ['thermal', 'regular', 'b2b'].includes(activePrintTab) ? activePrintTab : currentData.default_print_type;
   try {
     const result = await PrintService.printInvoice({
       reference_number: 'TEST-RECEIPT', customer: { name: 'Test Customer' },
       items: [{ name: 'Test Item', quantity: 2, unit_price: 50, net_amount: 100 }],
       subtotal: 100, total: 100, paid_amount: 100,
     }, currentData, type, { openDrawer: false });
     if (result?.success === false) Swal.fire('Test print failed', result.error, 'error');
   } catch (error) {
     Swal.fire('Test print failed', error.message, 'error');
   }
 };

 const content = (
 <div id="fullscreen-portal-root" role={isFullScreen ? 'dialog' : undefined} aria-modal={isFullScreen ? 'true' : undefined} aria-label={isFullScreen ? 'Fullscreen Print Designer' : undefined} className={`flex flex-col bg-app border border-line rounded-2xl overflow-hidden shadow-sm transition-all duration-slow ${isFullScreen ? 'fixed inset-0 z-command rounded-none' : 'min-h-[560px] h-[calc(100vh-14rem)]'}`}>
 {/* Header Toolbar */}
 <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-line bg-surface z-10">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2 text-ink">
 <Printer size={18} className="text-brand-500" />
 <span className="font-bold text-sm tracking-tight">Print preview</span>
 </div>

 {/* Format Tabs (Thermal vs Regular vs B2B) */}
 <div className="flex bg-sunken rounded-lg p-1">
 <button
 type="button"
 onClick={() => handleSubtabChange('regular')}
 className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activePrintTab === 'regular'
 ? 'bg-sunken text-brand-600 shadow-sm'
 : 'text-ink-muted hover:text-ink-secondary'}`}
 >
 Standard A4/A5
 </button>
 <button
 type="button"
 onClick={() => handleSubtabChange('thermal')}
 className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activePrintTab === 'thermal'
 ? 'bg-sunken text-emerald-600 shadow-sm'
 : 'text-ink-muted hover:text-ink-secondary'}`}
 >
 Thermal / POS
 </button>
 <button
 type="button"
 onClick={() => handleSubtabChange('b2b')}
 className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activePrintTab === 'b2b'
 ? 'bg-sunken text-indigo-600 shadow-sm'
 : 'text-ink-muted hover:text-ink-secondary'}`}
 >
 Invoice &amp; PDF (B2B)
 </button>
 <button
 type="button"
 onClick={() => handleSubtabChange('hardware')}
 className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activePrintTab === 'hardware'
 ? 'bg-sunken text-amber-600 shadow-sm'
 : 'text-ink-muted hover:text-ink-secondary'}`}
 >
 Hardware &amp; Station
 </button>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* Test Print Button */}
 <button
 type="button"
 onClick={() => handleTestPrint(data)}
 className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 mr-2"
 title="Send a test print with current settings (no need to save first)"
 >
 <Play size={14} className="fill-current" />
 Test Print
 </button>

 {/* Save Changes Button (Print Settings specific with resistant warning) */}
 <button
 type="button"
 onClick={() => {
 if (saveSettings) {
 Swal.fire({
 title: 'Save Printer Settings?',
 text: 'Are you sure you want to save and apply the new printer configurations across the system?',
 icon: 'question',
 showCancelButton: true,
 confirmButtonText: 'Yes, Save Settings',
 cancelButtonText: 'Cancel',
 background: vq.slate[800],
 color: '#fff',
 confirmButtonColor: vq.indigo[600],
 target: isFullScreen ? document.getElementById('fullscreen-portal-root') || 'body' : 'body'
 }).then((result) => {
 if (result.isConfirmed) {
 const chosenType = ['thermal', 'regular', 'b2b'].includes(activePrintTab)
   ? activePrintTab
   : (data?.default_print_type || 'regular');
 setData('default_print_type', chosenType);
 rememberPrintType(chosenType);
 if (typeof window !== 'undefined' && window.amdSettings) {
   window.amdSettings.default_print_type = chosenType;
 }
 saveSettings(null, 'document_layouts', { default_print_type: chosenType });
 }
 });
 }
 }}
 className="flex items-center gap-2 px-4 py-2 bg-gradient-brand text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 mr-2"
 title="Save and apply current printer settings"
 >
 <Save size={14} />
 Save Printer Settings
 </button>

 {/* Preview Mode Toggle */}
 <div className="flex items-center gap-1 bg-sunken rounded-lg p-1 mr-2">
 <button
 type="button"
 onClick={() => setPreviewMode('light')}
 className={`p-1.5 rounded transition-colors ${previewMode === 'light' ? 'bg-sunken text-amber-500 shadow-sm' : 'text-ink-muted'}`}
 title="Light Mode Preview"
 >
 <Monitor size={14} />
 </button>
 <button
 type="button"
 onClick={() => setPreviewMode('dark')}
 className={`p-1.5 rounded transition-colors ${previewMode === 'dark' ? 'bg-neutral-800 text-brand-400 shadow-sm' : 'text-ink-muted'}`}
 title="Dark Mode Preview"
 >
 <Monitor size={14} className="fill-current" />
 </button>
 </div>

 <button
 type="button"
 onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
 className="p-2 text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg transition-colors"
 title={sidebarCollapsed ? "Show Settings" : "Hide Settings"}
 >
 {sidebarCollapsed ? <Settings size={18} /> : <ChevronLeft size={18} />}
 </button>

 <button
 type="button"
 onClick={() => setIsFullScreen(!isFullScreen)}
 className={`p-2 text-ink-muted hover:bg-interactive-hover dark:hover:bg-interactive-hover rounded-lg transition-colors ${isFullScreen ? 'text-brand-600 bg-brand-50 dark:bg-raised' : ''}`}
 title="Full Screen Mode"
 >
 {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
 </button>
 </div>
 </div>

 {/* Main Content Area */}
 <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-sunken">
 {/* Scrollable Settings Sidebar */}
 <div className={`bg-surface border-r border-line transition-all duration-slow flex flex-col ${sidebarCollapsed ? 'max-lg:hidden lg:w-0 opacity-0' : 'w-full lg:w-96 opacity-100'}`}>
 <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
 {activePrintTab === 'thermal'
 ? <ThermalSettings data={data} setData={setData} activePrintTab={activePrintTab} onSetDefaultType={handleSubtabChange} />
 : activePrintTab === 'b2b'
 ? <B2BSettings data={data} setData={setData} activePrintTab={activePrintTab} onSetDefaultType={handleSubtabChange} />
 : activePrintTab === 'hardware'
 ? <HardwareSettings data={data} setData={setData} />
 : <RegularSettings data={data} setData={setData} activePrintTab={activePrintTab} onSetDefaultType={handleSubtabChange} />
 }
 </div>
 </div>

 {/* Preview Area */}
 <div className={`flex-1 overflow-auto flex items-start justify-center p-4 sm:p-8 transition-colors duration-slow ${previewMode === 'dark' ? 'bg-neutral-900' : 'bg-sunken'}`}>
 <div className={`transform transition-all duration-slow ${sidebarCollapsed ? 'scale-100' : 'scale-95 origin-top'}`}>
 <PrintPreview
 data={data}
 type={activePrintTab === 'thermal' ? 'thermal' : 'regular'}
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

const RegularSettings = ({ data, setData, activePrintTab, onSetDefaultType }) => {
 const tt = useTermText();
 return (
 <>
 <div className="p-4 bg-brand-50 dark:bg-brand-900/10 rounded-xl border border-brand-100 dark:border-brand-800/30 mb-6">
 <Toggle
 label="Set as Default Receipt Format"
 checked={data.default_print_type === 'regular' || (!data.default_print_type && activePrintTab === 'regular')}
 onChange={v => { const type = v ? 'regular' : 'thermal'; onSetDefaultType ? onSetDefaultType(type) : (setData('default_print_type', type), rememberPrintType(type)); }}
 color="indigo"
 />
 </div>

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

 <div className="grid grid-cols-2 gap-3 mt-4">
 <NumberInput label="Min Item Rows" value={data.print_min_item_rows} onChange={v => setData('print_min_item_rows', v)} />
 <NumberInput label="Extra Top Space (mm)" value={data.print_extra_space_top} onChange={v => setData('print_extra_space_top', v)} />
 </div>
 </Section>

 <Section title="Visual Style" icon={Palette}>
 <div className="space-y-4">
 <div>
 <Label>Theme Template</Label>
 <select
 value={data.print_theme}
 onChange={e => setData('print_theme', e.target.value)}
 className="w-full mt-1 p-2 bg-sunken border border-line dark:border-line rounded-lg text-sm"
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
 <div className="text-xs text-ink-muted">Business name: <strong className="text-ink">{data.business_name}</strong>. Change it in Business Profile.</div>
 <Toggle label="Show Logo" checked={isTruthy(data.print_logo, true)} onChange={v => setData('print_logo', v)} />
 <Toggle label="Show Verification QR Code" checked={isTruthy(data.print_qr_code, true)} onChange={v => setData('print_qr_code', v)} />

 {data.print_logo && <LogoUploader data={data} setData={setData} />}

 <Toggle label="Repeat Header on All Pages" checked={isTruthy(data.print_header_all_pages, true)} onChange={v => setData('print_header_all_pages', v)} />
 <Toggle label="Show Original/Duplicate Copy" checked={isTruthy(data.print_original_copy, false)} onChange={v => setData('print_original_copy', v)} />
 </Section>

 <Section title={tt('Table Columns')} icon={Layout}>
 <div className="space-y-2">
 <ToggleBtn label="Serial No." checked={isTruthy(data.print_show_sno, true)} onChange={v => setData('print_show_sno', v)} />
 <ToggleBtn label="HSN/SAC Code" checked={isTruthy(data.print_show_hsn, false)} onChange={v => setData('print_show_hsn', v)} />
 <ToggleBtn label={tt('Product Description')} checked={isTruthy(data.print_show_description, true)} onChange={v => setData('print_show_description', v)} />
 <ToggleBtn label="Units/Qty" checked={isTruthy(data.print_show_units, true)} onChange={v => setData('print_show_units', v)} />
 <ToggleBtn label="MRP Column" checked={isTruthy(data.print_show_mrp, false)} onChange={v => setData('print_show_mrp', v)} />
 <ToggleBtn label="Discount Column" checked={isTruthy(data.print_show_discount, false)} onChange={v => setData('print_show_discount', v)} />
 <ToggleBtn label="Free Qty (1+1)" checked={isTruthy(data.print_show_free_qty, false)} onChange={v => setData('print_show_free_qty', v)} />
 <ToggleBtn label="Show Batch Codes" checked={isTruthy(data.thermal_show_batch, false)} onChange={v => setData('thermal_show_batch', v)} />
 <ToggleBtn label="Show Expiry Dates" checked={isTruthy(data.thermal_show_expiry, false)} onChange={v => setData('thermal_show_expiry', v)} />
 <ToggleBtn label="Tax Breakdown" checked={isTruthy(data.print_tax_details, true)} onChange={v => setData('print_tax_details', v)} />
 <ToggleBtn label="Show Barcode" checked={isTruthy(data.thermal_show_barcode, true)} onChange={v => setData('thermal_show_barcode', v)} />
 </div>
 </Section>

 <Section title="Totals & Footer" icon={AlignLeft}>
 <div className="grid grid-cols-2 gap-2 mb-4">
 <ToggleBtn label="Total Qty" checked={isTruthy(data.print_total_quantity, true)} onChange={v => setData('print_total_quantity', v)} />
 <ToggleBtn label="Decimal Amounts" checked={isTruthy(data.print_amount_decimal, true)} onChange={v => setData('print_amount_decimal', v)} />
 <ToggleBtn label="Received Amt" checked={isTruthy(data.print_received_amount, true)} onChange={v => setData('print_received_amount', v)} />
 <ToggleBtn label="Balance Due" checked={isTruthy(data.print_balance_amount, true)} onChange={v => setData('print_balance_amount', v)} />
 <ToggleBtn label="Savings" checked={isTruthy(data.print_you_saved, false)} onChange={v => setData('print_you_saved', v)} />
 <ToggleBtn label="Prev Balance" checked={isTruthy(data.print_show_previous_balance, false)} onChange={v => setData('print_show_previous_balance', v)} />
 <ToggleBtn label="Delivery Charges" checked={isTruthy(data.print_show_delivery_charge, true)} onChange={v => setData('print_show_delivery_charge', v)} />
 <ToggleBtn label="Extra Charges" checked={isTruthy(data.print_show_extra_charge, true)} onChange={v => setData('print_show_extra_charge', v)} />
 <ToggleBtn label="Party Balance" checked={isTruthy(data.print_party_balance, false)} onChange={v => setData('print_party_balance', v)} />
 <ToggleBtn label="Amount Grouping" checked={isTruthy(data.print_amount_grouping, true)} onChange={v => setData('print_amount_grouping', v)} />
 <ToggleBtn label="Received By" checked={isTruthy(data.print_received_by, false)} onChange={v => setData('print_received_by', v)} />
 <ToggleBtn label="Delivered By" checked={isTruthy(data.print_delivered_by, false)} onChange={v => setData('print_delivered_by', v)} />
 <ToggleBtn label="Acknowledgement" checked={isTruthy(data.print_acknowledgement, false)} onChange={v => setData('print_acknowledgement', v)} />
 <ToggleBtn label="Print Description" checked={isTruthy(data.print_description, true)} onChange={v => setData('print_description', v)} />
 </div>

 <SelectInput label="Amount in Words" value={data.print_amount_words} onChange={v => setData('print_amount_words', v)}
 options={[{ v: '0', l: 'None' }, { v: '1', l: 'English' }, { v: '2', l: 'Indian Format' }]} />

 <div className="space-y-4 mt-4">
 <TextInput label="Terms & Conditions (Bottom)" value={data.print_terms} onChange={v => setData('print_terms', v)} placeholder="E.g. No returns..." />
 <TextInput label="Custom Footer Message" value={data.thermal_custom_footer} onChange={v => setData('thermal_custom_footer', v)} placeholder="E.g. Follow us on Instagram!" />
 <TextInput label="Signature Text" value={data.print_signature_text} onChange={v => setData('print_signature_text', v)} />
 </div>
 </Section>
 </>
 );
};

const ThermalSettings = ({ data, setData, activePrintTab, onSetDefaultType }) => (
 <>
 <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30 mb-6">
 <Toggle
 label="Set as Default Receipt Format"
 checked={data.default_print_type === 'thermal'}
 onChange={v => { const type = v ? 'thermal' : 'regular'; onSetDefaultType ? onSetDefaultType(type) : (setData('default_print_type', type), rememberPrintType(type)); }}
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

 <div className="grid grid-cols-2 gap-3 mt-4">
 <NumberInput label="Margins Top/Bottom" value={data.margin_top} onChange={v => setData('margin_top', v)} />
 <NumberInput label="Custom Chars (line length)" value={data.thermal_custom_chars} onChange={v => setData('thermal_custom_chars', v)} />
 </div>

 <div className="mt-4">
 <Label>Margins (mm)</Label>
 <div className="grid grid-cols-2 gap-2 mt-1">
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
 className="w-full h-2 bg-sunken rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
 />
 <div className="flex justify-between text-xs text-ink-muted mt-1">
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
 className="w-full mt-1 p-2 bg-sunken border border-line dark:border-line rounded-lg text-sm"
 >
 <option value="modern">Modern Receipt</option>
 <option value="classic">Classic Typewriter</option>
 <option value="bold">Bold Boxed</option>
 </select>

 <div className="mt-4">
 <Toggle label="Show Logo" checked={isTruthy(data.print_logo, true)} onChange={v => setData('print_logo', v)} color="emerald" />
 <Toggle label="Show Verification QR Code" checked={isTruthy(data.print_qr_code, true)} onChange={v => setData('print_qr_code', v)} color="emerald" />
 {data.print_logo && <LogoUploader data={data} setData={setData} />}
 </div>

 <div className="mt-4 space-y-2">
 <ToggleBtn label="Bold Text Mode" checked={isTruthy(data.thermal_use_bold, true)} onChange={v => setData('thermal_use_bold', v)} color="emerald" />
 <ToggleBtn label="Show Batch Codes" checked={isTruthy(data.thermal_show_batch, false)} onChange={v => setData('thermal_show_batch', v)} color="emerald" />
 <ToggleBtn label="Show Expiry Dates" checked={isTruthy(data.thermal_show_expiry, false)} onChange={v => setData('thermal_show_expiry', v)} color="emerald" />
 </div>
 </Section>

 <Section title="Columns & Content" icon={Layout}>
 <div className="space-y-2">
 <ToggleBtn label="Label Headers" checked={isTruthy(data.thermal_show_headers, false)} onChange={v => setData('thermal_show_headers', v)} color="emerald" />
 <ToggleBtn label="Show Serial No." checked={isTruthy(data.thermal_show_sno, false)} onChange={v => setData('thermal_show_sno', v)} color="emerald" />
 <ToggleBtn label="Show Units" checked={isTruthy(data.thermal_show_units, false)} onChange={v => setData('thermal_show_units', v)} color="emerald" />
 <ToggleBtn label="Item Description" checked={isTruthy(data.thermal_show_description, false)} onChange={v => setData('thermal_show_description', v)} color="emerald" />
 <ToggleBtn label="MRP Prices" checked={isTruthy(data.thermal_show_mrp, false)} onChange={v => setData('thermal_show_mrp', v)} color="emerald" />
 <ToggleBtn label="Discounts (%)" checked={isTruthy(data.print_show_discount, false)} onChange={v => setData('print_show_discount', v)} color="emerald" />
 <ToggleBtn label="Free Qty (1+1)" checked={isTruthy(data.print_show_free_qty, false)} onChange={v => setData('print_show_free_qty', v)} color="emerald" />
 <ToggleBtn label="Tax Details" checked={isTruthy(data.print_tax_details, true)} onChange={v => setData('print_tax_details', v)} color="emerald" />
 <ToggleBtn label="Show Barcode" checked={isTruthy(data.thermal_show_barcode, true)} onChange={v => setData('thermal_show_barcode', v)} color="emerald" />
 <ToggleBtn label="Show MFG Date" checked={isTruthy(data.thermal_show_mfg_date, false)} onChange={v => setData('thermal_show_mfg_date', v)} color="emerald" />
 <ToggleBtn label="Show Size" checked={isTruthy(data.thermal_show_size, false)} onChange={v => setData('thermal_show_size', v)} color="emerald" />
 <ToggleBtn label="Show Model" checked={isTruthy(data.thermal_show_model, false)} onChange={v => setData('thermal_show_model', v)} color="emerald" />
 <ToggleBtn label="Show Serial (product)" checked={isTruthy(data.thermal_show_serial, false)} onChange={v => setData('thermal_show_serial', v)} color="emerald" />
 </div>
 </Section>

 <Section title="Totals & Footer" icon={AlignLeft}>
 <div className="grid grid-cols-2 gap-2 mb-4">
 <ToggleBtn label="Total Qty" checked={isTruthy(data.print_total_quantity, true)} onChange={v => setData('print_total_quantity', v)} color="emerald" />
 <ToggleBtn label="Decimal Amounts" checked={isTruthy(data.print_amount_decimal, true)} onChange={v => setData('print_amount_decimal', v)} color="emerald" />
 <ToggleBtn label="Received Amt" checked={isTruthy(data.print_received_amount, true)} onChange={v => setData('print_received_amount', v)} color="emerald" />
 <ToggleBtn label="Balance Due" checked={isTruthy(data.print_balance_amount, true)} onChange={v => setData('print_balance_amount', v)} color="emerald" />
 <ToggleBtn label="Savings" checked={isTruthy(data.print_you_saved, false)} onChange={v => setData('print_you_saved', v)} color="emerald" />
 <ToggleBtn label="Prev Balance" checked={isTruthy(data.print_show_previous_balance, false)} onChange={v => setData('print_show_previous_balance', v)} color="emerald" />
 <ToggleBtn label="Delivery Charges" checked={isTruthy(data.print_show_delivery_charge, true)} onChange={v => setData('print_show_delivery_charge', v)} color="emerald" />
 <ToggleBtn label="Extra Charges" checked={isTruthy(data.print_show_extra_charge, true)} onChange={v => setData('print_show_extra_charge', v)} color="emerald" />
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
 <Toggle label="Auto Cut Paper" checked={isTruthy(data.thermal_auto_cut, true)} onChange={v => setData('thermal_auto_cut', v)} color="emerald" />
 <Toggle label="Open Cash Drawer" checked={isTruthy(data.thermal_open_drawer, false)} onChange={v => setData('thermal_open_drawer', v)} color="emerald" />

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
 <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-muted border-b border-line pb-2">
 <Icon size={14} /> {title}
 </h3>
 <div className="px-1">{children}</div>
 </div>
);

const Label = ({ children }) => (
 <div className="text-2xs font-bold text-ink-muted uppercase tracking-wide mb-1.5">{children}</div>
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
 : 'bg-brand-600 text-white border-brand-600 shadow-sm'
 : 'bg-sunken border-line dark:border-line text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover'
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
 className={`w-full flex flex-wrap items-center justify-between gap-y-2 p-3 rounded-xl border transition-all ${checked
 ? color === 'emerald'
 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
 : 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800'
 : 'bg-surface border-line hover:border-line'
 }`}
 >
 <span className={`text-sm font-bold ${checked ? (color === 'emerald' ? 'text-emerald-700 dark:text-emerald-400' : 'text-brand-700 dark:text-brand-400') : 'text-ink-secondary'}`}>
 {label}
 </span>
 <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${checked
 ? color === 'emerald' ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white'
 : 'bg-sunken text-transparent'
 }`}>
 <Check size={12} strokeWidth={4} />
 </div>
 </button>
);

const Toggle = ({ label, checked, onChange, color = 'indigo' }) => (
 <div className="flex flex-wrap items-center justify-between gap-y-2 py-1">
 <span className="text-sm font-bold text-ink-secondary">{label}</span>
 <button
 type="button"
 onClick={() => onChange(!checked)}
 className={`relative w-11 h-6 rounded-full transition-colors ${checked
 ? color === 'emerald' ? 'bg-emerald-500' : 'bg-brand-500'
 : 'bg-sunken'
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
 className="w-full px-3 py-2 text-sm bg-sunken border border-line rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-bold text-ink placeholder:text-ink-faint"
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
 className="w-full px-3 py-2 text-sm bg-sunken border border-line rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all font-mono font-bold text-ink text-center"
 />
 </div>
);

const SelectInput = ({ label, value, onChange, options }) => (
 <div>
 <Label>{label}</Label>
 <select
 value={value}
 onChange={e => onChange(e.target.value)}
 className="w-full px-3 py-2 text-sm bg-sunken border border-line rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-bold text-ink"
 >
 {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
 </select>
 </div>
);

// Basic accessible color picker row
const ColorPicker = ({ label, value, onChange }) => {
 const colors = [
 { c: vq.slate[900], n: 'Black' },
 { c: vq.indigo[600], n: 'Indigo' },
 { c: vq.blue[600], n: 'Blue' },
 { c: vq.cyan[600], n: 'Cyan' },
 { c: vq.emerald[600], n: 'Emerald' },
 { c: vq.red[600], n: 'Red' },
 { c: vq.amber[600], n: 'Amber' },
 { c: vq.violet[600], n: 'Violet' },
 { c: vq.pink[600], n: 'Pink' },
 { c: vq.stone[600], n: 'Stone' },
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
 className={`w-6 h-6 rounded-full border-2 transition-transform ${value === col.c ? 'border-brand-500 ring-1 ring-offset-1 ring-brand-500' : 'border-transparent'}`}
 style={{ backgroundColor: col.c }}
 title={col.n}
 />
 ))}
 </div>
 </div>
 );
};

const LogoUploader = ({ data, setData }) => (
 <div className="mt-3 p-3 bg-surface rounded-xl border border-line">
 <Label>Logo Image</Label>

 <div className="flex items-start gap-4 mt-2">
 {data.print_logo_path ? (
 <div className="relative group">
 <img
 src={data.print_logo_path}
 alt="Logo Preview"
 className="w-20 h-20 object-contain bg-sunken rounded-lg p-1 border border-line"
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
 <div className="w-20 h-20 bg-sunken rounded-lg border-2 border-dashed border-line dark:border-line flex flex-col items-center justify-center text-ink-muted gap-1">
 <ImageIcon size={20} />
 <span className="text-3xs font-bold">No Logo</span>
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
 className="inline-flex items-center gap-2 px-3 py-2 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-bold cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
 >
 <Upload size={14} />
 {data.print_logo_path ? 'Change Logo' : 'Upload Logo'}
 </label>
 <p className="text-2xs text-ink-muted mt-2 leading-tight">
 Recommended: PNG with transparent background. Max 2MB.
 </p>
 </div>
 </div>
 </div>
);

const B2BSettings = ({ data, setData, activePrintTab, onSetDefaultType }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-fast">
      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl border border-indigo-100 dark:border-indigo-800/30 mb-6">
        <Toggle
          label="Set as Default Receipt Format"
          checked={data.default_print_type === 'b2b'}
          onChange={v => { const type = v ? 'b2b' : 'regular'; onSetDefaultType ? onSetDefaultType(type) : (setData('default_print_type', type), rememberPrintType(type)); }}
          color="indigo"
        />
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">Invoice &amp; PDF Styling (B2B)</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">Invoice Template Theme</label>
            <select
              value={data.invoice_theme || 'classic'}
              onChange={(e) => setData('invoice_theme', e.target.value)}
              className="w-full px-3 py-2 bg-app border border-line rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
            >
              <option value="classic">Classic Minimalist</option>
              <option value="modern">Modern Professional</option>
              <option value="elegant">Elegant Serif</option>
            </select>
            <p className="text-2xs text-ink-muted">Choose the layout aesthetic for downloadable B2B invoices and statements.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">Primary Brand Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={data.invoice_primary_color || '#4f46e5'}
                onChange={(e) => setData('invoice_primary_color', e.target.value)}
                className="h-9 w-12 bg-app border border-line rounded-lg cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={data.invoice_primary_color || '#4f46e5'}
                onChange={(e) => setData('invoice_primary_color', e.target.value)}
                className="flex-1 px-3 py-2 bg-app border border-line rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <p className="text-2xs text-ink-muted">Applied to header accents, table headers, and primary totals.</p>
          </div>

          <div className="pt-4 border-t border-line">
            <label className="flex flex-wrap items-center justify-between gap-y-2 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-ink block">Show Margin on Invoices</span>
                <span className="text-2xs text-ink-muted">Display item cost profit margin on generated B2B invoices</span>
              </div>
              <input
                type="checkbox"
                checked={data.show_margin_on_invoice === '1' || data.show_margin_on_invoice === true}
                onChange={(e) => setData('show_margin_on_invoice', e.target.checked)}
                className="w-4 h-4 accent-brand-500 rounded border-line focus:ring-brand-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};


const HardwareSettings = ({ data, setData }) => {
	const { isConnected, printers, defaultPrinter, setDefaultPrinter, openDrawer } = useAMDStation();
	const [pulsing, setPulsing] = useState(false);

	const handlePulseDrawer = async () => {
		setPulsing(true);
		try {
			if (isAMDStationAvailable()) {
				const res = await openDrawer();
				if (res?.success === true) {
					Swal.fire({
						title: 'Drawer Signal Sent',
						text: 'Trigger pulse sent to cash drawer kickout port.',
						icon: 'success',
						timer: 1500,
						showConfirmButton: false,
					});
				} else {
					Swal.fire({
						title: 'Drawer Trigger Failed',
						text: 'VenQore Station could not reach the printer kickout port.',
						icon: 'error',
					});
				}
			} else {
				Swal.fire({
					title: 'Direct Hardware Required',
					text: 'Hardware drawer kickout requires VenQore Station companion app to be active.',
					icon: 'info',
				});
			}
		} finally {
			setPulsing(false);
		}
	};

	return (
		<div className="space-y-6 animate-in fade-in duration-fast">
			<div>
				<h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-4">Hardware Devices &amp; Routing</h4>
				<div className="space-y-4">
					{/* Connection Status Card */}
					<div className="p-4 rounded-xl bg-app border border-line space-y-2">
						<div className="flex flex-wrap items-center justify-between gap-y-2">
							<span className="text-xs font-bold text-ink">VenQore Station Status</span>
							<span className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider ${isConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-sunken text-ink-muted'}`}>
								{isConnected ? 'Connected & Active' : 'Standalone Browser Mode'}
							</span>
						</div>
						<p className="text-2xs text-ink-muted leading-relaxed">
							{isConnected
								? 'Desktop companion connected. Silent high-speed ESC/POS thermal printing and hardware cash drawer triggers are active.'
								: 'Running directly in browser. Printing opens the system print dialog, where you choose the physical printer. Connect VenQore Station desktop companion for silent direct printing and automated drawer kicks.'}
						</p>
					</div>

					{/* Printer Device Selection */}
					<div className="space-y-2">
						<label className="block text-xs font-bold uppercase tracking-wider text-ink-secondary">Device Receipt Printer</label>
						{printers && printers.length > 0 ? (
							<select
								value={defaultPrinter || ''}
								onChange={async (e) => { const result = await setDefaultPrinter(e.target.value); if (result?.success) setData('default_print_type', 'thermal'); else Swal.fire('Printer selection failed', result?.error || 'Could not save printer', 'error'); }}
								className="w-full px-3 py-2 bg-app border border-line rounded-xl text-xs font-bold focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
							>
								<option value="" disabled>Select a receipt printer</option>
                                {defaultPrinter && !printers.some(p => p.name === defaultPrinter) && <option value={defaultPrinter}>{defaultPrinter} (unavailable)</option>}
                                {printers.map((p) => (
									<option key={p.name} value={p.name}>
										{p.name} {p.isDefault ? '(System Default)' : ''}
									</option>
								))}
							</select>
						) : (
							<div className="p-3 bg-sunken rounded-xl text-2xs text-ink-muted">
								System default printer selected. Launch VenQore Station to detect named thermal hardware.
							</div>
						)}
						<p className="text-2xs text-ink-muted">Physical printer assigned specifically to this cash register station.</p>
					</div>

					{/* Cash Drawer Configuration */}
					<div className="pt-3 border-t border-line space-y-3">
						<label className="flex flex-wrap items-center justify-between gap-y-2 cursor-pointer">
							<div>
								<span className="text-xs font-bold text-ink block">Pulse Drawer on Cash Sale</span>
								<span className="text-2xs text-ink-muted">Send 24V kickout pulse via RJ11/RJ12 printer port</span>
							</div>
							<input
								type="checkbox"
								checked={data.thermal_open_drawer === '1' || data.thermal_open_drawer === true}
								onChange={(e) => setData('thermal_open_drawer', e.target.checked)}
								className="w-4 h-4 accent-brand-500 rounded border-line focus:ring-brand-500 cursor-pointer"
							/>
						</label>

						<button
							type="button"
							disabled={pulsing}
							onClick={handlePulseDrawer}
							className="w-full py-2 px-3 bg-sunken hover:bg-interactive-hover border border-line rounded-xl text-xs font-bold text-ink transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
						>
							<span>{pulsing ? 'Pulsing...' : 'Test Cash Drawer Kickout'}</span>
						</button>
					</div>

					{/* Auto-Cut Configuration */}
					<div className="pt-3 border-t border-line space-y-2">
						<label className="flex flex-wrap items-center justify-between gap-y-2 cursor-pointer">
							<div>
								<span className="text-xs font-bold text-ink block">Automatic Paper Cut</span>
								<span className="text-2xs text-ink-muted">Trigger guillotine paper knife at end of thermal receipt</span>
							</div>
							<input
								type="checkbox"
								checked={data.thermal_auto_cut !== '0' && data.thermal_auto_cut !== false}
								onChange={(e) => setData('thermal_auto_cut', e.target.checked)}
								className="w-4 h-4 accent-brand-500 rounded border-line focus:ring-brand-500 cursor-pointer"
							/>
						</label>
					</div>

					{/* Fallback Reliability Guarantee (M17) */}
					<div className="p-3 bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-800 rounded-xl space-y-1">
						<span className="text-xs font-bold text-brand-700 dark:text-brand-300 block">Print Fault Protection (M17)</span>
						<p className="text-3xs text-brand-600 dark:text-brand-400 leading-relaxed">
							If the hardware station drops offline, AMD POS automatically routes receipt jobs through the browser print dialog. No receipt or transaction proof is ever silently dropped.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
