import { printerSettingsFields } from '@/Utils/printSettingsFields';
import React, { useState, useEffect, useMemo } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import PasscodeModal from '@/Components/PasscodeModal';
import {
    Building2, Globe, Bell, Shield, ShieldCheck, Database, Printer,
    Save, Check, RefreshCw, AlertTriangle, FileText,
    ChevronRight, Palette, Lock, Users, Package, Search,
    Layout, Smartphone, Sparkles, ShoppingCart, BookOpen,
    MessageSquare, AlertOctagon, ExternalLink
} from 'lucide-react';

// Modular Section Components
import BusinessProfileSection from '@/Components/Settings/BusinessProfileSection';
import RegionNumbersSection from '@/Components/Settings/RegionNumbersSection';
import DisplayPreferencesSection from '@/Components/Settings/DisplayPreferencesSection';
import CheckoutReturnsSection from '@/Components/Settings/CheckoutReturnsSection';
import DocumentsNumberingSection from '@/Components/Settings/DocumentsNumberingSection';
import TaxSettingsSection from '@/Components/TaxSettingsSection';
import CustomersSuppliersSection from '@/Components/Settings/CustomersSuppliersSection';
import StockItemsSection from '@/Components/Settings/StockItemsSection';
import DocumentLayoutsSection from '@/Components/Settings/DocumentLayoutsSection';
import PrinterDeviceSection from '@/Components/Settings/PrinterDeviceSection';
import ManualSharingSection from '@/Components/Settings/ManualSharingSection';
import RemindersAlertsSection from '@/Components/Settings/RemindersAlertsSection';
import AccountingSection from '@/Components/Settings/AccountingSection';
import FeaturesConnectionsSection from '@/Components/Settings/FeaturesConnectionsSection';
import SecuritySection from '@/Components/Settings/SecuritySection';
import ApprovalsSection from '@/Components/Settings/ApprovalsSection';
import TerminalPairingSection from '@/Components/Settings/TerminalPairingSection';
import DangerSettingsSection from '@/Components/DangerSettingsSection';

import { vq } from '@/theme/runtime';
import { useTermText } from '@/lib/terms';
import { rememberPrintType } from '@/Utils/printPreference';

// ── Settings IA (5 Plain-Language Task Groups) ──────────────────────────
const SETTINGS_CATEGORIES = [
    {
        id: 'business',
        name: 'Business',
        icon: Building2,
        sections: ['profile', 'region_numbers', 'display']
    },
    {
        id: 'selling',
        name: 'Selling',
        icon: ShoppingCart,
        sections: ['checkout_returns', 'documents_numbering', 'taxes', 'customers_suppliers']
    },
    {
        id: 'inventory',
        name: 'Inventory',
        icon: Package,
        sections: ['stock_items']
    },
    {
        id: 'printing_sharing',
        name: 'Printing & Sharing',
        icon: Printer,
        sections: ['document_layouts', 'printer_device', 'manual_sharing']
    },
    {
        id: 'operations',
        name: 'Operations',
        icon: ClockIconWrapper,
        sections: ['reminders_alerts', 'accounting', 'features_connections']
    },
    {
        id: 'access_data',
        name: 'Access & Data',
        icon: Shield,
        sections: ['security', 'approvals', 'terminals', 'backup', 'reset']
    }
];

function ClockIconWrapper(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={props.size || 16}
            height={props.size || 16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={props.className}
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

const SETTINGS_SECTIONS = [
    // Business
    {
        id: 'profile',
        name: 'Business Profile',
        icon: Building2,
        description: 'Store name, address, phone, tax ID & custom domain',
        keywords: ['name', 'logo', 'address', 'phone', 'email', 'ntn', 'tax', 'domain', 'store']
    },
    {
        id: 'region_numbers',
        name: 'Region & Numbers',
        icon: Globe,
        description: 'Currency, timezone, language, date format & decimal precision',
        keywords: ['currency', 'symbol', 'timezone', 'language', 'date', 'decimals', 'precision', 'money']
    },
    {
        id: 'display',
        name: 'Display Preferences',
        icon: Palette,
        description: 'Text size, color theme, calculator and easier-to-read controls',
        keywords: ['zoom', 'scale', 'dark mode', 'calculator', 'senior', 'theme', 'appearance', 'density']
    },

    // Selling
    {
        id: 'checkout_returns',
        name: 'Checkout & Returns',
        icon: ShoppingCart,
        description: 'Cash payments, rounding, stock checks and returns',
        keywords: ['register', 'cash', 'round off', 'negative stock', 'overselling', 'returns', 'refunds', 'window']
    },
    {
        id: 'documents_numbering',
        name: 'Documents & Numbering',
        icon: FileText,
        description: 'Invoice types and the numbers shown on documents',
        keywords: ['invoice', 'prefix', 'billing', 'numbering', 'quotation', 'purchase', 'series']
    },
    {
        id: 'taxes',
        name: 'Taxes',
        icon: PercentIconWrapper,
        description: 'Tax rates and whether prices include tax',
        keywords: ['tax', 'gst', 'vat', 'inclusive', 'exclusive', 'rates', 'fbr']
    },
    {
        id: 'customers_suppliers',
        name: 'Customers & Suppliers',
        icon: Users,
        description: 'Customer and supplier groups, credit limits and rewards',
        keywords: ['customer', 'party', 'supplier', 'credit limit', 'loyalty', 'points', 'reward']
    },

    // Inventory
    {
        id: 'stock_items',
        name: 'Stock & Items',
        icon: Package,
        description: 'Stock tracking, barcodes, batches and wholesale prices',
        keywords: ['stock', 'inventory', 'barcode', 'scanner', 'batch', 'expiry', 'wholesale', 'cost', 'charity']
    },

    // Printing & Sharing
    {
        id: 'document_layouts',
        name: 'Document Layouts',
        icon: Layout,
        description: 'How receipts and invoices look when printed',
        keywords: ['layout', 'a4', 'a5', 'pdf', 'printed decimals', 'theme', 'columns', 'header', 'footer', 'logo']
    },
    {
        id: 'printer_device',
        name: 'Printer & Device',
        icon: Printer,
        description: 'Receipt paper, printer actions and cash drawer',
        keywords: ['thermal', 'printer', 'esc/pos', 'auto-cut', 'cash drawer', 'slip', 'receipt', 'cut']
    },
    {
        id: 'manual_sharing',
        name: 'Manual Sharing',
        icon: MessageSquare,
        description: 'Prepare messages and share invoices yourself',
        keywords: ['whatsapp', 'messages', 'templates', 'share', 'drafts', 'click to chat', 'sms']
    },

    // Operations
    {
        id: 'reminders_alerts',
        name: 'Reminders & Alerts',
        icon: Bell,
        description: 'Payment due reminders, recurring service schedules & low stock alerts',
        keywords: ['reminders', 'due date', 'service', 'low stock', 'email digest', 'alerts', 'notifications']
    },
    {
        id: 'accounting',
        name: 'Accounting',
        icon: BookOpen,
        description: 'Financial year, multiple businesses and cost warnings',
        keywords: ['fiscal year', 'multi firm', 'books', 'locks', 'depreciation', 'carrying cost', 'reckoner']
    },
    {
        id: 'features_connections',
        name: 'Features & Connections',
        icon: Sparkles,
        description: 'Turn on features and connect external services',
        keywords: ['system builder', 'apps', 'modules', 'ai', 'gemini', 'openai', 'fbr', 'stripe', 'woocommerce', 'online store', 'online shop', 'ecommerce', 'online orders']
    },

    // Access & Data
    {
        id: 'security',
        name: 'Security & Sign-in',
        icon: Shield,
        description: 'Passcodes, sign-in protection and staff access',
        keywords: ['passcode', 'pin', 'auto-logout', '2fa', 'sso', 'saml', 'staff', 'roles', 'permissions']
    },
    {
        id: 'approvals',
        name: 'Approvals',
        icon: ShieldCheck,
        description: 'Choose which transactions need a manager to approve them',
        keywords: ['approval', 'maker checker', 'governance', 'threshold', 'dual control', 'owner separation']
    },
    {
        id: 'terminals',
        name: 'Terminals',
        icon: Smartphone,
        description: 'Pair secondary VenQore Station counter devices',
        keywords: ['terminal', 'station', 'pairing', 'device', 'counter', 'sync']
    },
    {
        id: 'backup',
        name: 'Data & Backup',
        icon: Database,
        description: 'Cloud backups, local snapshots, restore & Google Drive sync',
        keywords: ['backup', 'restore', 'google drive', 'export', 'import', 'sql', 'database']
    },
    {
        id: 'reset',
        name: 'Factory Reset',
        icon: AlertOctagon,
        description: 'Erase transactional records or reset store database',
        keywords: ['reset', 'erase', 'danger', 'delete data', 'factory', 'wipe']
    }
];

function PercentIconWrapper(props) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={props.size || 16}
            height={props.size || 16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={props.className}
        >
            <line x1="19" y1="5" x2="5" y2="19" />
            <circle cx="6.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    );
}

// ── Backward-Compatible Hash Aliases Map ───────────────────────────────
const HASH_ALIASES = {
    business: 'profile',
    preferences: 'region_numbers',
    sales: 'checkout_returns',
    print: 'document_layouts',
    messages: 'manual_sharing',
    party: 'customers_suppliers',
    item: 'stock_items',
    reminders: 'reminders_alerts',
    modules: 'features_connections',
    ai_integrations: 'features_connections',
    region: 'region_numbers',
    display_settings: 'display',
    device: 'printer_device',
    sharing: 'manual_sharing',
    whatsapp: 'manual_sharing',
    alerts: 'reminders_alerts',
    notifications: 'reminders_alerts',
};

const resolveSectionId = (rawHash) => {
    if (!rawHash) return 'profile';
    const cleaned = rawHash.replace(/^#/, '');
    if (HASH_ALIASES[cleaned]) return HASH_ALIASES[cleaned];
    const match = SETTINGS_SECTIONS.find(s => s.id === cleaned);
    return match ? match.id : 'profile';
};

// ── Single-Source Authoritative Field Map ──────────────────────────────
const SECTION_FIELD_MAP = {
    profile: [
        'business_name', 'business_address', 'business_phone', 'business_email',
        'tax_number', 'custom_domain', 'store_name', 'store_address', 'store_phone',
        'product_cost_update_policy'
    ],
    region_numbers: [
        'currency', 'currency_symbol', 'timezone', 'language', 'date_format', 'decimal_places'
    ],
    display: [
        'ui_scale', 'dark_mode_default', 'header_calculator_enabled', 'senior_mode'
    ],
    checkout_returns: [
        'stop_sale_negative_stock', 'cash_sale_default', 'round_off_total',
        'pos_auto_fill_cash', 'show_margin_percentage', 'pos_return_mode',
        'pos_return_window', 'pos_return_window_behavior', 'charity_enabled'
    ],
    documents_numbering: [
        'invoice_number_enabled', 'billing_type', 'sale_prefix', 'purchase_prefix',
        'quotation_prefix', 'return_prefix'
    ],
    taxes: [
        'default_tax_rate', 'default_tax_basis', 'tax_rates', 'default_tax_id'
    ],
    customers_suppliers: [
        'loyalty_enabled', 'enable_credit_limit', 'party_grouping', 'strict_party_roles'
    ],
    stock_items: [
        'stock_maintenance', 'barcode_scan_enabled', 'batch_tracking_enabled',
        'wholesale_price_enabled', 'low_stock_alerts', 'low_stock_threshold'
    ],
    document_layouts: [
        ...printerSettingsFields, 'print_copies',
        'paper_size', 'paper_orientation', 'print_theme', 'print_theme_color',
        'print_logo', 'print_logo_path', 'print_logo_file', 'print_signature_text',
        'print_original_copy', 'print_company_text_size', 'print_invoice_text_size',
        'margin_top', 'margin_bottom', 'margin_left', 'margin_right',
        'custom_paper_width', 'custom_paper_height', 'print_show_sno',
        'print_show_units', 'print_show_mrp', 'print_show_description',
        'print_show_hsn', 'print_show_discount', 'print_show_free_qty',
        'print_qr_code', 'print_show_delivery_charge', 'print_show_extra_charge',
        'print_total_quantity', 'print_amount_decimal', 'print_received_amount',
        'print_balance_amount', 'print_party_balance', 'print_tax_details',
        'print_you_saved', 'print_show_previous_balance', 'print_amount_grouping',
        'print_amount_words', 'print_description', 'print_terms',
        'print_received_by', 'print_delivered_by', 'print_payment_mode',
        'print_acknowledgement', 'print_header_all_pages', 'print_extra_space_top',
        'print_min_item_rows', 'invoice_theme', 'invoice_primary_color', 'show_margin_on_invoice'
    ],
    printer_device: printerSettingsFields,
    manual_sharing: [
        'message_template_sales', 'message_template_returns', 'message_template_reminders', 'whatsapp_offer_pdf'
    ],
    reminders_alerts: [
        'payment_reminders', 'payment_reminder_days', 'service_reminders',
        'email_notifications', 'daily_sales_summary'
    ],
    accounting: [
        'multi_firm_enabled', 'fiscal_year_start',
        'reckoner.heavy_discount_pct', 'reckoner.expiry_warning_days', 'reckoner.carrying_cost_pct'
    ],
    features_connections: [
        'ai_provider', 'openai_api_key', 'anthropic_api_key', 'gemini_api_key', 'ai_model',
        'shared_catalog_opt_out', 'ai_accuracy_opt_in', 'fbr_integration', 'fbr_pos_id',
        'fbr_usin', 'stripe_enabled', 'woocommerce_enabled'
    ],
    security: [
        'enable_passcode', 'admin_passcode', 'auto_logout', 'sso_enabled', 'sso_idp_entity_id',
        'sso_url', 'sso_certificate'
    ],
    approvals: [
        'approval_admin_enabled', 'approval_strict_owner_separation',
        'approval_amount_threshold', 'approval_default_employee_mode',
        'approval_policy_customer_receipt', 'approval_threshold_customer_receipt',
        'approval_policy_supplier_payment', 'approval_threshold_supplier_payment',
        'approval_policy_operating_expense', 'approval_threshold_operating_expense',
        'approval_policy_sales_invoice', 'approval_threshold_sales_invoice',
        'approval_policy_supplier_refund', 'approval_threshold_supplier_refund',
        'approval_policy_purchase_posting', 'approval_threshold_purchase_posting',
        'approval_policy_sales_return', 'approval_threshold_sales_return',
        'approval_policy_purchase_return', 'approval_threshold_purchase_return',
        'approval_policy_capital_injection', 'approval_threshold_capital_injection',
        'approval_policy_owner_drawings', 'approval_threshold_owner_drawings',
        'approval_policy_fund_transfer', 'approval_threshold_fund_transfer'
    ]
};

export default function AdminSettings({ settings = {}, usersWithApprovals = [] }) {
    const tt = useTermText();
    const { store, auth } = usePage().props;
    const userRole = auth?.user?.role;
    const userPerms = auth?.user?.permissions || [];
    const isPlatformAdmin = !!auth?.user?.is_platform_admin;
    const canConfigureApprovals = isPlatformAdmin || userRole === 'owner' || userPerms.includes('approvals.configure') || userPerms.includes('*');

    const [activeSection, setActiveSection] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        let target = hash ? resolveSectionId(hash) : resolveSectionId(localStorage.getItem('active_settings_section'));
        if (target === 'approvals' && !canConfigureApprovals) {
            target = 'profile';
        }
        return target || 'profile';
    });

    useEffect(() => {
        localStorage.setItem('active_settings_section', activeSection);
        if (window.location.hash !== `#${activeSection}`) {
            window.location.hash = activeSection;
        }
    }, [activeSection]);

    useEffect(() => {
        const onHashChange = () => {
            const raw = window.location.hash.replace('#', '');
            const target = resolveSectionId(raw);
            if (target && target !== activeSection) {
                setActiveSection(target);
            }
        };
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [activeSection]);

    const [saved, setSaved] = useState(false);
    const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
    const [verifyingKey, setVerifyingKey] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState(['business', 'selling', 'inventory', 'printing_sharing', 'operations', 'access_data']);
    const [pendingSectionId, setPendingSectionId] = useState(null);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [sectionSearch, setSectionSearch] = useState('');

    const safeInt = (val, fallback) => {
        const parsed = parseInt(val, 10);
        return !isNaN(parsed) ? parsed : fallback;
    };

    const isTruthy = (val, defaultValue = false) => {
        if (val === undefined || val === null || val === '') return defaultValue;
        if (typeof val === 'boolean') return val;
        if (val === '1' || val === 1 || val === 'true') return true;
        if (val === '0' || val === 0 || val === 'false') return false;
        return Boolean(val);
    };

    const safeParseJson = (value, fallback) => {
        if (!value) return fallback;
        if (typeof value !== 'string') return Array.isArray(value) ? value : fallback;
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : fallback;
        } catch (e) {
            return fallback;
        }
    };

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

    const { data, setData, post, processing, errors, isDirty, reset, transform } = useForm({
        // Profile
        business_name: settings.business_name || store?.name || settings.store_name || 'VenQore',
        business_email: settings.business_email || store?.email || '',
        business_phone: settings.business_phone || store?.phone || '',
        business_address: settings.business_address || store?.address || '',
        tax_number: settings.tax_number || '',
        custom_domain: settings.custom_domain || store?.custom_domain || '',

        // Region & Numbers
        currency: settings.currency || 'PKR',
        currency_symbol: settings.currency_symbol || '',
        timezone: settings.timezone || 'Asia/Karachi',
        language: settings.language || 'en',
        date_format: settings.date_format || 'DD/MM/YYYY',
        decimal_places: safeInt(settings.decimal_places, 2),

        // Display
        ui_scale: safeInt(settings.ui_scale, 100),
        dark_mode_default: settings.dark_mode_default === '1' || settings.dark_mode_default === true,
        header_calculator_enabled: settings.header_calculator_enabled === '1' ? '1' : '0',
        senior_mode: settings.senior_mode === '1' || settings.senior_mode === true,

        // Selling - Checkout & Returns
        stop_sale_negative_stock: settings.stop_sale_negative_stock === '1' || settings.stop_sale_negative_stock === true,
        cash_sale_default: settings.cash_sale_default === '1' || settings.cash_sale_default === true,
        round_off_total: settings.round_off_total || 'none',
        pos_auto_fill_cash: settings.pos_auto_fill_cash === '1' || settings.pos_auto_fill_cash === true,
        show_margin_percentage: settings.show_margin_percentage === '1' || settings.show_margin_percentage === true,
        pos_return_mode: settings.pos_return_mode || 'reference',
        pos_return_window: settings.pos_return_window || '',
        pos_return_window_behavior: settings.pos_return_window_behavior || 'warn',

        // Selling - Documents & Numbering
        invoice_number_enabled: settings.invoice_number_enabled !== '0',
        billing_type: settings.billing_type || 'full',
        sale_prefix: settings.sale_prefix || 'INV-',
        purchase_prefix: settings.purchase_prefix || 'PUR-',
        quotation_prefix: settings.quotation_prefix || 'QTN-',
        return_prefix: settings.return_prefix || 'RET-',

        // Selling - Taxes
        default_tax_rate: settings.default_tax_rate || '0',
        default_tax_basis: settings.default_tax_basis || settings.tax_type || 'exclusive',
        default_tax_id: settings.default_tax_id || '',
        tax_rates: safeParseJson(settings.tax_rates, [
            { id: 1, name: 'GST 18%', rate: 18, type: 'percentage' },
            { id: 2, name: 'VAT 5%', rate: 5, type: 'percentage' }
        ]),

        // Selling - Customers & Suppliers
        loyalty_enabled: settings.loyalty_enabled === '1' || settings.loyalty_enabled === true,
        enable_credit_limit: settings.enable_credit_limit !== '0',
        party_grouping: settings.party_grouping === '1' || settings.party_grouping === true,

        // Inventory - Stock & Items
        stock_maintenance: settings.stock_maintenance !== '0',
        barcode_scan_enabled: settings.barcode_scan_enabled === '1' || settings.barcode_scan_enabled === true,
        batch_tracking_enabled: settings.batch_tracking_enabled === '1' || settings.batch_tracking_enabled === true,
        wholesale_price_enabled: settings.wholesale_price_enabled === '1' || settings.wholesale_price_enabled === true,
        charity_enabled: settings.charity_enabled === '1' || settings.charity_enabled === true,
        product_cost_update_policy: settings.product_cost_update_policy || 'never',

        // Printing - Document Layouts (Regular Layouts)
        paper_size: settings.paper_size || 'A4',
        paper_orientation: settings.paper_orientation || 'Portrait',
        print_theme: settings.print_theme || 'modern',
        print_theme_color: settings.print_theme_color || vq.indigo[600],
        print_logo: isTruthy(settings.print_logo, true),
        print_logo_path: settings.print_logo_path || store?.logo_url || store?.logo_path || null,
        print_logo_file: null,
        print_signature_text: settings.print_signature_text || 'Authorized Signatory',
        print_original_copy: isTruthy(settings.print_original_copy, false),
        print_company_text_size: settings.print_company_text_size || '4',
        print_invoice_text_size: settings.print_invoice_text_size || '3',
        margin_top: safeInt(settings.margin_top, 20),
        margin_bottom: safeInt(settings.margin_bottom, 20),
        margin_left: safeInt(settings.margin_left, 20),
        margin_right: safeInt(settings.margin_right, 20),
        custom_paper_width: safeInt(settings.custom_paper_width, 210),
        custom_paper_height: safeInt(settings.custom_paper_height, 297),
        print_show_sno: isTruthy(settings.print_show_sno, true),
        print_show_units: isTruthy(settings.print_show_units, true),
        print_show_mrp: isTruthy(settings.print_show_mrp, false),
        print_show_description: isTruthy(settings.print_show_description, true),
        print_show_hsn: isTruthy(settings.print_show_hsn, false),
        print_show_discount: isTruthy(settings.print_show_discount, false),
        print_show_free_qty: isTruthy(settings.print_show_free_qty, false),
        print_show_delivery_charge: isTruthy(settings.print_show_delivery_charge, true),
        print_show_extra_charge: isTruthy(settings.print_show_extra_charge, true),
        print_qr_code: isTruthy(settings.print_qr_code, true),
        print_total_quantity: isTruthy(settings.print_total_quantity, true),
        print_amount_decimal: isTruthy(settings.print_amount_decimal, true),
        print_received_amount: isTruthy(settings.print_received_amount, true),
        print_balance_amount: isTruthy(settings.print_balance_amount, true),
        print_party_balance: isTruthy(settings.print_party_balance, false),
        print_tax_details: isTruthy(settings.print_tax_details, true),
        print_you_saved: isTruthy(settings.print_you_saved, false),
        print_show_previous_balance: isTruthy(settings.print_show_previous_balance, false),
        print_amount_grouping: isTruthy(settings.print_amount_grouping, true),
        print_amount_words: settings.print_amount_words || '0',
        print_description: isTruthy(settings.print_description, true),
        print_terms: settings.print_terms || '',
        print_received_by: isTruthy(settings.print_received_by, false),
        print_delivered_by: isTruthy(settings.print_delivered_by, false),
        print_payment_mode: isTruthy(settings.print_payment_mode, true),
        print_acknowledgement: isTruthy(settings.print_acknowledgement, false),
        print_header_all_pages: isTruthy(settings.print_header_all_pages, true),
        print_extra_space_top: safeInt(settings.print_extra_space_top, 0),
        print_min_item_rows: safeInt(settings.print_min_item_rows, 5),
        invoice_theme: settings.invoice_theme || 'classic',
        invoice_primary_color: settings.invoice_primary_color && !settings.invoice_primary_color.includes('var(') ? settings.invoice_primary_color : '#4f46e5',
        show_margin_on_invoice: isTruthy(settings.show_margin_on_invoice, false),

        // Printing - Printer Device (Thermal Hardware)
        default_print_type: settings.default_print_type || 'regular',
        thermal_page_size: settings.thermal_page_size || '3inch',
        thermal_custom_chars: safeInt(settings.thermal_custom_chars, 48),
        thermal_use_bold: isTruthy(settings.thermal_use_bold, true),
        thermal_auto_cut: isTruthy(settings.thermal_auto_cut, true),
        thermal_open_drawer: isTruthy(settings.thermal_open_drawer, false),
        thermal_extra_lines: safeInt(settings.thermal_extra_lines, 3),
        thermal_copies: safeInt(settings.thermal_copies, 1),
        thermal_font_size: safeInt(settings.thermal_font_size, 12),
        thermal_show_headers: isTruthy(settings.thermal_show_headers, false),
        thermal_show_sno: isTruthy(settings.thermal_show_sno, false),
        thermal_show_units: isTruthy(settings.thermal_show_units, false),
        thermal_show_mrp: isTruthy(settings.thermal_show_mrp, false),
        thermal_show_description: isTruthy(settings.thermal_show_description, false),
        thermal_show_batch: isTruthy(settings.thermal_show_batch, false),
        thermal_show_expiry: isTruthy(settings.thermal_show_expiry, false),
        thermal_show_mfg_date: isTruthy(settings.thermal_show_mfg_date, false),
        thermal_show_size: isTruthy(settings.thermal_show_size, false),
        thermal_show_model: isTruthy(settings.thermal_show_model, false),
        thermal_show_serial: isTruthy(settings.thermal_show_serial, false),
        thermal_show_barcode: isTruthy(settings.thermal_show_barcode, true),
        thermal_custom_footer: settings.thermal_custom_footer || '',

        // Printing - Manual Sharing (WhatsApp Drafts)
        message_template_sales: settings.message_template_sales || 'Greetings from [Firm_Name]. Your invoice [Invoice_Number] for [Invoice_Amount] is ready. Receipt: [Link]',
        message_template_returns: settings.message_template_returns || 'Greetings from [Firm_Name]. Credit Note / Sale Return [Return_Number] for [Return_Amount] has been processed. Summary: [Link]',
        message_template_reminders: settings.message_template_reminders || 'Dear [Customer_Name], this is a friendly reminder that invoice #[Invoice_Number] from [Firm_Name] is outstanding. Current amount due: [Due_Amount]. View receipt: [Link]',
        whatsapp_offer_pdf: settings.whatsapp_offer_pdf !== '0' && settings.whatsapp_offer_pdf !== false,

        // Operations - Reminders & Alerts
        payment_reminders: settings.payment_reminders === '1' || settings.payment_reminders === true,
        payment_reminder_days: safeInt(settings.payment_reminder_days, 7),
        service_reminders: safeParseJson(settings.service_reminders, []),
        low_stock_alerts: settings.low_stock_alerts === '1' || settings.low_stock_alerts === true,
        low_stock_threshold: safeInt(settings.low_stock_threshold, 10),
        email_notifications: settings.email_notifications !== '0',
        daily_sales_summary: settings.daily_sales_summary === '1' || settings.daily_sales_summary === true,

        // Operations - Accounting
        multi_firm_enabled: settings.multi_firm_enabled === '1' || settings.multi_firm_enabled === true,
        fiscal_year_start: settings.fiscal_year_start || '2025-01-01',
        'reckoner.heavy_discount_pct': safeInt(settings['reckoner.heavy_discount_pct'] ?? settings.reckoner_heavy_discount_pct, 20),
        'reckoner.expiry_warning_days': safeInt(settings['reckoner.expiry_warning_days'] ?? settings.reckoner_expiry_warning_days, 30),
        'reckoner.carrying_cost_pct': safeInt(settings['reckoner.carrying_cost_pct'] ?? settings.reckoner_carrying_cost_pct, 15),

        // Operations - Features & Connections
        ai_provider: settings.ai_provider || 'gemini',
        openai_api_key: settings.openai_api_key || '',
        ai_model: settings.ai_model || 'gemini-2.5-flash',
        shared_catalog_opt_out: Boolean(store?.shared_catalog_opt_out ?? (settings.shared_catalog_opt_out === '1' || settings.shared_catalog_opt_out === true)),
        ai_accuracy_opt_in: Boolean(store?.ai_accuracy_opt_in ?? (settings.ai_accuracy_opt_in === '1' || settings.ai_accuracy_opt_in === true)),
        fbr_integration: settings.fbr_integration === '1' || settings.fbr_integration === true,
        fbr_pos_id: settings.fbr_pos_id || '',
        fbr_usin: settings.fbr_usin || '',
        stripe_enabled: settings.stripe_enabled === '1' || settings.stripe_enabled === true,
        woocommerce_enabled: settings.woocommerce_enabled === '1' || settings.woocommerce_enabled === true,

        // Access & Data - Security
        enable_passcode: settings.enable_passcode === '1' || settings.enable_passcode === true,
        admin_passcode: settings.admin_passcode || '',
        auto_logout: safeInt(settings.auto_logout, 30),
        sso_enabled: settings.sso_enabled === '1' || settings.sso_enabled === true,
        sso_idp_entity_id: settings.sso_idp_entity_id || '',
        sso_url: settings.sso_url || '',
        sso_certificate: settings.sso_certificate || '',

        // Access & Data - Approvals
        approval_admin_enabled: settings.approval_admin_enabled === '1' || settings.approval_admin_enabled === true,
        approval_strict_owner_separation: settings.approval_strict_owner_separation === '1' || settings.approval_strict_owner_separation === true,
        approval_default_employee_mode: settings.approval_default_employee_mode || 'inherit',
        approval_amount_threshold: settings.approval_amount_threshold || '0',
        approval_policy_customer_receipt: settings.approval_policy_customer_receipt || 'inherit',
        approval_threshold_customer_receipt: settings.approval_threshold_customer_receipt || '',
        approval_policy_supplier_payment: settings.approval_policy_supplier_payment || 'inherit',
        approval_threshold_supplier_payment: settings.approval_threshold_supplier_payment || '',
        approval_policy_operating_expense: settings.approval_policy_operating_expense || 'inherit',
        approval_threshold_operating_expense: settings.approval_threshold_operating_expense || '',
        approval_policy_sales_invoice: settings.approval_policy_sales_invoice || 'inherit',
        approval_threshold_sales_invoice: settings.approval_threshold_sales_invoice || '',
        approval_policy_supplier_refund: settings.approval_policy_supplier_refund || 'inherit',
        approval_threshold_supplier_refund: settings.approval_threshold_supplier_refund || '',
        approval_policy_purchase_posting: settings.approval_policy_purchase_posting || 'inherit',
        approval_threshold_purchase_posting: settings.approval_threshold_purchase_posting || '',
        approval_policy_sales_return: settings.approval_policy_sales_return || 'inherit',
        approval_threshold_sales_return: settings.approval_threshold_sales_return || '',
        approval_policy_purchase_return: settings.approval_policy_purchase_return || 'inherit',
        approval_threshold_purchase_return: settings.approval_threshold_purchase_return || '',
        approval_policy_capital_injection: settings.approval_policy_capital_injection || 'inherit',
        approval_threshold_capital_injection: settings.approval_threshold_capital_injection || '',
        approval_policy_owner_drawings: settings.approval_policy_owner_drawings || 'inherit',
        approval_threshold_owner_drawings: settings.approval_threshold_owner_drawings || '',
        approval_policy_fund_transfer: settings.approval_policy_fund_transfer || 'inherit',
        approval_threshold_fund_transfer: settings.approval_threshold_fund_transfer || '',
    });

    const saveSettings = (code, sectionToSave = activeSection, extraData = {}) => {
        transform((currentData) => {
            const allowedKeys = SECTION_FIELD_MAP[sectionToSave];
            const payload = {
                _save_section: sectionToSave,
                ...extraData,
            };
            if (code) {
                payload.passcode_challenge = code;
            }
            if (allowedKeys) {
                allowedKeys.forEach(k => {
                    if (extraData[k] !== undefined) {
                        payload[k] = extraData[k];
                    } else if (currentData[k] !== undefined) {
                        payload[k] = currentData[k];
                    }
                });
            } else {
                Object.assign(payload, currentData, extraData);
            }
            return payload;
        });

        post(route('store.settings.update', { store_slug: store?.slug }), {
            preserveScroll: true,
            onSuccess: (page) => {
                const newSettings = page?.props?.settings || {};
                if (page?.props?.settings && typeof window !== 'undefined') {
                    window.amdSettings = { ...(window.amdSettings || {}), ...newSettings, store_slug: store?.slug };
                }
                const updatedType = extraData.default_print_type || data.default_print_type || newSettings.default_print_type;
                if (updatedType) {
                    rememberPrintType(updatedType);
                    if (typeof window !== 'undefined' && window.amdSettings) {
                        window.amdSettings.default_print_type = updatedType;
                    }
                }
                if (page?.props?.settings) {
                    setData(prev => {
                        const next = { ...prev, ...extraData };
                        Object.keys(newSettings).forEach(k => {
                            if (next[k] !== undefined && extraData[k] === undefined) {
                                if (typeof prev[k] === 'boolean') {
                                    next[k] = newSettings[k] === '1' || newSettings[k] === true || newSettings[k] === 'true';
                                } else {
                                    next[k] = newSettings[k];
                                }
                            }
                        });
                        return next;
                    });
                }
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            },
            onError: (errs) => {
                console.error('[Settings] Save failed:', errs);
            }
        });
    };

    const handleSectionChange = (sectionId) => {
        if (sectionId === 'backup') {
            router.visit(route('store.admin.data', { store_slug: store?.slug, tab: 'backups' }));
            return;
        }

        if (isDirty) {
            setPendingSectionId(sectionId);
            setShowUnsavedModal(true);
        } else {
            setActiveSection(sectionId);
            if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', `#${sectionId}`);
            }
        }
    };

    const handleSaveAndSwitch = () => {
        const isPasscodeEnabled = settings.enable_passcode === '1' || settings.enable_passcode === true;
        if (isPasscodeEnabled) {
            setShowUnsavedModal(false);
            setIsPasscodeModalOpen(true);
            return;
        }
        const currentActive = activeSection;
        const targetSection = pendingSectionId;
        setShowUnsavedModal(false);

        transform((currentData) => {
            const allowedKeys = SECTION_FIELD_MAP[currentActive];
            const payload = {
                _save_section: currentActive,
            };
            if (allowedKeys) {
                allowedKeys.forEach(k => {
                    if (currentData[k] !== undefined) {
                        payload[k] = currentData[k];
                    }
                });
            } else {
                Object.assign(payload, currentData);
            }
            return payload;
        });

        post(route('store.settings.update', { store_slug: store?.slug }), {
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                if (targetSection) {
                    setActiveSection(targetSection);
                    if (typeof window !== 'undefined') {
                        window.history.replaceState(null, '', `#${targetSection}`);
                    }
                    setPendingSectionId(null);
                }
            }
        });
    };

    const handleDiscardAndSwitch = () => {
        const targetSection = pendingSectionId;
        setShowUnsavedModal(false);
        reset();
        if (targetSection) {
            setActiveSection(targetSection);
            if (typeof window !== 'undefined') {
                window.history.replaceState(null, '', `#${targetSection}`);
            }
            setPendingSectionId(null);
        }
    };

    const handleCancelSwitch = () => {
        setShowUnsavedModal(false);
        setPendingSectionId(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const isPasscodeEnabled = settings.enable_passcode === '1' || settings.enable_passcode === true;
        if (isPasscodeEnabled) {
            setIsPasscodeModalOpen(true);
        } else {
            saveSettings();
        }
    };

    const renderSection = () => {
        switch (activeSection) {
            // Business Group
            case 'profile':
                return <BusinessProfileSection data={data} setData={setData} />;
            case 'region_numbers':
                return <RegionNumbersSection data={data} setData={setData} />;
            case 'display':
                return <DisplayPreferencesSection data={data} setData={setData} />;

            // Selling Group
            case 'checkout_returns':
                return <CheckoutReturnsSection data={data} setData={setData} />;
            case 'documents_numbering':
                return <DocumentsNumberingSection data={data} setData={setData} />;
            case 'taxes':
                return <TaxSettingsSection data={data} setData={setData} />;
            case 'customers_suppliers':
                return <CustomersSuppliersSection data={data} setData={setData} />;

            // Inventory Group
            case 'stock_items':
                return <StockItemsSection data={data} setData={setData} />;

            // Printing & Sharing Group
            case 'document_layouts':
                return <DocumentLayoutsSection data={data} setData={setData} saveSettings={saveSettings} />;
            case 'printer_device':
                return <PrinterDeviceSection data={data} setData={setData} />;
            case 'manual_sharing':
                return <ManualSharingSection data={data} setData={setData} saveSettings={saveSettings} />;

            // Operations Group
            case 'reminders_alerts':
                return <RemindersAlertsSection data={data} setData={setData} />;
            case 'accounting':
                return <AccountingSection data={data} setData={setData} />;
            case 'features_connections':
                return (
                    <FeaturesConnectionsSection
                        data={data}
                        setData={setData}
                        handleVerifyKey={handleVerifyKey}
                        verifyingKey={verifyingKey}
                        verificationResult={verificationResult}
                    />
                );

            // Access & Data Group
            case 'security':
                return <SecuritySection data={data} setData={setData} />;
            case 'approvals':
                return <ApprovalsSection data={data} setData={setData} store={store} usersWithApprovals={usersWithApprovals} />;
            case 'terminals':
                return <TerminalPairingSection storeSlug={store?.slug} />;
            case 'backup':
                return (
                    <div className="flex flex-col items-center text-center gap-4 bg-surface rounded-2xl border border-line p-12 animate-in fade-in slide-in-from-bottom-2 duration-slow">
                        <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-lg">
                            <Database size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-ink mb-2">Backups now live in Data &amp; Backup Hub</h3>
                            <p className="text-sm text-ink-muted max-w-md">
                                Automatic backups, manual database dumps, cloud sync, and CSV imports are organized in the centralized hub.
                            </p>
                        </div>
                        <a
                            href={route('store.admin.data', { store_slug: store?.slug, tab: 'backups' })}
                            className="inline-flex items-center gap-2 px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
                        >
                            <span>Go to Data &amp; Backup Hub</span>
                            <ChevronRight size={18} />
                        </a>
                    </div>
                );
            case 'reset':
                return <DangerSettingsSection data={data} setData={setData} />;

            default:
                return (
                    <div className="h-64 flex flex-col items-center justify-center text-ink-muted opacity-50">
                        <Building2 size={48} className="mb-4" />
                        <p className="font-bold uppercase tracking-widest">Section Under Development</p>
                    </div>
                );
        }
    };

    const currentSection = SETTINGS_SECTIONS.find(s => s.id === activeSection) || SETTINGS_SECTIONS[0];

    return (
        <OneGlanceLayout title="Settings" activeMenu="Settings" noPadding={true}>
            <Head title="Settings" />

            <div className="h-full flex gap-6 overflow-hidden px-6 pb-6 pt-3.5">
                {/* Main Content Area (Left) */}
                <div className="flex-1 min-w-0 bg-surface rounded-2xl border border-line shadow-xs flex flex-col overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />

                    <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10">
                        {/* Sleek Slim Header (Single-line height aligned) */}
                        <div className="px-6 py-3.5 border-b border-line shrink-0 bg-surface/90 backdrop-blur-md">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="px-2.5 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-3xs font-bold uppercase tracking-wider rounded-md shrink-0">
                                        {activeSection === 'security'
                                            ? 'Account Scope'
                                            : activeSection === 'terminals'
                                            ? 'Device Scope'
                                            : activeSection === 'display' || activeSection === 'checkout_returns'
                                            ? 'Register Scope'
                                            : 'Store Scope'}
                                    </span>
                                    <span className="h-3.5 w-px bg-line shrink-0" />
                                    <h2 className="text-base font-bold text-ink tracking-tight shrink-0">
                                        {currentSection?.name}
                                    </h2>
                                    <span className="hidden md:inline-block text-xs text-ink-muted truncate font-medium">
                                        — {tt(currentSection?.description || '')}
                                    </span>
                                    {store?.name && (
                                        <span className="hidden lg:inline-block text-3xs font-semibold text-ink-muted shrink-0">· {store.name}</span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-brand-600 dark:hover:bg-brand-700 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 shrink-0 disabled:opacity-60 cursor-pointer"
                                >
                                    {saved ? (
                                        <>
                                            <Check size={15} strokeWidth={2.5} className="text-emerald-400" />
                                            <span>Saved</span>
                                        </>
                                    ) : processing ? (
                                        <>
                                            <RefreshCw size={15} className="animate-spin text-brand-300" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={15} />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Content Scroll Container */}
                        <div className="flex-1 custom-scrollbar p-6 overflow-y-auto">
                            <div className="mx-auto max-w-5xl pb-10 transition-all duration-slow">
                                {errors && Object.keys(errors).length > 0 && (
                                    <div role="alert" className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                                            <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
                                            <span>Settings could not be saved. Please correct the following errors:</span>
                                        </div>
                                        <ul className="list-disc list-inside text-xs space-y-1 mt-1 text-rose-800 dark:text-rose-200 font-medium">
                                            {Object.entries(errors).map(([key, msg]) => (
                                                <li key={key}>
                                                    <span className="font-bold capitalize">{key.replace(/_/g, ' ')}:</span> {msg}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {renderSection()}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Settings Side Panel (Right) - V6 Standalone Mesh Background Styled */}
                <div
                    className={`${sidebarCollapsed ? 'w-16' : 'w-72 sm:w-80'} rounded-2xl border border-white/10 dark:border-white/10 shadow-lg p-3 shrink-0 flex flex-col relative overflow-hidden transition-all duration-slow`}
                    style={{
                        background: 'radial-gradient(52% 62% at 16% 10%, rgba(35,196,166,0.30), transparent 68%), radial-gradient(46% 54% at 84% 80%, rgba(7,107,94,0.34), transparent 66%), radial-gradient(38% 42% at 62% 26%, rgba(93,165,176,0.14), transparent 70%), #0A0F0E'
                    }}
                >
                    {/* Mesh Gradient Ambient Glow Elements */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-36 h-36 bg-teal-500/15 rounded-full blur-[50px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                    <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" />

                    {/* Header with Collapse Toggle */}
                    <div className={`${sidebarCollapsed ? 'px-1 py-3 justify-center' : 'px-3 py-3 justify-between'} flex items-center border-b border-white/10 mb-3 relative z-50`}>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSidebarCollapsed(!sidebarCollapsed);
                            }}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors shrink-0 z-50 cursor-pointer"
                            title={sidebarCollapsed ? "Expand settings panel" : "Collapse settings panel"}
                        >
                            <ChevronRight size={14} className={`transition-transform duration-slow ${sidebarCollapsed ? 'rotate-180' : ''}`} />
                        </button>
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="text-right">
                                    <h2 className="text-sm font-bold text-white tracking-tight">Settings</h2>
                                    <p className="text-3xs font-bold uppercase tracking-[0.2em] text-emerald-400">Store Config</p>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shrink-0">
                                    <Building2 size={16} />
                                </div>
                            </div>
                        )}
                    </div>

                    {!sidebarCollapsed && (
                        <div className="px-1 pb-2 relative z-20">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                                <input
                                    type="text"
                                    value={sectionSearch}
                                    onChange={(e) => setSectionSearch(e.target.value)}
                                    placeholder="Search settings & keywords..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                />
                            </div>
                        </div>
                    )}

                    <nav className="flex-1 overflow-y-auto px-1 custom-scrollbar space-y-1 relative z-10 pb-16">
                        {SETTINGS_CATEGORIES.map((category) => {
                            const CatIcon = category.icon;
                            const isExpanded = Boolean(sectionSearch) || expandedCategories.includes(category.id);
                            const categorySections = SETTINGS_SECTIONS.filter(s => {
                                if (s.id === 'approvals' && !canConfigureApprovals) return false;
                                return category.sections.includes(s.id) &&
                                (!sectionSearch ||
                                    s.name.toLowerCase().includes(sectionSearch.toLowerCase()) ||
                                    s.description.toLowerCase().includes(sectionSearch.toLowerCase()) ||
                                    s.keywords?.some(k => k.toLowerCase().includes(sectionSearch.toLowerCase())));
                            });

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
                                            className="w-full flex items-center justify-between px-2.5 py-1.5 text-2xs font-bold uppercase tracking-[0.18em] text-neutral-400 hover:text-emerald-300 transition-colors group"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CatIcon size={12} className="text-neutral-400 group-hover:text-emerald-300" />
                                                {category.name}
                                            </div>
                                            <ChevronRight size={12} className={`transition-transform duration-normal ${isExpanded ? 'rotate-90' : ''}`} />
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
                                                        className={`w-full flex items-center gap-2.5 ${sidebarCollapsed ? 'p-2 justify-center' : 'p-2.5'} rounded-xl text-left transition-all duration-normal group relative overflow-hidden border ${isActive
                                                            ? 'bg-white/15 backdrop-blur-xl border-white/25 text-white shadow-xs'
                                                            : 'text-neutral-300 hover:bg-white/5 hover:text-white border-transparent'
                                                            }`}
                                                    >
                                                        {isActive && (
                                                            <div className="absolute inset-0 bg-emerald-500/20 opacity-100" />
                                                        )}

                                                        <div className={`relative z-10 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-normal ${isActive ? 'bg-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]' : 'bg-white/5 text-neutral-400 group-hover:text-emerald-300 group-hover:bg-white/10'}`}>
                                                            <Icon size={15} />
                                                        </div>

                                                        {!sidebarCollapsed && (
                                                            <div className="relative z-10 flex-1 min-w-0">
                                                                <p className={`text-xs font-bold tracking-tight ${isActive ? 'text-white' : 'text-neutral-200'}`}>{section.name}</p>
                                                                <p className={`text-3xs leading-tight ${isActive ? 'text-emerald-200' : 'text-neutral-400'} line-clamp-1`}>
                                                                    {tt(section.description)}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {!sidebarCollapsed && (
                                                            <ChevronRight size={14} className={`relative z-10 transition-all duration-normal shrink-0 ${isActive ? 'text-emerald-300' : 'text-neutral-500 opacity-0 group-hover:opacity-100'}`} />
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
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgb(var(--vq-slate-700));
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgb(var(--vq-slate-600));
                }
            `}</style>

            <PasscodeModal
                isOpen={isPasscodeModalOpen}
                onClose={() => setIsPasscodeModalOpen(false)}
                onSuccess={(code) => saveSettings(code)}
                settings={settings}
            />

            {/* V6 Design System: Unsaved Changes Modal */}
            {showUnsavedModal && (
                <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
                        onClick={handleCancelSwitch}
                        aria-hidden="true"
                    />

                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="unsaved-changes-title"
                        className="relative z-10 w-full max-w-md bg-surface border border-line dark:border-line-strong rounded-2xl shadow-2xl p-6 backdrop-blur-md animate-in zoom-in-95 slide-in-from-bottom-3 duration-fast"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-xs">
                                <AlertTriangle size={28} className="animate-pulse" />
                            </div>
                            <h3 id="unsaved-changes-title" className="text-lg font-bold text-ink tracking-tight">
                                Unsaved Changes
                            </h3>
                            <p className="text-sm text-ink-secondary dark:text-ink-muted mt-2 leading-relaxed max-w-sm">
                                You have unsaved changes. Do you want to save them before switching sections?
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-6">
                            <button
                                type="button"
                                onClick={handleSaveAndSwitch}
                                className="order-1 sm:order-1 py-2.5 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                                <Check size={14} />
                                <span>Save & Switch</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDiscardAndSwitch}
                                className="order-2 sm:order-2 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1 shadow-xs"
                            >
                                <span>Discard</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleCancelSwitch}
                                className="order-3 sm:order-3 py-2.5 px-3 bg-sunken hover:bg-interactive-hover dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-line-strong dark:border-neutral-700 text-ink dark:text-neutral-200 font-bold rounded-xl text-xs transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-1 shadow-xs"
                            >
                                <span>Cancel</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </OneGlanceLayout>
    );
}
