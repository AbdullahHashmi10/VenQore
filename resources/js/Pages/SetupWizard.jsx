import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    Store,
    ShoppingBag,
    Coffee,
    Smartphone,
    Wrench,
    Briefcase,
    CheckCircle,
    ArrowRight,
    Loader2,
    Building2,
    Zap,
    MapPin,
    Phone,
    Mail,
    Palette,
    ChevronDown,
    Upload
} from 'lucide-react';

export default function SetupWizard({ industries, userEmail, initialStoreName, store_slug, store_logo }) {
    const [step, setStep] = useState(1);
    const { data, setData, post, processing, errors } = useForm({
        business_name: initialStoreName || '',
        email: userEmail || '',
        phone: '',
        address: '',
        currency_symbol: 'Rs',
        currency_code: 'PKR',
        dial_code: '+92',
        country_iso: 'PK',
        timezone: 'Asia/Karachi',
        industry_group: '',
        industry_key: '',
        logo_style: 'minimal',
        logo_type: 'preset', // 'preset' or 'upload'
        logo_file: null,
        logo_preview: null,
    });

    const countries = [
        { code: 'PK', name: 'Pakistan', dial_code: '+92', currency_code: 'PKR', currency_symbol: 'Rs', flag: '🇵🇰', timezone: 'Asia/Karachi' },
        { code: 'US', name: 'United States', dial_code: '+1', currency_code: 'USD', currency_symbol: '$', flag: '🇺🇸', timezone: 'America/New_York' },
        { code: 'GB', name: 'United Kingdom', dial_code: '+44', currency_code: 'GBP', currency_symbol: '£', flag: '🇬🇧', timezone: 'Europe/London' },
        { code: 'AE', name: 'UAE', dial_code: '+971', currency_code: 'AED', currency_symbol: 'AED', flag: '🇦🇪', timezone: 'Asia/Dubai' },
        { code: 'SA', name: 'Saudi Arabia', dial_code: '+966', currency_code: 'SAR', currency_symbol: 'SAR', flag: '🇸🇦', timezone: 'Asia/Riyadh' },
        { code: 'IN', name: 'India', dial_code: '+91', currency_code: 'INR', currency_symbol: '₹', flag: '🇮🇳', timezone: 'Asia/Kolkata' },
        { code: 'CA', name: 'Canada', dial_code: '+1', currency_code: 'CAD', currency_symbol: '$', flag: '🇨🇦', timezone: 'America/Toronto' },
        { code: 'AU', name: 'Australia', dial_code: '+61', currency_code: 'AUD', currency_symbol: '$', flag: '🇦🇺', timezone: 'Australia/Sydney' },
        { code: 'DE', name: 'Germany', dial_code: '+49', currency_code: 'EUR', currency_symbol: '€', flag: '🇩🇪', timezone: 'Europe/Berlin' },
    ];

    const currencies = countries.map(c => ({
        code: c.currency_code,
        symbol: c.currency_symbol,
        name: c.name
    }));

    const handleCurrencySelect = (currency) => {
        setData(prev => ({
            ...prev,
            currency_code: currency.code,
            currency_symbol: currency.symbol
        }));
    };

    const handleIndustrySelect = (groupKey, typeKey) => {
        setData(prev => ({
            ...prev,
            industry_group: groupKey,
            industry_key: typeKey
        }));
        // Auto advance to branding step
        setStep(3);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Submitting setup data...", data); // Debug log
        post(route('store.setup.complete', { store_slug }), {
            forceFormData: true,
            onError: (err) => {
                console.error("Setup failed with errors:", err);
                alert("Please correct the errors before proceeding.\n" + Object.values(err).join("\n"));
            }
        });
    };

    // Icons map based on industry config keys (fallback logic)
    const getIcon = (iconName) => {
        const icons = {
            Store, ShoppingBag, Coffee, Smartphone, Wrench, Briefcase, Building2
        };
        return icons[iconName] || Store;
    };

    // Derived icon for branding step (based on selected industry group or default)
    const SelectedIndustryIcon = data.industry_group
        ? getIcon(industries[data.industry_group]?.icon)
        : Store;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden nebula-scrollbar">
            <Head title="Welcome Setup" />

            {/* Background Decoration (Midnight Nebula) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-[20%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[80px]"></div>
            </div>

            <div className="w-full max-w-5xl z-10">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-6">
                        <img src={store_logo || "/images/logo.png"} alt="VenQore" className="w-20 h-20 object-contain drop-shadow-2xl" />
                    </div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Welcome to VENQORE</h1>
                    <p className="text-slate-400 text-lg">Let's tailor the experience for your business.</p>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-4 mb-10">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-12 bg-indigo-500 shadow-glow' : 'w-4 bg-slate-800'}`}></div>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative min-h-[600px] flex flex-col">

                    {/* STEP 1: BUSINESS PROFILE */}
                    {step === 1 && (
                        <div className="flex-1 p-8 md:p-12 animate-in fade-in slide-in-from-right-8 duration-500">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold border border-indigo-500/30">1</span>
                                Business Profile
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Business Name <span className="text-red-400">*</span></label>
                                        <input
                                            type="text"
                                            value={data.business_name}
                                            onChange={e => setData('business_name', e.target.value)}
                                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-600 text-white transition-all hover:bg-slate-800"
                                            placeholder="e.g. My Super Store"
                                            autoFocus
                                        />
                                        {errors.business_name && <p className="text-red-400 text-sm mt-2">{errors.business_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Official Email <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={e => setData('email', e.target.value)}
                                                className="w-full pl-11 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-600 text-white transition-all hover:bg-slate-800"
                                                placeholder="contact@business.com"
                                            />
                                        </div>
                                        {errors.email && <p className="text-red-400 text-sm mt-2">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Phone Number <span className="text-red-400">*</span></label>
                                        <div className="flex gap-2">
                                            {/* Country Code Selector */}
                                            <div className="relative w-1/3 min-w-[120px]">
                                                <select
                                                    value={countries.find(c => c.dial_code === data.dial_code && c.code === (data.country_iso || 'PK'))?.code || 'PK'}
                                                    onChange={e => {
                                                        const country = countries.find(c => c.code === e.target.value);
                                                        if (country) {
                                                            setData(prev => ({
                                                                ...prev,
                                                                dial_code: country.dial_code,
                                                                country_iso: country.code,
                                                                currency_code: country.currency_code,
                                                                currency_symbol: country.currency_symbol,
                                                                timezone: country.timezone
                                                            }));
                                                        }
                                                    }}
                                                    className="w-full h-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-3 pr-8 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-white transition-all hover:bg-slate-800 appearance-none cursor-pointer"
                                                >
                                                    {countries.map(country => (
                                                        <option key={country.code} value={country.code}>
                                                            {country.flag} {country.dial_code}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" size={16} />
                                            </div>

                                            {/* Phone Input */}
                                            <div className="relative flex-1">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                                <input
                                                    type="tel"
                                                    value={data.phone}
                                                    onChange={e => setData('phone', e.target.value)}
                                                    className="w-full pl-11 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-600 text-white transition-all hover:bg-slate-800"
                                                    placeholder="300 1234567"
                                                />
                                            </div>
                                        </div>
                                        {errors.phone && <p className="text-red-400 text-sm mt-2">{errors.phone}</p>}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Address <span className="text-red-400">*</span></label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-4 text-slate-500" size={18} />
                                            <textarea
                                                value={data.address}
                                                onChange={e => setData('address', e.target.value)}
                                                rows={3}
                                                className="w-full pl-11 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-600 text-white transition-all hover:bg-slate-800 resize-none"
                                                placeholder="Shop #1, Main Market..."
                                            />
                                        </div>
                                        {errors.address && <p className="text-red-400 text-sm mt-2">{errors.address}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-4 uppercase tracking-wide">Trading Currency</label>
                                        <div className="flex flex-wrap gap-3">
                                            {currencies.map(curr => (
                                                <button
                                                    key={curr.code}
                                                    type="button"
                                                    onClick={() => handleCurrencySelect(curr)}
                                                    className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${data.currency_code === curr.code ? 'border-indigo-500 bg-indigo-500/20 text-white ring-1 ring-indigo-500' : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:border-slate-600'}`}
                                                >
                                                    <span className="mr-1 opacity-50">{curr.symbol}</span>
                                                    {curr.code}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-10 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (data.business_name && data.email && data.phone && data.address) {
                                            setStep(2);
                                        } else {
                                            // simple html5 validation trigger would be better but direct alert for now or let required fields show default browser behavior if form submitted (but we are navigating steps)
                                            // Using manual check
                                            if (!data.business_name) setData('business_name', data.business_name); // Trigger re-render/touch?
                                            // Ideally use proper validation library or inertia errors
                                        }
                                    }}
                                    disabled={!data.business_name || !data.email || !data.phone || !data.address}
                                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-white/10"
                                >
                                    Choose Industry <ArrowRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: INDUSTRY SELECTION */}
                    {step === 2 && (
                        <div className="flex-1 p-8 md:p-12 animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col">
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-white">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold border border-indigo-500/30">2</span>
                                Select Industry
                            </h2>
                            <p className="text-slate-400 mb-8 pl-11">We'll optimize the system for your specific business type.</p>

                            <div className="flex-1 overflow-y-auto pr-2 nebula-scrollbar max-h-[400px]">
                                <div className="space-y-8">
                                    {Object.entries(industries).map(([groupKey, group]) => {
                                        const GroupIcon = getIcon(group.icon);
                                        return (
                                            <div key={groupKey}>
                                                <h3 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2 opacity-80 pl-1">
                                                    <GroupIcon size={14} /> {group.name}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {Object.entries(group.types).map(([typeKey, typeData]) => (
                                                        <button
                                                            key={typeKey}
                                                            type="button"
                                                            onClick={() => handleIndustrySelect(groupKey, typeKey)}
                                                            className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden group hover:scale-[1.02] ${data.industry_key === typeKey ? 'border-emerald-500 bg-emerald-500/10 shadow-lg ring-1 ring-emerald-500/50' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'}`}
                                                        >
                                                            <div className="font-bold text-white mb-1 relative z-10">{typeData.type}</div>

                                                            {/* Selection Check */}
                                                            {data.industry_key === typeKey && (
                                                                <div className="absolute top-3 right-3 text-emerald-400">
                                                                    <CheckCircle size={20} className="fill-emerald-500/20" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="px-6 py-3 text-slate-400 font-bold hover:text-white rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                {/* Auto advances on selection now, but keep button just in case or for visual balacne */}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: BRANDING */}
                    {step === 3 && (
                        <div className="flex-1 p-8 md:p-12 animate-in fade-in slide-in-from-right-8 duration-500 flex flex-col">
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-white">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold border border-indigo-500/30">3</span>
                                Brand Identity
                            </h2>
                            <p className="text-slate-400 mb-8 pl-11">Choose a visual style or upload your own logo.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                                {/* Preview Card */}
                                <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>

                                    <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                                        {/* Dynamic Logo Preview */}
                                        <div className="transition-all duration-300">
                                            {data.logo_type === 'upload' && data.logo_preview ? (
                                                <img src={data.logo_preview} alt="Logo" className="w-16 h-16 object-contain" />
                                            ) : (
                                                <>
                                                    {(data.logo_style === 'minimal' || data.logo_type === 'upload') && !data.logo_preview && (
                                                        <div className="w-16 h-16 flex items-center justify-center text-indigo-400">
                                                            <SelectedIndustryIcon size={48} strokeWidth={1.5} />
                                                        </div>
                                                    )}
                                                    {data.logo_style === 'framed' && data.logo_type !== 'upload' && (
                                                        <div className="w-16 h-16 rounded-full border-2 border-indigo-500 flex items-center justify-center text-indigo-400 bg-indigo-500/10">
                                                            <SelectedIndustryIcon size={32} />
                                                        </div>
                                                    )}
                                                    {data.logo_style === 'modern' && data.logo_type !== 'upload' && (
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                                            <SelectedIndustryIcon size={32} />
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl text-white">{data.business_name || 'Business Name'}</h3>
                                            <p className="text-xs text-slate-500">{data.address || '123 Main St, City'}</p>
                                            <p className="text-xs text-slate-500">{data.phone || '+123 456 7890'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 opacity-50 pointer-events-none select-none">
                                        <div className="h-4 w-1/3 bg-slate-700/50 rounded"></div>
                                        <div className="h-20 w-full bg-slate-700/30 rounded-lg border border-white/5"></div>
                                        <div className="h-20 w-full bg-slate-700/30 rounded-lg border border-white/5"></div>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-6">

                                    {/* Upload Option */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-400 mb-4 uppercase tracking-wide">Custom Logo</label>
                                        <div
                                            onClick={() => document.getElementById('logo-upload').click()}
                                            className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${data.logo_type === 'upload' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}
                                        >
                                            <Upload className="mb-2 text-slate-400" size={24} />
                                            <span className="text-sm font-bold text-white">Upload Photo</span>
                                            <span className="text-xs text-slate-500 mt-1">Max 1100x1100px. Will be resized for display.</span>
                                            <input
                                                id="logo-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const img = new Image();
                                                        img.onload = function () {
                                                            if (this.width > 1100 || this.height > 1100) {
                                                                alert("Image dimensions ( " + this.width + "x" + this.height + " ) are too large. Please upload an image smaller than 1100x1100 pixels.");
                                                                e.target.value = ''; // Reset
                                                            } else {
                                                                setData(prev => ({
                                                                    ...prev,
                                                                    logo_type: 'upload',
                                                                    logo_file: file,
                                                                    logo_preview: URL.createObjectURL(file)
                                                                }));
                                                            }
                                                        };
                                                        img.src = URL.createObjectURL(file);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or Choose Style</span></div>
                                    </div>

                                    {/* Presets */}
                                    <div className="space-y-3">
                                        <button onClick={() => setData(d => ({ ...d, logo_type: 'preset', logo_style: 'minimal' }))} className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${data.logo_type === 'preset' && data.logo_style === 'minimal' ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800'}`}>
                                            <div className="w-8 h-8 flex items-center justify-center text-indigo-400"><SelectedIndustryIcon size={20} /></div>
                                            <div className="text-left"><div className="font-bold text-white text-sm">Minimalist</div></div>
                                        </button>

                                        <button onClick={() => setData(d => ({ ...d, logo_type: 'preset', logo_style: 'framed' }))} className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${data.logo_type === 'preset' && data.logo_style === 'framed' ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800'}`}>
                                            <div className="w-8 h-8 rounded-full border border-indigo-500 flex items-center justify-center text-indigo-400 bg-indigo-500/10"><SelectedIndustryIcon size={16} /></div>
                                            <div className="text-left"><div className="font-bold text-white text-sm">Framed</div></div>
                                        </button>

                                        <button onClick={() => setData(d => ({ ...d, logo_type: 'preset', logo_style: 'modern' }))} className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all ${data.logo_type === 'preset' && data.logo_style === 'modern' ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800'}`}>
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white"><SelectedIndustryIcon size={16} /></div>
                                            <div className="text-left"><div className="font-bold text-white text-sm">Modern Gradient</div></div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="px-6 py-3 text-slate-400 font-bold hover:text-white rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <div className="flex flex-col items-end gap-2">
                                    {Object.keys(errors).length > 0 && (
                                        <div className="text-red-400 text-sm font-bold animate-pulse">
                                            ⚠️ Check previous steps for errors
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleSubmit({ preventDefault: () => { } })}
                                        disabled={processing}
                                        className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : <><RocketIcon size={20} /> Launch System</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROCESSING STATE OVERLAY */}
                    {processing && (
                        <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-300">
                            <div className="relative mb-6">
                                <div className="w-20 h-20 border-4 border-slate-700 rounded-full"></div>
                                <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <Zap className="text-indigo-500 fill-current" size={24} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-white mb-2">Setting up your {data.business_name}...</h3>
                            <p className="text-slate-400">Applying industry configurations for <strong>{industries[data.industry_group]?.types[data.industry_key]?.type}</strong>...</p>

                            <div className="mt-8 space-y-2 text-sm text-slate-500">
                                <div className="flex items-center gap-2 animate-pulse delay-75"><CheckCircle size={14} className="text-emerald-500" /> Creating Categories...</div>
                                <div className="flex items-center gap-2 animate-pulse delay-150"><CheckCircle size={14} className="text-emerald-500" /> Configuring Units...</div>
                                <div className="flex items-center gap-2 animate-pulse delay-300"><CheckCircle size={14} className="text-emerald-500" /> Saving Brand Identity...</div>
                            </div>
                        </div>
                    )}

                </form>
                {/* Footer / Copyright */}
                <div className="text-center mt-8 text-slate-600 text-sm">
                    &copy; 2026 VENQORE System. All rights reserved.
                </div>
            </div>

            <style>{`
                .clip-hexagon {
                    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                }
            `}</style>
        </div>
    );
}

// Simple Rocket Icon Component
const RocketIcon = ({ size = 24, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
    </svg>
);
