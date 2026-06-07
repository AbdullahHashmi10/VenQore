import React from 'react';
import { Building2, FileText, Hash, Mail, Phone, MapPin, Globe, CreditCard, Clock, ChevronRight } from 'lucide-react';

export default function BusinessSettingsSection({ data, setData }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* High Density Dashboard Grid */}
            <div className="grid grid-cols-12 gap-6">

                {/* Row 1: Core Identity (Takes full top row for ease of access) */}
                <div className="col-span-12 xl:col-span-8 p-6 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                            <Building2 size={18} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Business Identity</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 group/input">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Business Name</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.business_name}
                                    onChange={(e) => setData('business_name', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Acme Corp"
                                />
                                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>
                        </div>
                        <div className="space-y-1.5 group/input">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Tax / NTN</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.tax_number}
                                    onChange={(e) => setData('tax_number', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Tax ID"
                                />
                                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>
                        </div>
                        <div className="space-y-1.5 group/input">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Official Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={data.business_email}
                                    onChange={(e) => setData('business_email', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="email@company.com"
                                />
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>
                        </div>
                        <div className="space-y-1.5 group/input">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Phone Line</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={data.business_phone}
                                    onChange={(e) => setData('business_phone', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="+92..."
                                />
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Regional Settings (Compact Side Panel) */}
                <div className="col-span-12 xl:col-span-4 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[40px] translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Globe size={18} className="text-purple-400" />
                            <h3 className="font-bold">Regional Settings</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Currency</label>
                                <div className="relative">
                                    <select
                                        value={data.currency}
                                        onChange={(e) => {
                                            const newCurr = e.target.value;
                                            const symbolMap = {
                                                'PKR': 'Rs.',
                                                'USD': '$',
                                                'EUR': '€',
                                                'GBP': '£',
                                                'INR': '₹',
                                                'AED': 'DH',
                                                'SAR': 'SR',
                                            };
                                            setData({
                                                ...data,
                                                currency: newCurr,
                                                currency_symbol: symbolMap[newCurr] || data.currency_symbol,
                                            });
                                        }}
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all text-white appearance-none cursor-pointer hover:bg-white/20"
                                    >
                                        <option className="bg-slate-800 text-white" value="PKR">PKR - Pakistani Rupee</option>
                                        <option className="bg-slate-800 text-white" value="USD">USD - US Dollar</option>
                                        <option className="bg-slate-800 text-white" value="EUR">EUR - Euro</option>
                                        <option className="bg-slate-800 text-white" value="GBP">GBP - British Pound</option>
                                        <option className="bg-slate-800 text-white" value="AED">AED - UAE Dirham</option>
                                        <option className="bg-slate-800 text-white" value="SAR">SAR - Saudi Riyal</option>
                                        <option className="bg-slate-800 text-white" value="INR">INR - Indian Rupee</option>
                                    </select>
                                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" size={16} />
                                    <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 rotate-90 pointer-events-none" size={14} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Currency Symbol</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.currency_symbol}
                                        onChange={(e) => setData('currency_symbol', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all text-white placeholder:text-slate-600"
                                        placeholder="e.g. Rs. or $"
                                    />
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-xs">SYM</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timezone</label>
                                <div className="relative">
                                    <select
                                        value={data.timezone}
                                        onChange={(e) => setData('timezone', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all text-white appearance-none cursor-pointer hover:bg-white/20"
                                    >
                                        <option className="bg-slate-800 text-white" value="Asia/Karachi">Asia/Karachi (PKT)</option>
                                        <option className="bg-slate-800 text-white" value="Asia/Dubai">Asia/Dubai (GST)</option>
                                        <option className="bg-slate-800 text-white" value="Asia/Riyadh">Asia/Riyadh (AST)</option>
                                        <option className="bg-slate-800 text-white" value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                                        <option className="bg-slate-800 text-white" value="Europe/London">Europe/London (GMT)</option>
                                        <option className="bg-slate-800 text-white" value="America/New_York">America/New_York (EST)</option>
                                        <option className="bg-slate-800 text-white" value="America/Chicago">America/Chicago (CST)</option>
                                        <option className="bg-slate-800 text-white" value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                                        <option className="bg-slate-800 text-white" value="Australia/Sydney">Australia/Sydney (AEST)</option>
                                        <option className="bg-slate-800 text-white" value="UTC">Universal Time (UTC)</option>
                                    </select>
                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" size={16} />
                                    <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 rotate-90 pointer-events-none" size={14} />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    Determines date rollovers for reports.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Address (Full width of remaining space) */}
                <div className="col-span-12 p-6 bg-white dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm relative group hover:border-indigo-500/30 transition-all">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 shrink-0">
                            <MapPin size={18} />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Head Office Address</label>
                            <textarea
                                value={data.business_address}
                                onChange={(e) => setData('business_address', e.target.value)}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all min-h-[80px] resize-none"
                                placeholder="Complete address for invoices and footer..."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
