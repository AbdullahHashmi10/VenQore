import React from 'react';
import { Building2, Hash, Mail, Phone, MapPin, Globe, CreditCard, Clock, Layers, DollarSign, ChevronDown, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import PremiumSelect from '@/Components/PremiumSelect';

const COUNTRY_DIAL_CODES = [
    { code: '+92', country: 'Pakistan', flag: '🇵🇰', iso: 'PK' },
    { code: '+1', country: 'United States / Canada', flag: '🇺🇸', iso: 'US' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
    { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', iso: 'AE' },
    { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA' },
    { code: '+91', country: 'India', flag: '🇮🇳', iso: 'IN' },
    { code: '+880', country: 'Bangladesh', flag: '🇧🇩', iso: 'BD' },
    { code: '+61', country: 'Australia', flag: '🇦🇺', iso: 'AU' },
    { code: '+90', country: 'Turkey', flag: '🇹🇷', iso: 'TR' },
    { code: '+974', country: 'Qatar', flag: '🇶🇦', iso: 'QA' },
    { code: '+968', country: 'Oman', flag: '🇴🇲', iso: 'OM' },
    { code: '+965', country: 'Kuwait', flag: '🇰🇼', iso: 'KW' },
    { code: '+973', country: 'Bahrain', flag: '🇧🇭', iso: 'BH' },
    { code: '+60', country: 'Malaysia', flag: '🇲🇾', iso: 'MY' },
    { code: '+65', country: 'Singapore', flag: '🇸🇬', iso: 'SG' },
    { code: '+86', country: 'China', flag: '🇨🇳', iso: 'CN' },
    { code: '+49', country: 'Germany', flag: '🇩🇪', iso: 'DE' },
    { code: '+33', country: 'France', flag: '🇫🇷', iso: 'FR' },
    { code: '+39', country: 'Italy', flag: '🇮🇹', iso: 'IT' },
    { code: '+34', country: 'Spain', flag: '🇪🇸', iso: 'ES' },
];

function PhoneSplitInput({ value = '', onChange }) {
    const parse = (val) => {
        if (!val) return { dialCode: '+92', localNumber: '' };
        const clean = String(val).trim();
        const matched = COUNTRY_DIAL_CODES.find(c => clean.startsWith(c.code));
        if (matched) {
            const local = clean.slice(matched.code.length).trim();
            return { dialCode: matched.code, localNumber: local };
        }
        if (clean.startsWith('0')) {
            return { dialCode: '+92', localNumber: clean.replace(/^0+/, '') };
        }
        return { dialCode: '+92', localNumber: clean };
    };

    const parsed = React.useMemo(() => parse(value), [value]);
    const [dialCode, setDialCode] = React.useState(parsed.dialCode);
    const [localNumber, setLocalNumber] = React.useState(parsed.localNumber);
    const [isOpen, setIsOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const dropdownRef = React.useRef(null);
    const portalRef = React.useRef(null);
    const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });

    React.useEffect(() => {
        const p = parse(value);
        setDialCode(p.dialCode);
        setLocalNumber(p.localNumber);
    }, [value]);

    const updateCoords = () => {
        if (dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom, left: rect.left, width: rect.width });
        }
    };

    React.useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('scroll', updateCoords, true);
            window.addEventListener('resize', updateCoords);
        }
        return () => {
            window.removeEventListener('scroll', updateCoords, true);
            window.removeEventListener('resize', updateCoords);
        };
    }, [isOpen]);

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                portalRef.current && !portalRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDialChange = (newCode) => {
        setDialCode(newCode);
        setIsOpen(false);
        const combined = localNumber ? `${newCode} ${localNumber}` : newCode;
        onChange(combined);
    };

    const handleLocalChange = (e) => {
        const raw = e.target.value.replace(/[^\d\s-]/g, '');
        setLocalNumber(raw);
        const combined = raw ? `${dialCode} ${raw}` : '';
        onChange(combined);
    };

    const selectedCountry = COUNTRY_DIAL_CODES.find(c => c.code === dialCode) || COUNTRY_DIAL_CODES[0];

    const filtered = COUNTRY_DIAL_CODES.filter(c =>
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search) ||
        c.iso.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative flex items-center bg-app border border-line rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all text-ink shadow-xs">
            {/* Country Selector Trigger */}
            <div
                ref={dropdownRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-surface/70 hover:bg-surface border-r border-line cursor-pointer text-xs font-bold text-ink shrink-0 transition-colors select-none"
            >
                <span className="text-base leading-none">{selectedCountry.flag}</span>
                <span className="text-xs font-bold text-ink tracking-tight">{selectedCountry.code}</span>
                <ChevronDown size={14} className={`text-ink-muted transition-transform duration-slow ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Local Phone Number Input */}
            <input
                type="tel"
                value={localNumber}
                onChange={handleLocalChange}
                placeholder="300 1234567"
                className="w-full px-3.5 py-2.5 bg-transparent border-0 outline-none text-sm font-bold text-ink placeholder:text-ink-muted"
            />

            {/* Country Code Dropdown Portal */}
            {isOpen && createPortal(
                <div
                    ref={portalRef}
                    className="fixed mt-1.5 bg-surface rounded-xl shadow-2xl border border-line z-modal overflow-hidden animate-in fade-in zoom-in-95 duration-fast"
                    style={{
                        top: coords.top,
                        left: coords.left,
                        width: Math.max(coords.width + 130, 270)
                    }}
                >
                    <div className="p-2 border-b border-line bg-surface">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search country or code..."
                                className="w-full pl-8 pr-3 py-1.5 text-xs bg-app border border-line rounded-lg outline-none focus:ring-1 focus:ring-brand-500 text-ink placeholder:text-ink-muted"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-3 text-xs text-ink-muted text-center font-medium">No countries found</div>
                        ) : (
                            filtered.map((item) => {
                                const isSelected = item.code === dialCode;
                                return (
                                    <div
                                        key={`${item.code}-${item.iso}`}
                                        onClick={() => handleDialChange(item.code)}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-between mb-0.5 ${isSelected ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400' : 'text-ink hover:bg-interactive-hover'}`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="text-base shrink-0">{item.flag}</span>
                                            <span className="truncate">{item.country}</span>
                                        </div>
                                        <span className={`text-2xs font-bold ml-2 shrink-0 ${isSelected ? 'text-brand-600 dark:text-brand-400' : 'text-ink-muted'}`}>
                                            {item.code}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

const PRODUCT_COST_OPTIONS = [
    { id: 'never', name: 'Never (Keep V3 FIFO Batches Only)' },
    { id: 'always', name: 'Always (Update to Latest Purchase Price)' },
    { id: 'increase_only', name: 'On Cost Increase Only' },
    { id: 'decrease_only', name: 'On Cost Decrease Only' },
];

const CURRENCY_OPTIONS = [
    { id: 'PKR', name: 'PKR - Pakistani Rupee', symbol: 'Rs.' },
    { id: 'USD', name: 'USD - US Dollar', symbol: '$' },
    { id: 'EUR', name: 'EUR - Euro', symbol: '€' },
    { id: 'GBP', name: 'GBP - British Pound', symbol: '£' },
    { id: 'AED', name: 'AED - UAE Dirham', symbol: 'AED' },
    { id: 'SAR', name: 'SAR - Saudi Riyal', symbol: 'SAR' },
    { id: 'INR', name: 'INR - Indian Rupee', symbol: '₹' },
    { id: 'BDT', name: 'BDT - Bangladeshi Taka', symbol: '৳' },
    { id: 'CAD', name: 'CAD - Canadian Dollar', symbol: 'CA$' },
    { id: 'AUD', name: 'AUD - Australian Dollar', symbol: 'A$' },
    { id: 'TRY', name: 'TRY - Turkish Lira', symbol: '₺' },
    { id: 'QAR', name: 'QAR - Qatari Riyal', symbol: 'QR' },
    { id: 'OMR', name: 'OMR - Omani Rial', symbol: 'OMR' },
    { id: 'KWD', name: 'KWD - Kuwaiti Dinar', symbol: 'KD' },
    { id: 'BHD', name: 'BHD - Bahraini Dinar', symbol: 'BD' },
    { id: 'MYR', name: 'MYR - Malaysian Ringgit', symbol: 'RM' },
    { id: 'SGD', name: 'SGD - Singapore Dollar', symbol: 'S$' },
    { id: 'CNY', name: 'CNY - Chinese Yuan', symbol: '¥' },
    { id: 'JPY', name: 'JPY - Japanese Yen', symbol: '¥' },
];

const CURRENCY_SYMBOL_OPTIONS = [
    { id: 'Rs.', name: 'Rs. — Pakistani / Regional Rupee' },
    { id: '$', name: '$ — US / International Dollar' },
    { id: '€', name: '€ — Euro' },
    { id: '£', name: '£ — British Pound' },
    { id: 'AED', name: 'AED / DH — UAE Dirham' },
    { id: 'SAR', name: 'SAR / SR — Saudi Riyal' },
    { id: '₹', name: '₹ — Indian Rupee' },
    { id: '৳', name: '৳ — Bangladeshi Taka' },
    { id: 'CA$', name: 'CA$ — Canadian Dollar' },
    { id: 'A$', name: 'A$ — Australian Dollar' },
    { id: '₺', name: '₺ — Turkish Lira' },
    { id: 'QR', name: 'QR — Qatari Riyal' },
    { id: 'OMR', name: 'OMR — Omani Rial' },
    { id: 'KD', name: 'KD — Kuwaiti Dinar' },
    { id: 'BD', name: 'BD — Bahraini Dinar' },
    { id: 'RM', name: 'RM — Malaysian Ringgit' },
    { id: 'S$', name: 'S$ — Singapore Dollar' },
    { id: '¥', name: '¥ — Japanese Yen / Chinese Yuan' },
];

const TIMEZONE_OPTIONS = [
    { id: 'Asia/Karachi', name: 'Asia/Karachi (PKT +05:00)' },
    { id: 'Asia/Dubai', name: 'Asia/Dubai (GST +04:00)' },
    { id: 'Asia/Riyadh', name: 'Asia/Riyadh (AST +03:00)' },
    { id: 'Asia/Kolkata', name: 'Asia/Kolkata (IST +05:30)' },
    { id: 'Asia/Dhaka', name: 'Asia/Dhaka (BST +06:00)' },
    { id: 'Europe/London', name: 'Europe/London (GMT/BST)' },
    { id: 'America/New_York', name: 'America/New_York (EST/EDT)' },
    { id: 'America/Chicago', name: 'America/Chicago (CST/CDT)' },
    { id: 'America/Denver', name: 'America/Denver (MST/MDT)' },
    { id: 'America/Los_Angeles', name: 'America/Los_Angeles (PST/PDT)' },
    { id: 'America/Toronto', name: 'America/Toronto (EST/EDT)' },
    { id: 'Australia/Sydney', name: 'Australia/Sydney (AEST)' },
    { id: 'Asia/Singapore', name: 'Asia/Singapore (SGT +08:00)' },
    { id: 'Asia/Tokyo', name: 'Asia/Tokyo (JST +09:00)' },
    { id: 'UTC', name: 'Universal Time (UTC +00:00)' },
];

export default function BusinessSettingsSection({ data, setData }) {
    // If currency symbol is custom (not in standard options), include it dynamically
    const symbolOptions = React.useMemo(() => {
        const curSym = data.currency_symbol || '';
        const exists = CURRENCY_SYMBOL_OPTIONS.some(o => o.id === curSym);
        if (curSym && !exists) {
            return [{ id: curSym, name: `${curSym} — Custom Symbol` }, ...CURRENCY_SYMBOL_OPTIONS];
        }
        return CURRENCY_SYMBOL_OPTIONS;
    }, [data.currency_symbol]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-slow">
            {/* High Density Dashboard Grid */}
            <div className="grid grid-cols-12 gap-6">

                {/* Row 1: Core Identity (Takes full top row for ease of access) */}
                <div className="col-span-12 xl:col-span-8 p-6 bg-surface rounded-2xl border border-line shadow-xs">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-600 dark:text-brand-400">
                            <Building2 size={18} />
                        </div>
                        <h3 className="font-bold text-ink text-base">Business Identity</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5 group/input">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted ml-1">Business Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.business_name || ''}
                                    onChange={(e) => setData('business_name', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-app border border-line rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-ink"
                                    placeholder="e.g. Acme Corp"
                                />
                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-1.5 group/input">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted ml-1">Tax / NTN</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.tax_number || ''}
                                    onChange={(e) => setData('tax_number', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-app border border-line rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-ink"
                                    placeholder="Tax ID"
                                />
                                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-1.5 group/input">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted ml-1">Official Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={data.business_email || ''}
                                    onChange={(e) => setData('business_email', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-app border border-line rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-ink"
                                    placeholder="email@company.com"
                                />
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-1.5 group/input">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted ml-1">Phone Line</label>
                            <PhoneSplitInput
                                value={data.business_phone || ''}
                                onChange={(val) => setData('business_phone', val)}
                            />
                        </div>
                        <div className="space-y-1.5 group/input opacity-75">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Custom Domain Mapping</label>
                                <span className="px-2 py-0.2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-4xs font-bold uppercase tracking-wider rounded border border-amber-200 dark:border-amber-500/30">Coming Soon</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.custom_domain || ''}
                                    disabled
                                    readOnly
                                    className="w-full pl-10 pr-4 py-2.5 bg-app/80 border border-line rounded-xl text-sm font-bold text-ink-muted cursor-not-allowed outline-none select-none"
                                    placeholder="e.g. store.mydomain.com"
                                />
                                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" size={16} />
                            </div>
                            <p className="text-3xs text-ink-muted ml-1">Automated custom domain routing and SSL certificate provisioning are currently in development.</p>
                        </div>
                        <div className="space-y-1.5 group/input">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted ml-1">Auto-Update Product Cost</label>
                            <PremiumSelect
                                options={PRODUCT_COST_OPTIONS}
                                value={data.product_cost_update_policy || 'never'}
                                onChange={(val) => setData('product_cost_update_policy', val)}
                                icon={Layers}
                                searchable={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Regional Settings (Compact Side Panel) */}
                <div className="col-span-12 xl:col-span-4 p-6 bg-surface text-ink rounded-2xl border border-line shadow-xs relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-brand-50 dark:bg-brand-900/20 rounded-xl text-brand-600 dark:text-brand-400">
                                <Globe size={18} />
                            </div>
                            <h3 className="font-bold text-ink text-base">Regional Settings</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted ml-1">Currency</label>
                                <PremiumSelect
                                    options={CURRENCY_OPTIONS}
                                    value={data.currency || 'PKR'}
                                    onChange={(newCurr) => {
                                        const matched = CURRENCY_OPTIONS.find(c => c.id === newCurr);
                                        setData({
                                            ...data,
                                            currency: newCurr,
                                            currency_symbol: matched?.symbol || data.currency_symbol || 'Rs.',
                                        });
                                    }}
                                    icon={CreditCard}
                                    searchable={true}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted ml-1">Currency Symbol</label>
                                <PremiumSelect
                                    options={symbolOptions}
                                    value={data.currency_symbol || 'Rs.'}
                                    onChange={(sym) => setData('currency_symbol', sym)}
                                    icon={DollarSign}
                                    searchable={true}
                                    addNewLabel="Set custom symbol"
                                    onAddNew={() => {
                                        const customSym = window.prompt('Enter custom currency symbol:', data.currency_symbol || '');
                                        if (customSym && customSym.trim()) {
                                            setData('currency_symbol', customSym.trim());
                                        }
                                    }}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted ml-1">Timezone</label>
                                <PremiumSelect
                                    options={TIMEZONE_OPTIONS}
                                    value={data.timezone || 'Asia/Karachi'}
                                    onChange={(tz) => setData('timezone', tz)}
                                    icon={Clock}
                                    searchable={true}
                                />
                                <p className="text-3xs text-ink-muted mt-1 ml-1">
                                    Determines date rollovers for reports &amp; analytics.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Address (Full width of remaining space) */}
                <div className="col-span-12 p-6 bg-surface rounded-2xl border border-line shadow-xs relative group hover:border-brand-500/30 transition-all">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                            <MapPin size={18} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-2xs font-bold uppercase tracking-wider text-ink-muted">Head Office Address</label>
                            <textarea
                                value={data.business_address || ''}
                                onChange={(e) => setData('business_address', e.target.value)}
                                className="w-full p-4 bg-app border border-line rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all min-h-[80px] resize-none text-ink"
                                placeholder="Complete address for invoices and footer..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
