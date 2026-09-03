import React, { useState } from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import {
 Settings, Building2, Shield, Lock, Save, Check, RefreshCw,
 ChevronRight, ShoppingCart, Percent, FileText, Smartphone,
 AlertTriangle, Layout
} from 'lucide-react';
import Toggle from '@/Components/Toggle';
import SectionHeader from '@/Components/SectionHeader';

const SETTINGS_CATEGORIES = [
 {
 id: 'org',
 name: 'Organization',
 icon: Building2,
 sections: ['general', 'taxes']
 },
 {
 id: 'ops',
 name: 'Operations',
 icon: ShoppingCart,
 sections: ['pos']
 },
 {
 id: 'adv',
 name: 'Advanced',
 icon: Shield,
 sections: ['security']
 }
];

const SETTINGS_SECTIONS = [
 { id: 'general', name: 'Store Info', icon: Building2, description: 'Store details and address' },
 { id: 'pos', name: 'POS & Sales', icon: ShoppingCart, description: 'Sales and interface configuration' },
 { id: 'security', name: 'Security', icon: Shield, description: 'Access control & passcodes' },
 { id: 'taxes', name: 'Tax Rates', icon: Percent, description: 'Configure custom tax brackets' },
];

export default function SettingsPanel({ settings }) {
 const {
 store
 } = usePage().props;

 const { auth } = usePage().props;
 // Check if user is admin. matches original logic
 const isAdmin = auth.user.role === 'admin' || auth.user.role === 'owner' || auth.user.role === 'platform_admin' || auth.user.email === 'abdullah@example.com';

 const [activeSection, setActiveSection] = useState('general');
 const [saved, setSaved] = useState(false);
 const [acknowledgeOpenReturn, setAcknowledgeOpenReturn] = useState(settings.pos_return_mode === 'open');
 const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
 const [expandedCategories, setExpandedCategories] = useState(['org', 'ops', 'adv']);

 const toggleCategory = (catId) => {
 setExpandedCategories(prev =>
 prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
 );
 };

 // Initialize form with flat structure for simpler handling, similar to Admin Settings,
 // but mapping to the specific keys used in this view
 const { data, setData, post, processing } = useForm({
 // POS & Sales
 pos_auto_fill_cash: settings.pos_auto_fill_cash === '1',
 senior_mode: settings.senior_mode === '1',
 fbr_integration: settings.fbr_integration === '1',
 show_margin_percentage: settings.show_margin_percentage === '1',
 stop_sale_negative_stock: settings.stop_sale_negative_stock === '1',
 round_off_total: settings.round_off_total || 'none',
 default_tax_rate: settings.default_tax_rate || '0',
 pos_return_mode: settings.pos_return_mode || 'reference',
 pos_return_window: settings.pos_return_window || '',
 pos_return_window_behavior: settings.pos_return_window_behavior || 'warn',
 charity_enabled: settings.charity_enabled === '1' || settings.charity_enabled === true,

 // General
 store_name: settings.store_name || '',
 store_address: settings.store_address || '',
 store_phone: settings.store_phone || '',
 product_cost_update_policy: settings.product_cost_update_policy || 'never',

 // Security
 enable_passcode: settings.enable_passcode === '1',
 admin_passcode: settings.admin_passcode || '',

 // Invoice styling & Custom domain
 invoice_theme: settings.invoice_theme || 'classic',
 invoice_primary_color: settings.invoice_primary_color || 'rgb(var(--vq-indigo-600))',
 show_margin_on_invoice: settings.show_margin_on_invoice === '1',
 custom_domain: store.custom_domain || '',
 tax_rates: typeof settings.tax_rates === 'string' ? settings.tax_rates : JSON.stringify(settings.tax_rates || [{ id: 1, name: 'GST 18%', rate: 18, type: 'percentage' }, { id: 2, name: 'VAT 5%', rate: 5, type: 'percentage' }], null, 2),
 sso_enabled: settings.sso_enabled === '1',
 sso_idp_entity_id: settings.sso_idp_entity_id || '',
 sso_url: settings.sso_url || '',
 sso_certificate: settings.sso_certificate || '',
 });

 const handleSubmit = (e) => {
 e.preventDefault();

 // Transform back to the expected backend format if needed
 // The backend likely expects a 'settings' array/object based on previous code:
 // router.post(route('store.settings.update', { store_slug: store.slug }), { settings: formattedSettings } ...

 const formattedSettings = {
 pos_auto_fill_cash: data.pos_auto_fill_cash ? '1' : '0',
 senior_mode: data.senior_mode ? '1' : '0',
 fbr_integration: data.fbr_integration ? '1' : '0',
 show_margin_percentage: data.show_margin_percentage ? '1' : '0',
 stop_sale_negative_stock: data.stop_sale_negative_stock ? '1' : '0',
 round_off_total: data.round_off_total,
 enable_passcode: data.enable_passcode ? '1' : '0',
 store_name: data.store_name,
 store_address: data.store_address,
 store_phone: data.store_phone,
 default_tax_rate: data.default_tax_rate,
 admin_passcode: data.admin_passcode,
 product_cost_update_policy: data.product_cost_update_policy,
 pos_return_mode: data.pos_return_mode,
 pos_return_window: data.pos_return_window,
 pos_return_window_behavior: data.pos_return_window_behavior,
 charity_enabled: data.charity_enabled ? '1' : '0',
 invoice_theme: data.invoice_theme,
 invoice_primary_color: data.invoice_primary_color,
 show_margin_on_invoice: data.show_margin_on_invoice ? '1' : '0',
 custom_domain: data.custom_domain,
 tax_rates: data.tax_rates,
 sso_enabled: data.sso_enabled ? '1' : '0',
 sso_idp_entity_id: data.sso_idp_entity_id,
 sso_url: data.sso_url,
 sso_certificate: data.sso_certificate,
 };

 router.post(route("store.settings.update", {
 store_slug: store.slug
 }), { settings: formattedSettings }, {
 preserveScroll: true,
 onSuccess: () => {
 setSaved(true);
 setTimeout(() => setSaved(false), 3000);
 }
 });
 };





 const renderSection = () => {
 switch (activeSection) {
 case 'general':
 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="block text-sm font-bold text-ink-secondary mb-2">Store Name</label>
 <input
 type="text"
 value={data.store_name}
 onChange={(e) => setData('store_name', e.target.value)}
 className="w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
 placeholder="My Store"
 />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-ink-secondary mb-2">Store Phone</label>
 <input
 type="text"
 value={data.store_phone}
 onChange={(e) => setData('store_phone', e.target.value)}
 className="w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
 placeholder="+92 300 1234567"
 />
 </div>
 <div className="space-y-2 md:col-span-2">
 <label className="block text-sm font-bold text-ink-secondary mb-2">Store Address</label>
 <textarea
 value={data.store_address}
 onChange={(e) => setData('store_address', e.target.value)}
 className="w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
 rows={3}
 placeholder="Full store address"
 />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-ink-secondary mb-2">Default Tax Rate (%)</label>
 <div className="relative">
 <select
 value={data.default_tax_rate}
 onChange={(e) => setData('default_tax_rate', e.target.value)}
 className="w-full pl-4 pr-10 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer font-bold text-ink"
 >
 <option value="0">None (0%)</option>
 {(() => {
 try {
 const parsedTaxRates = settings?.tax_rates ? (typeof settings.tax_rates === 'string' ? JSON.parse(settings.tax_rates) : settings.tax_rates) : [
 { id: 1, name: 'GST 18%', rate: 18, type: 'percentage' },
 { id: 2, name: 'VAT 5%', rate: 5, type: 'percentage' }
 ];
 return parsedTaxRates.map((tax) => (
 <option key={tax.id} value={tax.rate}>
 {tax.name} ({tax.rate}%)
 </option>
 ));
 } catch (e) {
 return null;
 }
 })()}
 {data.default_tax_rate && data.default_tax_rate !== '0' && !(() => {
 try {
 const rates = settings?.tax_rates ? (typeof settings.tax_rates === 'string' ? JSON.parse(settings.tax_rates) : settings.tax_rates) : [];
 return rates.some(t => String(t.rate) === String(data.default_tax_rate));
 } catch(e) { return false; }
 })() && (
 <option value={data.default_tax_rate}>
 Custom ({data.default_tax_rate}%)
 </option>
 )}
 </select>
 </div>
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-ink-secondary mb-2">Custom Domain Mapping</label>
 <input
 type="text"
 value={data.custom_domain}
 onChange={(e) => setData('custom_domain', e.target.value)}
 className="w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
 placeholder="e.g. store.mydomain.com"
 />
 </div>

 <div className="h-px bg-sunken dark:bg-white/10 md:col-span-2 my-4"></div>

 <div className="space-y-2 md:col-span-2">
 <h3 className="text-md font-bold text-ink">Invoice & PDF Customization</h3>
 <p className="text-xs text-ink-muted">Manage the design and interactive elements of generated B2B invoices.</p>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-ink-secondary mb-2">Invoice Template Theme</label>
 <select
 value={data.invoice_theme}
 onChange={(e) => setData('invoice_theme', e.target.value)}
 className="w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
 >
 <option value="classic">Classic Minimalist</option>
 <option value="modern">Modern Professional</option>
 <option value="elegant">Elegant Serif</option>
 </select>
 </div>

 <div className="space-y-2">
 <label className="block text-sm font-bold text-ink-secondary mb-2">Primary Brand Color</label>
 <div className="flex gap-2">
 <input
 type="color"
 value={data.invoice_primary_color}
 onChange={(e) => setData('invoice_primary_color', e.target.value)}
 className="h-11 w-14 bg-sunken border border-line dark:border-line rounded-xl cursor-pointer p-1"
 />
 <input
 type="text"
 value={data.invoice_primary_color}
 onChange={(e) => setData('invoice_primary_color', e.target.value)}
 className="flex-1 px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
 />
 </div>
 </div>

 <div className="space-y-2 md:col-span-2">
 <div className="flex items-center justify-between p-4 bg-sunken rounded-xl border border-line">
 <div>
 <h4 className="text-sm font-bold text-ink">B2B Margin Display</h4>
 <p className="text-xs text-ink-muted">Display item-level profit margin column directly on B2B invoices.</p>
 </div>
 <input
 type="checkbox"
 checked={data.show_margin_on_invoice}
 onChange={(e) => setData('show_margin_on_invoice', e.target.checked)}
 className="w-5 h-5 accent-brand-500 rounded border-line focus:ring-brand-500"
 />
 </div>
 <div className="space-y-2">
 <label className="block text-sm font-bold text-ink-secondary mb-2">Auto-Update Product Cost</label>
 <select
 value={data.product_cost_update_policy}
 onChange={(e) => setData('product_cost_update_policy', e.target.value)}
 className="w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
 >
 <option value="never">Never (Keep V3 FIFO Batches Only)</option>
 <option value="always">Always (Update to Latest Purchase Price)</option>
 <option value="increase_only">On Cost Increase Only</option>
 <option value="decrease_only">On Cost Decrease Only</option>
 </select>
 </div>
 </div>
 </div>
 </div>
 );

 case 'pos':
 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
 <div className="bg-surface rounded-2xl border border-line p-6">
 <SectionHeader title="Sales Configuration" description="Customize your point of sale experience" />
 <div className="divide-y divide-line">
 <Toggle
 enabled={data.pos_auto_fill_cash}
 onChange={v => setData('pos_auto_fill_cash', v)}
 label="Auto-Fill Cash Received"
 description="Automatically populate the 'Cash Received' field with the total amount"
 />
 <Toggle
 enabled={data.senior_mode}
 onChange={v => setData('senior_mode', v)}
 label="Senior Mode (Accessibility)"
 description="Enable larger fonts and high-contrast UI for easier reading"
 />
 <Toggle
 enabled={data.fbr_integration}
 onChange={v => setData('fbr_integration', v)}
 label="FBR Integration"
 description="Automatically report sales to FBR and print QR codes"
 />
 <Toggle
 enabled={data.show_margin_percentage}
 onChange={v => setData('show_margin_percentage', v)}
 label="Show Margin Percentage"
 description="Display profit margin in sales overview"
 />
 <div className="p-5 bg-app rounded-2xl border border-line dark:border-line">
 <div className="flex flex-col gap-2">
 <label className="text-sm font-bold text-ink-secondary">Round Off Invoice Totals</label>
 <p className="text-xs text-ink-muted">Choose rounding precision for sales and purchases</p>
 <div className="grid grid-cols-6 gap-1 mt-2">
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
 className={`py-2 px-1 text-center font-bold text-1xs rounded-lg border transition-all ${isActive
 ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
 : 'border-transparent bg-sunken text-ink-muted hover:bg-interactive-hover'
 }`}
 >
 {opt.label}
 </button>
 );
 })}
 </div>
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

 {/* Return Mode Configuration Card */}
 <div className="bg-surface rounded-2xl border border-line p-6">
 <SectionHeader title="Return Mode Configuration" description="Configure return settings and validation rules" />
 <div className="space-y-4">
 <div className="flex justify-between items-center py-2">
 <div>
 <label className="block text-sm font-bold text-ink-secondary">POS Return Mode</label>
 <span className="block text-xs text-ink-muted">Configure return authorization requirements</span>
 </div>
 <select
 value={data.pos_return_mode}
 onChange={(e) => {
 const val = e.target.value;
 setData('pos_return_mode', val);
 if (val !== 'open') {
 setAcknowledgeOpenReturn(false);
 }
 }}
 className="w-64 px-4 py-2.5 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
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
 Warning: Open returns cannot be linked to original sales. You are responsible for verifying returned items were genuinely purchased. The system cannot detect abuse.
 </p>
 </div>
 <label className="flex items-center gap-2 cursor-pointer select-none">
 <input
 type="checkbox"
 checked={acknowledgeOpenReturn}
 onChange={(e) => setAcknowledgeOpenReturn(e.target.checked)}
 className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-line"
 />
 <span className="text-xs font-bold text-ink-secondary">
 I understand and acknowledge this risk
 </span>
 </label>
 </div>
 )}

 {data.pos_return_mode === 'open' && (
 <div className="space-y-4 pt-4 border-t border-line">
 <div className="flex justify-between items-center py-2">
 <div>
 <label className="block text-sm font-bold text-ink-secondary">Return Window (days)</label>
 <span className="block text-xs text-ink-muted">Max days allowed since original purchase for returns</span>
 </div>
 <input
 type="number"
 min="1"
 value={data.pos_return_window}
 onChange={(e) => setData('pos_return_window', e.target.value)}
 placeholder="e.g. 7, 14, 30 — leave empty to disable"
 className="w-64 px-4 py-2.5 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
 />
 </div>

 {data.pos_return_window && (
 <div className="flex justify-between items-center py-2">
 <div>
 <span className="block text-sm font-bold text-ink-secondary">Window Behavior</span>
 <span className="block text-xs text-ink-muted">Action to take if return window has expired</span>
 </div>
 <div className="flex bg-sunken p-1 rounded-xl">
 <button
 type="button"
 onClick={() => setData('pos_return_window_behavior', 'warn')}
 className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === 'warn' ? 'bg-surface text-brand-600 dark:text-brand-400 shadow-sm' : 'text-ink-muted'}`}
 >
 Soft Warning
 </button>
 <button
 type="button"
 onClick={() => setData('pos_return_window_behavior', 'block')}
 className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${data.pos_return_window_behavior === 'block' ? 'bg-surface text-brand-600 dark:text-brand-400 shadow-sm' : 'text-ink-muted'}`}
 >
 Hard Block
 </button>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Charity Donations Toggle */}
 <div className="flex items-center justify-between py-4 border-b border-line">
 <div>
 <span className="block text-sm font-bold text-ink-secondary">Enable Charity Donations</span>
 <span className="block text-xs text-ink-muted">Show the Charity button on the POS for quick donation recording</span>
 </div>
 <button
 type="button"
 onClick={() => setData('charity_enabled', !data.charity_enabled)}
 className={`relative w-12 h-6 rounded-full transition-colors ${data.charity_enabled ? 'bg-rose-500' : 'bg-sunken'}`}
 >
 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.charity_enabled ? 'right-1' : 'left-1'}`}></div>
 </button>
 </div>
 </div>
 </div>
 </div>
 );

 case 'security':
 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
 <div className="bg-surface rounded-2xl border border-line p-6">
 <SectionHeader title="Access Control" description="Manage login security" />

 <div className="mb-6">
 <Toggle
 enabled={data.enable_passcode}
 onChange={v => setData('enable_passcode', v)}
 label="Enable Passcode Login"
 description="Allow users to log in using a 4-6 digit keypad PIN"
 />
 </div>

 {data.enable_passcode && (
 <div className="p-6 bg-sunken rounded-2xl border border-line dark:border-line animate-in fade-in slide-in-from-top-2">
 <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wider">Global Admin Passcode</label>
 <div className="relative max-w-xs">
 <input
 type="text"
 maxLength="6"
 value={data.admin_passcode}
 onChange={(e) => setData('admin_passcode', e.target.value.replace(/[^0-9]/g, ''))}
 className="w-full pl-4 pr-10 py-3 bg-surface border border-line dark:border-line rounded-xl text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-brand-500 outline-none"
 placeholder="Enter PIN"
 />
 <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted" size={16} />
 </div>
 <p className="mt-3 text-xs text-ink-muted">
 This "Master Passcode" logs you in as Hashmi Dashboard.
 <span className="block mt-1 text-brand-600 dark:text-brand-400 font-medium">Tip: Individual users can set personal passcodes in their Profile.</span>
 </p>
 </div>
 )}
 </div>

 <div className="bg-surface rounded-2xl border border-line p-6">
 <SectionHeader title="SSO / SAML Authentication" description="Configure Single Sign-On for your organization" />

 <div className="mb-6">
 <Toggle
 enabled={data.sso_enabled}
 onChange={v => setData('sso_enabled', v)}
 label="Enable SSO"
 description="Allow members to sign in securely using SAML Identity Provider"
 />
 </div>

 {data.sso_enabled && (
 <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
 <div>
 <label className="block text-sm font-bold text-ink-secondary mb-2">IdP Entity ID</label>
 <input
 type="text"
 value={data.sso_idp_entity_id}
 onChange={(e) => setData('sso_idp_entity_id', e.target.value)}
 className="w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
 placeholder="https://identity-provider.com/metadata"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-ink-secondary mb-2">Single Sign-On Service URL</label>
 <input
 type="text"
 value={data.sso_url}
 onChange={(e) => setData('sso_url', e.target.value)}
 className="w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
 placeholder="https://identity-provider.com/sso"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-ink-secondary mb-2">X.509 Public Certificate</label>
 <textarea
 value={data.sso_certificate}
 onChange={(e) => setData('sso_certificate', e.target.value)}
 className="w-full px-4 py-3 bg-sunken border border-line dark:border-line rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-500 outline-none resize-none"
 rows={5}
 placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
 />
 </div>
 </div>
 )}
 </div>
 </div>
 );

 case 'taxes':
 return (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-slow">
 <div className="bg-surface rounded-2xl border border-line p-6">
 <SectionHeader title="Custom Tax Configurator" description="Define custom tax rates and brackets for B2B invoice billing" />

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-ink-secondary mb-2 uppercase tracking-wider">Tax Rates JSON Configuration</label>
 <textarea
 value={data.tax_rates}
 onChange={(e) => setData('tax_rates', e.target.value)}
 className="w-full px-4 py-3 bg-app border border-line rounded-xl text-xs font-mono focus:ring-2 focus:ring-brand-500 outline-none"
 rows={10}
 placeholder='[{"id": 1, "name": "GST 18%", "rate": 18, "type": "percentage"}]'
 />
 <p className="mt-2 text-xs text-ink-muted">
 Enter valid JSON configuration matching the structure: <code>[{"{"}"id": unique_id, "name": "Label", "rate": percentage_number, "type": "percentage"{"}"}]</code>
 </p>
 </div>
 </div>
 </div>
 </div>
 );

 default:
 return null;
 }
 };

 return (
 <OneGlanceLayout mode="admin" title="Settings" activeMenu="Store Settings">
 <Head title="Settings" />

 <div className="h-full flex gap-6 overflow-hidden">
 {/* Sidebar - Midnight Nebula Styled - Collapsible */}
 <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl p-3 shrink-0 flex flex-col relative overflow-hidden transition-all duration-slow`}>
 {/* Nebula Background Elements */}
 <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-600/10 rounded-full blur-[40px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
 <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 pointer-events-none" />

 {/* Header with Collapse Toggle */}
 <div className={`${sidebarCollapsed ? 'px-2 py-4' : 'px-4 py-6'} border-b border-neutral-800/50 mb-3 relative z-20`}>
 <div className="flex items-center gap-3">
 <button
 type="button"
 onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
 className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center text-white shadow-lg transition-transform shrink-0"
 >
 <Settings size={20} className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
 </button>
 {!sidebarCollapsed && (
 <div className="min-w-0">
 <h2 className="text-lg font-bold text-white tracking-tight">Settings</h2>
 <p className="text-3xs font-bold uppercase tracking-[0.2em] text-brand-400">Shop Config</p>
 </div>
 )}
 </div>
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
 onClick={() => toggleCategory(category.id)}
 className="w-full flex items-center justify-between px-3 py-2 text-2xs font-bold uppercase tracking-[0.2em] text-ink-muted hover:text-brand-400 transition-colors group"
 >
 <div className="flex items-center gap-2">
 <CatIcon size={12} />
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
 onClick={() => setActiveSection(section.id)}
 title={sidebarCollapsed ? section.name : undefined}
 className={`w-full flex items-center gap-3 ${sidebarCollapsed ? 'p-2 justify-center' : 'p-3'} rounded-xl text-left transition-all duration-normal group relative overflow-hidden border ${isActive
 ? 'bg-white/10 backdrop-blur-xl border-white/20 text-white shadow-lg '
 : 'text-ink-muted hover:bg-white/5 hover:text-white border-transparent'
 }`}
 >
 {isActive && (
 <div className="absolute inset-0 bg-brand-600/20 opacity-100" />
 )}

 <div className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-normal ${isActive ? 'bg-brand-500/30 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-neutral-800 group-hover:bg-interactive-hover'}`}>
 <Icon size={16} className={isActive ? 'text-white' : 'text-ink-muted group-hover:text-brand-400'} />
 </div>

 {!sidebarCollapsed && (
 <div className="relative z-10 flex-1 min-w-0">
 <p className={`text-xs font-bold tracking-tight ${isActive ? 'text-white' : 'text-neutral-200'}`}>{section.name}</p>
 <p className={`text-3xs leading-tight ${isActive ? 'text-brand-200' : 'text-ink-muted'} line-clamp-1`}>
 {section.description}
 </p>
 </div>
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
 <div className="flex-1 bg-surface rounded-2xl border border-line shadow-2xl flex flex-col overflow-hidden relative">
 <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full -mr-48 -mt-48 blur-[100px] pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-500/5 rounded-full -ml-48 -mb-48 blur-[100px] pointer-events-none" />

 <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10">
 {/* Header */}
 <div className="p-10 border-b border-line shrink-0 bg-white/80 dark:bg-app backdrop-blur-xl">
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <span className="px-3 py-1 bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-2xs font-bold uppercase tracking-[0.2em] rounded-full">Section</span>
 <h2 className="text-3xl font-bold text-ink tracking-tight">
 {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.name}
 </h2>
 </div>
 <p className="text-base text-ink-muted font-medium">
 {SETTINGS_SECTIONS.find(s => s.id === activeSection)?.description}
 </p>
 </div>

 <button
 type="submit"
 disabled={processing || !isAdmin || (data.pos_return_mode === 'open' && !acknowledgeOpenReturn)}
 className={`relative group px-10 py-4 rounded-2xl font-bold text-sm transition-all duration-slower transform active:scale-95 overflow-hidden shadow-2xl ${(!isAdmin || (data.pos_return_mode === 'open' && !acknowledgeOpenReturn)) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
 >
 {/* Midnight Nebula Background for Button */}
 <div className="absolute inset-0 bg-neutral-900 z-0">
 <div className="absolute top-0 right-0 w-32 h-32 bg-brand-600/60 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 transition-transform duration-slower"></div>
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-600/50 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 transition-transform duration-slower"></div>
 <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20"></div>
 <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-50"></div>
 </div>

 <div className="relative z-10 flex items-center gap-3 text-white">
 {saved ? (
 <>
 <Check size={20} strokeWidth={3} className="text-emerald-400" />
 <span>Changes Saved</span>
 </>
 ) : processing ? (
 <>
 <RefreshCw size={20} className="animate-spin text-brand-300" />
 <span>Syncing...</span>
 </>
 ) : (
 <>
 <Save size={20} className="transition-transform" />
 <span>{isAdmin ? 'Save Changes' : 'Viewing Only'}</span>
 </>
 )}
 </div>
 </button>
 </div>
 </div>

 {/* Section Content */}
 <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
 <div className="max-w-4xl mx-auto">
 {renderSection()}
 </div>
 </div>
 </form>
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
 </OneGlanceLayout>
 );
}
