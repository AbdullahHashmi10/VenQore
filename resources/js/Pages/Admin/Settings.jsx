import React, { useState, useEffect } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import PasscodeModal from '@/Components/PasscodeModal';
import PrintPreview from '@/Components/PrintPreview';
import Swal from 'sweetalert2';
import PrintSettingsSection from '@/Components/PrintSettingsSection';
import BusinessSettingsSection from '@/Components/BusinessSettingsSection';
import GeneralSettingsSection from '@/Components/GeneralSettingsSection';
import AiSettingsSection from '@/Components/AiSettingsSection';
import TransactionSettingsSection from '@/Components/TransactionSettingsSection';
import TaxSettingsSection from '@/Components/TaxSettingsSection';
import SystemSettingsSection from '@/Components/SystemSettingsSection';
import DangerSettingsSection from '@/Components/DangerSettingsSection';
import {
    Settings, Building2, Globe, Bell, Shield, Database, Mail, Printer,
    CreditCard, Clock, Save, Check, RefreshCw, AlertTriangle, FileText,
    ChevronRight, Palette, Lock, Wifi, HardDrive, Trash2, Download,
    Upload, Key, Percent, MessageSquare, Users, Package, Plus, Search,
    Layout, Type, Smartphone, Image as ImageIcon, FileCheck, History, Sparkles, Send, ShoppingCart, BookOpen,
    Phone, MapPin, Hash, AlertOctagon
} from 'lucide-react';
import Toggle from '@/Components/Toggle';
import SectionHeader from '@/Components/SectionHeader';

// ── Settings IA (restructured) ──────────────────────────────────────────
// This used to be 18 flat sections (several of them rendered by the exact
// same shared component split across two unrelated categories, plus a
// duplicated set of "POS & Sales" / "Transaction" fields, plus a "Messages"
// section that was fully built but never included in any category so it
// could never appear in the sidebar). Consolidated to 14 sections:
//   - System / Notifications / Security / Backup / Integrations all used to
//     render <SystemSettingsSection activeSubSection="..."/> from two
//     different categories — System+Notifications now share one
//     "Preferences" tab, AI+Integrations share one tab, and Backup & Data
//     is replaced by a link-out to the "Data & Backup" hub (see
//     Pages/Admin/DataManagement.jsx) instead of a 4th place to manage backups.
//   - "POS & Sales" and "Transaction" are merged into "Sales & Invoicing"
//     with two subsections, since they previously duplicated the same
//     pos_auto_fill_cash / round_off_total / show_margin_percentage fields.
//   - "Messages" (WhatsApp/SMS) is now actually reachable.
const SETTINGS_CATEGORIES = [
    {
        id: 'org',
        name: 'Organization',
        icon: Building2,
        sections: ['business', 'preferences']
    },
    {
        id: 'ops',
        name: 'Operations',
        icon: ShoppingCart,
        sections: ['sales', 'taxes', 'print', 'messages', 'item', 'party', 'reminders', 'accounting']
    },
    {
        id: 'adv',
        name: 'Advanced',
        icon: Sparkles,
        sections: ['security', 'ai_integrations', 'backup']
    },
    {
        id: 'zone',
        name: 'Danger Zone',
        icon: AlertOctagon,
        sections: ['reset']
    }
];

const SETTINGS_SECTIONS = [
    { id: 'business', name: 'Business Info', icon: Building2, description: 'Company details and branding' },
    { id: 'preferences', name: 'Preferences', icon: Settings, description: 'Passcode, multi-firm, language & alerts' },
    { id: 'sales', name: 'Sales & Invoicing', icon: ShoppingCart, description: 'Checkout behavior and invoice fields' },
    { id: 'taxes', name: 'Taxes', icon: Percent, description: 'Tax rates and groups' },
    { id: 'print', name: 'Print', icon: Printer, description: 'Regular & Thermal printer layouts' },
    { id: 'messages', name: 'Messages', icon: MessageSquare, description: 'WhatsApp & SMS notifications' },
    { id: 'party', name: 'Party', icon: Users, description: 'Customer & Supplier preferences' },
    { id: 'item', name: 'Item', icon: Package, description: 'Inventory, MRP & batch tracking' },
    { id: 'reminders', name: 'Reminders', icon: Clock, description: 'Service and payment alerts' },
    { id: 'accounting', name: 'Accounting', icon: BookOpen, description: 'Ledgers, depreciation & fiscal year' },
    { id: 'security', name: 'Security', icon: Shield, description: 'Access control & 2FA' },
    { id: 'ai_integrations', name: 'AI & Integrations', icon: Sparkles, description: 'Gemini, OpenAI, FBR & Stripe' },
    { id: 'backup', name: 'Backup & Data', icon: Database, description: 'Now lives in the Data & Backup hub' },
    { id: 'reset', name: 'Factory Reset', icon: Trash2, description: 'Erase data & start fresh' },
];

export default function AdminSettings({ settings = {} }) {
    const { store } = usePage().props;
    const [activeSection, setActiveSection] = useState(() => {
        // NOTE: this used to check against a hardcoded array of section ids
        // ('loyalty' isn't even a real section id, and most real ids like
        // 'party'/'item'/'security'/'backup' were missing) — any bookmark or
        // reload landing on a non-whitelisted-but-real tab silently bounced
        // back to 'business'. Now it validates against the real, current list.
        const validIds = SETTINGS_SECTIONS.map(s => s.id);
        const hash = window.location.hash.replace('#', '');
        if (validIds.includes(hash)) return hash;
        const stored = localStorage.getItem('active_settings_section');
        return validIds.includes(stored) ? stored : 'business';
    });

    useEffect(() => {
        localStorage.setItem('active_settings_section', activeSection);
        window.location.hash = activeSection;
    }, [activeSection]);

    const [saved, setSaved] = useState(false);
    const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
    const [configuringApp, setConfiguringApp] = useState(null);
    const [verifyingKey, setVerifyingKey] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState(['org', 'ops', 'adv', 'zone']);
    const [acknowledgeOpenReturn, setAcknowledgeOpenReturn] = useState(settings.pos_return_mode === 'open');

    const toggleCategory = (catId) => {
        setExpandedCategories(prev =>
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        );
    };

    const handleVerifyKey = async () => {
        if (!data.openai_api_key) return;
        setVerifyingKey(true);
        setVerificationResult(null);
        try {
            const res = await window.axios.post(route('store.ai.test', { store_slug: store?.slug }), {
                api_key: data.openai_api_key,
                provider: data.ai_provider,
                model: data.ai_model
            });

            if (res.data.suggested_model && res.data.suggested_model !== data.ai_model) {
                setData(d => ({ ...d, ai_model: res.data.suggested_model }));
            }

            setVerificationResult({ type: 'success', message: res.data.message });
        } catch (e) {
            setVerificationResult({ type: 'error', message: e.response?.data?.message || e.message });
        } finally {
            setVerifyingKey(false);
        }
    };

    const { data, setData, post, processing, isDirty, reset } = useForm({
        // Business
        business_name: settings.business_name || 'VENQORE',
        business_email: settings.business_email || '',
        business_phone: settings.business_phone || '',
        business_address: settings.business_address || '',
        tax_number: settings.tax_number || '',
        currency: settings.currency || 'PKR',
        currency_symbol: settings.currency_symbol || '',
        timezone: settings.timezone || 'Asia/Karachi',

        // General
        enable_passcode: settings.enable_passcode === '1' || settings.enable_passcode === true,
        admin_passcode: settings.admin_passcode || '',
        decimal_places: settings.decimal_places || 2,
        stop_sale_negative_stock: settings.stop_sale_negative_stock === '1' || settings.stop_sale_negative_stock === true,
        multi_firm_enabled: settings.multi_firm_enabled === '1' || settings.multi_firm_enabled === true,
        ui_scale: settings.ui_scale || 100,

        // AI
        ai_provider: settings.ai_provider || 'gemini',
        openai_api_key: settings.openai_api_key || '',
        ai_model: settings.ai_model || 'gemini-2.5-flash',

        // Transaction
        invoice_number_enabled: settings.invoice_number_enabled !== '0',
        cash_sale_default: settings.cash_sale_default === '1' || settings.cash_sale_default === true,
        round_off_total: settings.round_off_total || 'none',
        billing_type: settings.billing_type || 'full',
        sale_prefix: settings.sale_prefix || 'INV-',
        purchase_prefix: settings.purchase_prefix || 'PUR-',

        // Print - Regular Printer Settings
        print_header_all_pages: settings.print_header_all_pages !== '0',
        paper_size: settings.paper_size || 'A4',
        paper_orientation: settings.paper_orientation || 'Portrait',
        print_logo: settings.print_logo !== '0',
        print_logo_path: settings.print_logo_path || null,
        print_logo_file: null,
        print_signature_text: settings.print_signature_text || 'Authorized Signatory',
        print_theme: settings.print_theme || 'modern',
        print_company_text_size: settings.print_company_text_size || '4',
        print_invoice_text_size: settings.print_invoice_text_size || '3',
        print_original_copy: settings.print_original_copy === '1',
        margin_top: parseInt(settings.margin_top) || 20,
        margin_bottom: parseInt(settings.margin_bottom) || 20,
        margin_left: parseInt(settings.margin_left) || 20,
        margin_right: parseInt(settings.margin_right) || 20,
        custom_paper_width: parseInt(settings.custom_paper_width) || 210,
        custom_paper_height: parseInt(settings.custom_paper_height) || 297,
        print_theme_color: settings.print_theme_color || '#4f46e5',
        print_extra_space_top: parseInt(settings.print_extra_space_top) || 0,
        print_min_item_rows: parseInt(settings.print_min_item_rows) || 5,

        // Print - Column Toggles (Regular)
        print_show_sno: settings.print_show_sno !== '0',
        print_show_units: settings.print_show_units !== '0',
        print_show_mrp: settings.print_show_mrp === '1',
        print_show_description: settings.print_show_description !== '0',
        print_show_hsn: settings.print_show_hsn === '1',
        print_show_discount: settings.print_show_discount === '1' || settings.print_show_discount === true,
        print_show_free_qty: settings.print_show_free_qty === '1' || settings.print_show_free_qty === true,

        // Print - Totals & Footer (Regular)
        print_total_quantity: settings.print_total_quantity !== '0',
        print_amount_decimal: settings.print_amount_decimal !== '0',
        print_received_amount: settings.print_received_amount !== '0',
        print_balance_amount: settings.print_balance_amount !== '0',
        print_party_balance: settings.print_party_balance === '1',
        print_tax_details: settings.print_tax_details !== '0',
        print_you_saved: settings.print_you_saved === '1',
        print_show_previous_balance: settings.print_show_previous_balance === '1' || settings.print_show_previous_balance === true,
        print_amount_grouping: settings.print_amount_grouping !== '0',
        print_amount_words: settings.print_amount_words || '0',
        print_description: settings.print_description !== '0',
        print_terms: settings.print_terms || '',
        print_received_by: settings.print_received_by === '1',
        print_delivered_by: settings.print_delivered_by === '1',
        print_payment_mode: settings.print_payment_mode !== '0',
        print_acknowledgement: settings.print_acknowledgement === '1',

        // Print - Thermal Printer Settings
        default_print_type: settings.default_print_type || 'regular', // 'regular' or 'thermal'
        thermal_page_size: settings.thermal_page_size || '3inch',
        thermal_custom_chars: parseInt(settings.thermal_custom_chars) || 48,
        thermal_use_bold: settings.thermal_use_bold !== '0',
        thermal_auto_cut: settings.thermal_auto_cut !== '0',
        thermal_open_drawer: settings.thermal_open_drawer === '1',
        thermal_extra_lines: parseInt(settings.thermal_extra_lines) || 3,
        thermal_copies: parseInt(settings.thermal_copies) || 1,
        thermal_font_size: parseInt(settings.thermal_font_size) || 12, // Font size in pt

        // Print - Column Toggles (Thermal)
        thermal_show_headers: settings.thermal_show_headers === '1',
        thermal_show_sno: settings.thermal_show_sno === '1',
        thermal_show_units: settings.thermal_show_units === '1',
        thermal_show_mrp: settings.thermal_show_mrp === '1',
        thermal_show_description: settings.thermal_show_description === '1',
        thermal_show_batch: settings.thermal_show_batch === '1',
        thermal_show_expiry: settings.thermal_show_expiry === '1',
        thermal_show_mfg_date: settings.thermal_show_mfg_date === '1',
        thermal_show_size: settings.thermal_show_size === '1',
        thermal_show_model: settings.thermal_show_model === '1',
        thermal_show_serial: settings.thermal_show_serial === '1',
        thermal_show_barcode: settings.thermal_show_barcode !== '0', // Default On
        thermal_custom_footer: settings.thermal_custom_footer || '',

        // Messages
        whatsapp_enabled: settings.whatsapp_enabled === '1' || settings.whatsapp_enabled === true,
        sms_to_party: settings.sms_to_party === '1' || settings.sms_to_party === true,
        auto_send_sales: settings.auto_send_sales !== '0',

        // Party
        party_grouping: settings.party_grouping === '1' || settings.party_grouping === true,
        loyalty_enabled: settings.loyalty_enabled === '1' || settings.loyalty_enabled === true,
        enable_credit_limit: settings.enable_credit_limit !== '0', // Default On
        payment_reminder_days: settings.payment_reminder_days || 7,

        // Item
        stock_maintenance: settings.stock_maintenance !== '0',
        barcode_scan_enabled: settings.barcode_scan_enabled === '1' || settings.barcode_scan_enabled === true,
        batch_tracking_enabled: settings.batch_tracking_enabled === '1' || settings.batch_tracking_enabled === true,
        wholesale_price_enabled: settings.wholesale_price_enabled === '1' || settings.wholesale_price_enabled === true,

        // System/Security
        language: settings.language || 'en',
        date_format: settings.date_format || 'DD/MM/YYYY',
        low_stock_threshold: settings.low_stock_threshold || 10,
        auto_logout: settings.auto_logout || 30,
        email_notifications: settings.email_notifications !== '0',
        two_factor_auth: settings.two_factor_auth === '1' || settings.two_factor_auth === true,
        auto_backup: settings.auto_backup !== '0',
        dark_mode_default: settings.dark_mode_default === '1' || settings.dark_mode_default === true,
        low_stock_alerts: settings.low_stock_alerts !== '0',
        daily_sales_summary: settings.daily_sales_summary === '1',

        // POS Specific (from general settings)
        pos_auto_fill_cash: settings.pos_auto_fill_cash === '1' || settings.pos_auto_fill_cash === true,
        senior_mode: settings.senior_mode === '1' || settings.senior_mode === true,
        fbr_integration: settings.fbr_integration === '1' || settings.fbr_integration === true,
        fbr_pos_id: settings.fbr_pos_id || '',
        fbr_usin: settings.fbr_usin || '',
        show_margin_percentage: settings.show_margin_percentage === '1' || settings.show_margin_percentage === true,
        charity_enabled: settings.charity_enabled === '1' || settings.charity_enabled === true,
        pos_return_mode: settings.pos_return_mode || 'reference',
        pos_return_window: settings.pos_return_window || '',
        pos_return_window_behavior: settings.pos_return_window_behavior || 'warn',
        default_tax_rate: settings.default_tax_rate || '0',

        // Third Party Integrations
        whatsapp_api_url: settings.whatsapp_api_url || '',
        whatsapp_access_token: settings.whatsapp_access_token || '',
        whatsapp_phone_number_id: settings.whatsapp_phone_number_id || '',

        stripe_publishable_key: settings.stripe_publishable_key || '',
        stripe_secret_key: settings.stripe_secret_key || '',
        stripe_webhook_secret: settings.stripe_webhook_secret || '',
        stripe_enabled: settings.stripe_enabled === '1' || settings.stripe_enabled === true,

        woocommerce_url: settings.woocommerce_url || '',
        woocommerce_consumer_key: settings.woocommerce_consumer_key || '',
        woocommerce_consumer_secret: settings.woocommerce_consumer_secret || '',
        woocommerce_enabled: settings.woocommerce_enabled === '1' || settings.woocommerce_enabled === true,

        // Managed Lists
        tax_rates: settings.tax_rates ? JSON.parse(settings.tax_rates) : [
            { id: 1, name: 'GST 18%', rate: 18, type: 'percentage' },
            { id: 2, name: 'VAT 5%', rate: 5, type: 'percentage' }
        ],
        service_reminders: settings.service_reminders ? JSON.parse(settings.service_reminders) : [],
    });



    const saveSettings = (code) => {
        post(route('store.admin.settings.update', { store_slug: store?.slug }), {
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        });
    };

    const handleSectionChange = (sectionId) => {
        if (isDirty) {
            Swal.fire({
                title: 'Unsaved Changes',
                text: 'You have unsaved changes. Do you want to save them before switching sections?',
                icon: 'warning',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Save and Switch',
                denyButtonText: 'Discard and Switch',
                cancelButtonText: 'Cancel',
                background: '#1e293b',
                color: '#fff',
                confirmButtonColor: '#6366f1',
                denyButtonColor: '#ef4444',
            }).then((result) => {
                if (result.isConfirmed) {
                    post(route('store.admin.settings.update', { store_slug: store?.slug }), {
                        onSuccess: () => {
                            setSaved(true);
                            setTimeout(() => setSaved(false), 3000);
                            setActiveSection(sectionId);
                        }
                    });
                } else if (result.isDenied) {
                    reset();
                    setActiveSection(sectionId);
                }
            });
        } else {
            setActiveSection(sectionId);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Check if passcode is enabled AND we are not just disabling it
        // Actually, for simplicity, if passcode is enabled in CURRENT settings (not form data), we challenge.
        // But if the user is *enabling* it for the first time, we don't need to challenge (unless they are changing other stuff).
        // Let's rely on the `settings` prop which holds the *saved* state.

        const isPasscodeEnabled = settings.enable_passcode === '1' || settings.enable_passcode === true;

        if (isPasscodeEnabled) {
            setIsPasscodeModalOpen(true);
        } else {
            saveSettings();
        }
    };



    const renderSection = () => {
        switch (activeSection) {
            case 'business':
                return <BusinessSettingsSection data={data} setData={setData} />;

            case 'preferences':
                // Merges the old "General", "System" and "Notifications" tabs.
                // All three used to live in different categories even though
                // "System" and "Notifications" already rendered the exact same
                // <SystemSettingsSection/> component as "Security"/"Backup"/
                // "Integrations" — just a different activeSubSection prop.
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <GeneralSettingsSection data={data} setData={setData} />
                        </div>
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <SectionHeader title="Localization & Appearance" description="Language, date format and display" />
                            <SystemSettingsSection data={data} setData={setData} activeSubSection="system" />
                        </div>
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <SystemSettingsSection data={data} setData={setData} activeSubSection="notifications" />
                        </div>
                    </div>
                );

            case 'ai_integrations':
                // Merges the old "AI Intelligence" and "Integrations" tabs —
                // both are just cards for connecting a 3rd-party service.
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <SectionHeader title="AI Intelligence" description="Gemini, OpenAI & Smart Search" />
                            <AiSettingsSection
                                data={data}
                                setData={setData}
                                handleVerifyKey={handleVerifyKey}
                                verifyingKey={verifyingKey}
                                verificationResult={verificationResult}
                            />
                        </div>
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <SectionHeader title="Integrations" description="External API connections" />
                            <SystemSettingsSection data={data} setData={setData} activeSubSection="integrations" />
                        </div>
                    </div>
                );

            case 'sales':
                // Merges the old "POS & Sales" and "Transaction" tabs. They used
                // to duplicate the exact same pos_auto_fill_cash / round_off_total /
                // show_margin_percentage fields in two different places — those
                // now live only in "At the register" below, and TransactionSettingsSection
                // was trimmed down to just its two unique fields ("On the invoice").
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div>
                            <SectionHeader title="At the Register" description="Customize your point of sale experience" />
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                    <Toggle enabled={data.pos_auto_fill_cash} onChange={v => setData('pos_auto_fill_cash', v)} label="Auto-Fill Cash Received" description="Automatically populate the 'Cash Received' field with the total amount" />
                                    <Toggle enabled={data.senior_mode} onChange={v => setData('senior_mode', v)} label="Senior Mode (Accessibility)" description="Enable larger fonts and high-contrast UI for easier reading" />
                                    <Toggle enabled={data.fbr_integration} onChange={v => setData('fbr_integration', v)} label="FBR Integration" description="Automatically report sales to FBR and print QR codes" />
                                    <Toggle enabled={data.show_margin_percentage} onChange={v => setData('show_margin_percentage', v)} label="Show Margin Percentage" description="Display profit margin in sales overview" />
                                    <div className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Round Off Invoice Totals</h4>
                                            <p className="text-xs text-slate-500">Choose rounding precision for sales and purchases</p>
                                        </div>
                                        <div className="grid grid-cols-6 gap-1 max-w-sm w-full">
                                            {[
                                                { value: 'none', label: 'None' },
                                                { value: '0', label: 'Whole' },
                                                { value: '1', label: '.0' },
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
                                                        className={`py-2 px-1 text-center font-bold text-[11px] rounded-lg border transition-all ${isActive
                                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                                            : 'border-transparent bg-slate-100 dark:bg-slate-700/50 text-slate-500 hover:bg-slate-200/50'
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <Toggle
                                        enabled={data.stop_sale_negative_stock === '0' || data.stop_sale_negative_stock === false || data.stop_sale_negative_stock === 0}
                                        onChange={v => setData('stop_sale_negative_stock', !v)}
                                        label="Allow Negative Stock (Overselling)"
                                        description="Warning: Allows selling items even if inventory is 0"
                                        variant="danger"
                                    />
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mt-6">
                                <SectionHeader title="Return Mode" description="Configure return authorization requirements" />
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">POS Return Mode</label>
                                            <span className="block text-xs text-slate-500">Configure return authorization requirements</span>
                                        </div>
                                        <select
                                            value={data.pos_return_mode}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setData('pos_return_mode', val);
                                                if (val !== 'open') setAcknowledgeOpenReturn(false);
                                            }}
                                            className="w-64 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="reference">Reference Number Required</option>
                                            <option value="customer_or_reference">Customer or Reference</option>
                                            <option value="open">Open Return — No Reference Needed</option>
                                        </select>
                                    </div>
                                    {data.pos_return_mode === 'open' && (
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3">
                                            <div className="flex items-start gap-3">
                                                <span className="text-amber-500 text-lg">⚠️</span>
                                                <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                                                    Warning: Open returns cannot be linked to original sales. You are responsible for verifying returned items were genuinely purchased.
                                                </p>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input type="checkbox" checked={acknowledgeOpenReturn} onChange={(e) => setAcknowledgeOpenReturn(e.target.checked)} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">I understand and acknowledge this risk</span>
                                            </label>
                                        </div>
                                    )}
                                    {data.pos_return_mode === 'open' && (
                                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex justify-between items-center py-2">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Return Window (days)</label>
                                                    <span className="block text-xs text-slate-500">Max days since purchase for returns (leave empty to disable)</span>
                                                </div>
                                                <input type="number" min="1" value={data.pos_return_window} onChange={(e) => setData('pos_return_window', e.target.value)} placeholder="e.g. 7, 14, 30" className="w-64 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                            </div>
                                            {data.pos_return_window && (
                                                <div className="flex justify-between items-center py-2">
                                                    <div>
                                                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Window Behavior</span>
                                                        <span className="block text-xs text-slate-500">Action when return window has expired</span>
                                                    </div>
                                                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                                                        <button type="button" onClick={() => setData('pos_return_window_behavior', 'warn')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === 'warn' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}>Soft Warning</button>
                                                        <button type="button" onClick={() => setData('pos_return_window_behavior', 'block')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === 'block' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}>Hard Block</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between py-4 border-t border-slate-100 dark:border-slate-700">
                                        <div>
                                            <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Enable Charity Donations</span>
                                            <span className="block text-xs text-slate-500">Show the Charity button on the POS for quick donation recording</span>
                                        </div>
                                        <button type="button" onClick={() => setData('charity_enabled', !data.charity_enabled)} className={`relative w-12 h-6 rounded-full transition-colors ${data.charity_enabled ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.charity_enabled ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                            <TransactionSettingsSection data={data} setData={setData} />
                        </div>
                    </div>
                );

            case 'print':
                return <PrintSettingsSection data={data} setData={setData} saveSettings={saveSettings} />;

            case 'taxes':
                return <TaxSettingsSection data={data} setData={setData} />;

            case 'messages':
                // Fully built (WhatsApp + SMS), but until now this id was never
                // added to any category's `sections` list above, so it could
                // never actually appear in the sidebar. Now it's reachable.
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                                    <MessageSquare size={28} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-900 dark:text-emerald-400 text-lg">WhatsApp Integration</h4>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-500/80">Send invoices directly to customer's WhatsApp</p>
                                </div>
                            </div>
                            <button type="button" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all">Connect Account</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <SectionHeader title="SMS Settings" description="Automated text notifications" />
                                <Toggle enabled={data.sms_to_party} onChange={v => setData('sms_to_party', v)} label="Send SMS to Party" description="Notify customers on every transaction" />
                                <Toggle enabled={data.auto_send_sales} onChange={v => setData('auto_send_sales', v)} label="Auto-send for Sales" />
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-3xl border border-slate-100 dark:border-slate-700">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 block">Message Template</label>
                                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                    Greetings from <span className="text-indigo-500 font-bold">[Firm_Name]</span>. Your invoice for <span className="text-indigo-500 font-bold">[Invoice_Amount]</span> is ready. View here: [Link]
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <button className="text-indigo-600 text-sm font-bold flex items-center gap-2 hover:underline"><Palette size={16} /> Customize Template</button>
                                    <Toggle enabled={data.whatsapp_enabled} onChange={v => setData('whatsapp_enabled', v)} label="Enable WhatsApp" />
                                </div>
                            </div>
                        </div>

                        {data.whatsapp_enabled && (
                            <div className="p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl animate-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-slate-900 dark:text-white">WhatsApp API Credentials</h4>
                                        <p className="text-sm text-slate-500">Configure your Meta Business for WhatsApp</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">API URL</label>
                                        <input
                                            type="text"
                                            value={data.whatsapp_api_url}
                                            onChange={e => setData('whatsapp_api_url', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="https://graph.facebook.com/v17.0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number ID</label>
                                        <input
                                            type="text"
                                            value={data.whatsapp_phone_number_id}
                                            onChange={e => setData('whatsapp_phone_number_id', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="your_phone_number_id"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Access Token</label>
                                        <input
                                            type="password"
                                            value={data.whatsapp_access_token}
                                            onChange={e => setData('whatsapp_access_token', e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                                            placeholder="EAAB..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'party':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <SectionHeader title="Customer Preferences" description="Manage how you interact with parties" />
                                <Toggle enabled={data.party_grouping} onChange={v => setData('party_grouping', v)} label="Enable Party Grouping" description="Categorize customers by region or type" />
                                <Toggle enabled={data.loyalty_enabled} onChange={v => setData('loyalty_enabled', v)} label="Loyalty Points Program" description="Reward frequent customers with points" />
                                <Toggle enabled={data.enable_credit_limit} onChange={v => setData('enable_credit_limit', v)} label="Enable Credit Limit" description="Set maximum credit limits for customers" />
                            </div>
                            <div className="p-6 bg-indigo-50 dark:bg-indigo-500/10 rounded-3xl border border-indigo-100 dark:border-indigo-500/20">
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 mb-4"><Clock size={18} /> Payment Reminders</h4>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-indigo-700 dark:text-indigo-300/80">Remind me for payment due in (days)</label>
                                        <input type="number" value={data.payment_reminder_days} onChange={e => setData('payment_reminder_days', e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'item':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <SectionHeader title="Inventory Control" description="Manage products and stock levels" />
                                <Toggle enabled={data.stock_maintenance} onChange={v => setData('stock_maintenance', v)} label="Stock Maintenance" description="Track real-time inventory levels" />
                                <Toggle enabled={data.barcode_scan_enabled} onChange={v => setData('barcode_scan_enabled', v)} label="Barcode Scanning" description="Use scanners for quick billing" />
                                <Toggle enabled={data.batch_tracking_enabled} onChange={v => setData('batch_tracking_enabled', v)} label="Batch & Expiry Tracking" description="Track products by batch numbers" />
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-3xl border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                                <div className="absolute top-3 right-3">
                                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded border border-amber-200 dark:border-amber-500/30 shadow-sm">Upcoming</span>
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4 opacity-50"><Plus size={18} className="text-indigo-500" /> Custom Item Fields</h4>
                                <p className="text-sm text-slate-500 mb-6 opacity-50">Add up to 6 custom fields like Color, Material, or Brand to your products.</p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <Toggle enabled={data.wholesale_price_enabled} onChange={v => setData('wholesale_price_enabled', v)} label="Wholesale Pricing" description="Enable separate pricing for bulk buyers" />
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Low Stock Threshold</label>
                                <input
                                    type="number"
                                    value={data.low_stock_threshold}
                                    onChange={(e) => setData('low_stock_threshold', e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'accounting':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <SectionHeader title="Financial Cycles" description="Manage your fiscal year and reporting" />
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Fiscal Year Start</label>
                                    <input type="date" value={data.fiscal_year_start || '2025-01-01'} onChange={e => setData('fiscal_year_start', e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                                </div>
                                <Toggle enabled={data.enable_double_entry} onChange={v => setData('enable_double_entry', v)} label="Double Entry System" description="Enable advanced journal entries and ledgers" />
                            </div>
                        </div>
                    </div>
                );

            case 'security':
                return <SystemSettingsSection data={data} setData={setData} activeSubSection="security" />;

            case 'backup':
                // Automatic backups, manual snapshots, cloud sync and restore all
                // moved to the "Data & Backup" hub (Pages/Admin/DataManagement.jsx) —
                // this used to duplicate that page's "Full System" tab almost exactly.
                return (
                    <div className="flex flex-col items-center text-center gap-4 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Database size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Backups now live in Data &amp; Backup</h3>
                            <p className="text-sm text-slate-500 max-w-md">
                                Automatic daily backups, manual snapshots, cloud sync and restore are all in one
                                place now, instead of split between Settings and Data Management.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.visit(route('store.admin.data', { store_slug: store?.slug, tab: 'backups' }))}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            Go to Data &amp; Backup <ChevronRight size={18} />
                        </button>
                    </div>
                );

            case 'reset':
                return <DangerSettingsSection data={data} setData={setData} />;

            case 'reminders':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
                            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input type="text" placeholder="Search services for reminder..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none" />
                                </div>
                                <button
                                    disabled
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-400 rounded-lg text-xs font-bold flex items-center gap-2 cursor-not-allowed"
                                >
                                    <Lock size={14} /> Upcoming Feature
                                </button>
                            </div>
                            <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-700">
                                {data.service_reminders.length > 0 ? data.service_reminders.map((reminder, idx) => (
                                    <div key={reminder.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500">
                                                <Clock size={20} />
                                            </div>
                                            <div className="flex-1 max-w-xs">
                                                <input
                                                    type="text"
                                                    value={reminder.name}
                                                    onChange={(e) => {
                                                        const newItems = [...data.service_reminders];
                                                        newItems[idx].name = e.target.value;
                                                        setData('service_reminders', newItems);
                                                    }}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-800 dark:text-white focus:ring-0"
                                                />
                                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">Recurring Service</p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Every</span>
                                                <input
                                                    type="number"
                                                    value={reminder.interval}
                                                    onChange={(e) => {
                                                        const newItems = [...data.service_reminders];
                                                        newItems[idx].interval = e.target.value;
                                                        setData('service_reminders', newItems);
                                                    }}
                                                    className="w-12 bg-transparent border-none p-0 text-sm font-black text-indigo-600 focus:ring-0 text-center"
                                                />
                                                <select
                                                    value={reminder.unit}
                                                    onChange={(e) => {
                                                        const newItems = [...data.service_reminders];
                                                        newItems[idx].unit = e.target.value;
                                                        setData('service_reminders', newItems);
                                                    }}
                                                    className="bg-transparent border-none p-0 text-xs font-bold text-slate-500 focus:ring-0"
                                                >
                                                    <option value="days">Days</option>
                                                    <option value="months">Months</option>
                                                    <option value="years">Years</option>
                                                </select>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newItems = data.service_reminders.filter(r => r.id !== reminder.id);
                                                setData('service_reminders', newItems);
                                            }}
                                            className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                        <Lock size={48} className="mb-4 opacity-20" />
                                        <div className="mb-2">
                                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest rounded border border-amber-200 dark:border-amber-500/30 shadow-sm">Upcoming Version</span>
                                        </div>
                                        <p className="font-bold text-sm tracking-tight">Service Reminders Module</p>
                                        <p className="text-xs">Automatic maintenance alerts will be available in the next update.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 opacity-50">
                        <Settings size={48} className="mb-4" />
                        <p className="font-bold uppercase tracking-widest">Section Under Development</p>
                    </div>
                );
        }
    };
    return (
        <OneGlanceLayout title="System Settings" mode="admin">
            <Head title="System Settings" />

            <div className="h-full flex gap-6 overflow-hidden">
                {/* Sidebar - Midnight Nebula Styled - Collapsible */}
                <div className={`${sidebarCollapsed ? 'w-20' : 'w-80'} bg-slate-900 rounded-[2.5rem] border border-slate-800 shadow-2xl p-3 shrink-0 flex flex-col relative overflow-hidden transition-all duration-300`}>
                    {/* Nebula Background Elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                    <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" />

                    {/* Header with Collapse Toggle - Reports Style */}
                    <div className={`${sidebarCollapsed ? 'px-2 py-4 justify-center' : 'px-4 py-5 justify-between'} flex items-center border-b border-slate-800/50 mb-3 relative z-50`}>
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                                    <Settings size={18} />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-white tracking-tight">System</h2>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400">Control</p>
                                </div>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSidebarCollapsed(!sidebarCollapsed);
                            }}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors shrink-0 z-50 cursor-pointer"
                        >
                            <ChevronRight size={14} className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-2 custom-scrollbar space-y-1 relative z-10 pb-20">
                        {SETTINGS_CATEGORIES.map((category) => {
                            const CatIcon = category.icon;
                            const isExpanded = expandedCategories.includes(category.id);
                            const categorySections = SETTINGS_SECTIONS.filter(s => category.sections.includes(s.id));

                            if (categorySections.length === 0) return null;

                            return (
                                <div key={category.id} className="space-y-1">
                                    {!sidebarCollapsed && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleCategory(category.id);
                                            }}
                                            className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 transition-colors group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CatIcon size={12} />
                                                {category.name}
                                            </div>
                                            <ChevronRight size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                        </button>
                                    )}

                                    {(isExpanded || sidebarCollapsed) && (
                                        <div className="space-y-1">
                                            {categorySections.map((section) => {
                                                const Icon = section.icon;
                                                const isActive = activeSection === section.id;
                                                return (
                                                    <button
                                                        key={section.id}
                                                        type="button"
                                                        onClick={() => handleSectionChange(section.id)}
                                                        title={sidebarCollapsed ? section.name : undefined}
                                                        className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'p-2 justify-center' : 'p-3'} rounded-xl text-left transition-all duration-200 group relative overflow-hidden border ${isActive
                                                            ? 'bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-lg shadow-indigo-500/20'
                                                            : 'text-slate-400 hover:bg-white/5 hover:text-white border-transparent'
                                                            }`}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 opacity-100" />
                                                        )}

                                                        <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? 'bg-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                                                            <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'} />
                                                        </div>

                                                        {!sidebarCollapsed && (
                                                            <div className="relative z-10 flex-1 min-w-0">
                                                                <p className={`text-xs font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>{section.name}</p>
                                                                <p className={`text-[9px] leading-tight ${isActive ? 'text-indigo-200' : 'text-slate-500'} line-clamp-1`}>
                                                                    {section.description}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {!sidebarCollapsed && (
                                                            <ChevronRight size={14} className={`relative z-10 transition-all duration-200 shrink-0 ${isActive ? 'text-white' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />

                    <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10">
                        {/* Header */}
                        <div className="p-10 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Section</span>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.name}
                                        </h2>
                                    </div>
                                    <p className="text-base text-slate-500 font-medium">
                                        {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.description}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`relative group px-10 py-4 rounded-2xl font-black text-sm transition-all duration-500 transform active:scale-95 overflow-hidden shadow-2xl hover:shadow-indigo-500/40`}
                                >
                                    {/* Midnight Nebula Background for Button */}
                                    <div className="absolute inset-0 bg-slate-900 z-0">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/60 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"></div>
                                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 group-hover:scale-110 transition-transform duration-500"></div>
                                        <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20"></div>
                                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50"></div>
                                    </div>

                                    <div className="relative z-10 flex items-center gap-3 text-white">
                                        {saved ? (
                                            <>
                                                <Check size={20} strokeWidth={3} className="text-emerald-400" />
                                                <span>Changes Saved</span>
                                            </>
                                        ) : processing ? (
                                            <>
                                                <RefreshCw size={20} className="animate-spin text-indigo-300" />
                                                <span>Syncing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} className="group-hover:scale-110 transition-transform" />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>


                        <div className={`flex-1 custom-scrollbar ${activeSection === 'print' ? 'p-0 overflow-hidden' : 'p-10 overflow-y-auto'}`}>
                            <div className={`mx-auto transition-all duration-300 ${activeSection === 'print' ? 'max-w-full h-full' : activeSection === 'business' ? 'max-w-full px-6 pb-40' : 'max-w-5xl pb-40'}`}>
                                {renderSection()}
                            </div>
                        </div>
                    </form>
                </div>
            </div >

            <style>{`
    .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}
                .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
                .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 10px;
}
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #475569;
}
`}</style>
            <div className="fixed bottom-0 right-0 p-6 z-50 pointer-events-none">
                <div className="pointer-events-auto">
                    {/* The actual save button is inside the form, but we can have an indicator here if needed or keep it clean */}
                </div>
            </div>

            <PasscodeModal
                isOpen={isPasscodeModalOpen}
                onClose={() => setIsPasscodeModalOpen(false)}
                onSuccess={(code) => saveSettings(code)}
                settings={settings}
            />
        </OneGlanceLayout >
    );
}
