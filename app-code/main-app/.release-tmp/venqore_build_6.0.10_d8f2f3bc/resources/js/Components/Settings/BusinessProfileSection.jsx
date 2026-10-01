import React from 'react';
import { Building2, Mail, MapPin, Hash, Globe, Layers, Check, ExternalLink, Phone } from 'lucide-react';
import PhoneSplitInput from '@/Components/PhoneSplitInput';
import PremiumSelect from '@/Components/PremiumSelect';

const COST_POLICY_OPTIONS = [
    { value: 'always', label: 'Always Update (Replace Cost with Latest Purchase)' },
    { value: 'never', label: 'Never Update (Keep Historical Cost Price Fixed)' },
    { value: 'increase_only', label: 'Increase Only (Update Only If New Cost is Higher)' },
    { value: 'decrease_only', label: 'Decrease Only (Update Only If New Cost is Lower)' },
];

export default function BusinessProfileSection({ data, setData }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            {/* Core Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Company Identity */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Business details</h3>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Building2 size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Business name</span>
                        </label>
                        <input
                            type="text"
                            value={data.business_name || ''}
                            onChange={(e) => {
                                setData('business_name', e.target.value);
                                setData('store_name', e.target.value);
                            }}
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="e.g. VenQore Retail Corp"
                        />
                        <p className="text-3xs text-ink-muted">Printed at the top of receipts, tax invoices, and B2B orders.</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Hash size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Tax registration number</span>
                        </label>
                        <input
                            type="text"
                            value={data.tax_number || ''}
                            onChange={(e) => setData('tax_number', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="e.g. 1234567-8 or PK-STRN-9988"
                        />
                        <p className="text-3xs text-ink-muted">Enter the number required on your tax invoices, if your business has one.</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Layers size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>When a purchase changes an item's cost</span>
                        </label>
                        <PremiumSelect
                            options={COST_POLICY_OPTIONS}
                            value={data.product_cost_update_policy || 'always'}
                            onChange={(val) => setData('product_cost_update_policy', val)}
                            searchable={false}
                            placeholder="Select cost update policy"
                        />
                        <p className="text-3xs text-ink-muted">Choose whether a new purchase updates the cost price saved for an item.</p>
                    </div>
                </div>

                {/* Right Card: Contact & Location */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Contact &amp; Location</h3>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Phone size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Official Store Phone</span>
                        </label>
                        <PhoneSplitInput
                            value={data.business_phone || data.store_phone || ''}
                            onChange={(val) => {
                                setData('business_phone', val);
                                setData('store_phone', val);
                            }}
                        />
                        <p className="text-3xs text-ink-muted">Select dial code and enter local phone number for receipts and support.</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Mail size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Business Email Address</span>
                        </label>
                        <input
                            type="email"
                            value={data.business_email || ''}
                            onChange={(e) => setData('business_email', e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none"
                            placeholder="billing@yourbrand.com"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <MapPin size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Store Address &amp; Outlet Location</span>
                        </label>
                        <textarea
                            rows={3}
                            value={data.business_address || data.store_address || ''}
                            onChange={(e) => {
                                setData('business_address', e.target.value);
                                setData('store_address', e.target.value);
                            }}
                            className="w-full px-3.5 py-2.5 bg-app border border-line rounded-xl text-sm font-bold text-ink focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                            placeholder="Plot #42, Main Commercial Avenue, Phase 5"
                        />
                    </div>
                </div>
            </div>

            {/* Custom Domain Card - Coming Soon */}
            <div className="p-6 bg-surface rounded-2xl border border-line shadow-xs space-y-4 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                    <div className="flex items-center gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Globe size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-ink">Use your own website address</h3>
                                <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-3xs font-bold uppercase tracking-wider rounded-full border border-amber-300/40 dark:border-amber-500/30">
                                    Coming Soon
                                </span>
                            </div>
                            <p className="text-xs text-ink-muted">Route your own branded web address (e.g. pos.amdoutlets.com) to this store</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="md:col-span-2 space-y-1.5 opacity-75">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between">
                            <span>Website address</span>
                            <span className="text-3xs text-amber-600 dark:text-amber-400 font-medium">In Development</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.custom_domain || ''}
                                disabled
                                readOnly
                                placeholder="pos.amdoutlets.com"
                                className="w-full pl-9 pr-4 py-2.5 bg-app/80 border border-line rounded-xl text-sm font-bold text-ink-muted cursor-not-allowed select-none outline-none"
                            />
                            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                        </div>
                        <p className="text-3xs text-ink-muted">
                            This feature is still being built. You cannot connect a website address yet.
                        </p>
                    </div>

                    <div className="p-3.5 bg-app rounded-xl border border-line text-2xs text-ink-muted flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 text-ink font-bold mb-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>When this feature is available:</span>
                        </div>
                        <p className="leading-relaxed">
                            Your website provider will need to connect your address to VenQore. We will provide the instructions here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
