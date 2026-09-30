import React from 'react';
import { Globe, DollarSign, Clock, Calendar, Hash, Check } from 'lucide-react';
import PremiumSelect from '@/Components/PremiumSelect';

const CURRENCY_OPTIONS = [
    { value: 'PKR', label: 'PKR — Pakistani Rupee (Rs.)', symbol: 'Rs.', code: 'PKR' },
    { value: 'USD', label: 'USD — US Dollar ($)', symbol: '$', code: 'USD' },
    { value: 'GBP', label: 'GBP — British Pound (£)', symbol: '£', code: 'GBP' },
    { value: 'EUR', label: 'EUR — Euro (€)', symbol: '€', code: 'EUR' },
    { value: 'AED', label: 'AED — UAE Dirham (AED)', symbol: 'AED', code: 'AED' },
    { value: 'SAR', label: 'SAR — Saudi Riyal (SAR)', symbol: 'SAR', code: 'SAR' },
    { value: 'CAD', label: 'CAD — Canadian Dollar (C$)', symbol: 'C$', code: 'CAD' },
    { value: 'AUD', label: 'AUD — Australian Dollar (A$)', symbol: 'A$', code: 'AUD' },
    { value: 'INR', label: 'INR — Indian Rupee (₹)', symbol: '₹', code: 'INR' },
    { value: 'BDT', label: 'BDT — Bangladeshi Taka (৳)', symbol: '৳', code: 'BDT' },
    { value: 'TRY', label: 'TRY — Turkish Lira (₺)', symbol: '₺', code: 'TRY' },
    { value: 'QAR', label: 'QAR — Qatari Riyal (QAR)', symbol: 'QAR', code: 'QAR' },
    { value: 'OMR', label: 'OMR — Omani Rial (OMR)', symbol: 'OMR', code: 'OMR' },
    { value: 'KWD', label: 'KWD — Kuwaiti Dinar (KWD)', symbol: 'KWD', code: 'KWD' },
    { value: 'BHD', label: 'BHD — Bahraini Dinar (BHD)', symbol: 'BHD', code: 'BHD' },
    { value: 'MYR', label: 'MYR — Malaysian Ringgit (RM)', symbol: 'RM', code: 'MYR' },
    { value: 'SGD', label: 'SGD — Singapore Dollar (S$)', symbol: 'S$', code: 'SGD' },
];

const CURRENCY_SYMBOL_OPTIONS = [
    { value: 'Rs.', label: 'Rs. (Standard Rupee)' },
    { value: 'PKR', label: 'PKR (ISO Currency Code)' },
    { value: '$', label: '$ (Dollar)' },
    { value: '£', label: '£ (Pound)' },
    { value: '€', label: '€ (Euro)' },
    { value: 'AED', label: 'AED (Dirham)' },
    { value: 'SAR', label: 'SAR (Riyal)' },
    { value: '₹', label: '₹ (INR Symbol)' },
    { value: '৳', label: '৳ (Taka)' },
];

const TIMEZONE_OPTIONS = [
    { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT +05:00)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +04:00)' },
    { value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST +03:00)' },
    { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
    { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
    { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
    { value: 'Asia/Dhaka', label: 'Asia/Dhaka (BST +06:00)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +05:30)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT +08:00)' },
    { value: 'Asia/Kuala_Lumpur', label: 'Asia/Kuala_Lumpur (MYT +08:00)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST +10:00)' },
];

const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'es', label: 'Spanish (Español)' },
    { value: 'fr', label: 'French (Français)' },
    { value: 'ur', label: 'Urdu (اردو)' }
];

const DATE_FORMAT_OPTIONS = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2026)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2026)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-12-31)' },
    { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (31-Dec-2026)' }
];

export default function RegionNumbersSection({ data, setData }) {
    const decimalPlaces = parseInt(data.decimal_places ?? 2, 10);
    const currSym = data.currency_symbol || (CURRENCY_OPTIONS.find(c => c.value === data.currency)?.symbol || 'Rs.');

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Currency & Timezone */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Financial Currency &amp; Timezone</h3>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <DollarSign size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Operating Currency (ISO Code)</span>
                        </label>
                        <PremiumSelect
                            options={CURRENCY_OPTIONS}
                            value={data.currency || 'PKR'}
                            onChange={(val) => {
                                setData('currency', val);
                                const found = CURRENCY_OPTIONS.find(c => c.value === val);
                                if (found) {
                                    setData('currency_symbol', found.symbol);
                                }
                            }}
                            searchable={true}
                            placeholder="Select Currency"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Hash size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Displayed Currency Symbol</span>
                        </label>
                        <PremiumSelect
                            options={CURRENCY_SYMBOL_OPTIONS}
                            value={data.currency_symbol || 'Rs.'}
                            onChange={(val) => setData('currency_symbol', val)}
                            searchable={false}
                            placeholder="Select Symbol"
                        />
                        <p className="text-3xs text-ink-muted">Symbol placed next to prices across sales screens and printouts.</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Clock size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Store Timezone</span>
                        </label>
                        <PremiumSelect
                            options={TIMEZONE_OPTIONS}
                            value={data.timezone || 'Asia/Karachi'}
                            onChange={(val) => setData('timezone', val)}
                            searchable={true}
                            placeholder="Select Timezone"
                        />
                        <p className="text-3xs text-ink-muted">Timestamps for shift registers, invoices, and sales history.</p>
                    </div>
                </div>

                {/* Right Card: Localization & Global Decimals */}
                <div className="bg-surface rounded-2xl border border-line p-6 shadow-xs space-y-4">
                    <h3 className="text-sm font-bold text-ink border-b border-line pb-3">Language &amp; Global Decimal Precision</h3>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Globe size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>System Language</span>
                        </label>
                        <PremiumSelect
                            options={LANGUAGE_OPTIONS}
                            value={data.language || 'en'}
                            onChange={(val) => setData('language', val)}
                            searchable={false}
                            placeholder="Select Language"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                            <Calendar size={13} className="text-brand-600 dark:text-brand-400" />
                            <span>Date Display Format</span>
                        </label>
                        <PremiumSelect
                            options={DATE_FORMAT_OPTIONS}
                            value={data.date_format || 'DD/MM/YYYY'}
                            onChange={(val) => setData('date_format', val)}
                            searchable={false}
                            placeholder="Select Date Format"
                        />
                    </div>

                    {/* Global Money Decimal Places */}
                    <div className="space-y-2.5 pt-3 border-t border-line">
                        <div className="flex justify-between items-center">
                            <div>
                                <label className="text-sm font-bold text-ink block">Global Decimal Places</label>
                                <span className="text-xs text-ink-muted">Applies to item prices, totals, ledger calculations</span>
                            </div>
                            <span className="text-xs font-mono font-bold bg-sunken border border-line px-2.5 py-1 rounded-lg text-ink-secondary">
                                {currSym} 1,234.{'0'.repeat(Math.max(0, Math.min(4, decimalPlaces)))}
                            </span>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5 bg-app p-1.5 rounded-xl border border-line">
                            {[0, 1, 2, 3, 4].map((num) => {
                                const isActive = decimalPlaces === num;
                                return (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setData('decimal_places', num)}
                                        className={`py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center ${
                                            isActive
                                                ? 'bg-brand-600 text-white shadow-xs'
                                                : 'text-ink-muted hover:text-ink hover:bg-surface'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-3xs text-ink-muted">
                            Note: Printed receipts have a separate amount format control under <strong>Printing &gt; Document Layouts</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
