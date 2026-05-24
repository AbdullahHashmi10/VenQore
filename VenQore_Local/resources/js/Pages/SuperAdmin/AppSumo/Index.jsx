import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { 
    Ticket, Plus, Download, Upload, Trash2, Search, Filter, 
    CheckCircle, AlertCircle, RefreshCcw, ExternalLink
} from 'lucide-react';

export default function AppSumoIndex({ codes, filters, stats }) {
    const { data, setData, post, delete: destroy, processing, reset } = useForm({
        count: 100,
        tier: 'Tier 1',
        codes: '', // for import
    });

    const [showGenerate, setShowGenerate] = useState(false);
    const [showImport, setShowImport] = useState(false);

    const handleGenerate = (e) => {
        e.preventDefault();
        post(route('platform.appsumo.generate'), {
            onSuccess: () => {
                setShowGenerate(false);
                reset('count');
            }
        });
    };

    const handleImport = (e) => {
        e.preventDefault();
        post(route('platform.appsumo.import'), {
            onSuccess: () => {
                setShowImport(false);
                reset('codes');
            }
        });
    };

    const handlePurge = () => {
        if (confirm('Are you sure you want to clear all unredeemed codes?')) {
            destroy(route('platform.appsumo.purge'));
        }
    };

    return (
        <OneGlanceLayout title="AppSumo Code Bank">
            <Head title="AppSumo Code Bank" />

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-white flex items-center gap-3">
                            <Ticket className="text-indigo-400" />
                            AppSumo Code Bank
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Manage one-time redemption codes for the AppSumo LTD campaign.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            onClick={() => setShowGenerate(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Plus size={16} /> Bulk Generate
                        </button>
                        <button 
                            onClick={() => setShowImport(true)}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold border border-white/10 flex items-center gap-2 transition-all"
                        >
                            <Upload size={16} /> Import CSV
                        </button>
                        <a 
                            href={route('platform.appsumo.export')}
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/20 flex items-center gap-2 transition-all"
                        >
                            <Download size={16} /> Export CSV
                        </a>
                        <button 
                            onClick={handlePurge}
                            className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-xl text-sm font-bold border border-red-500/20 flex items-center gap-2 transition-all"
                        >
                            <Trash2 size={16} /> Clear Unused
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Codes</p>
                        <p className="text-3xl font-black text-white">{stats.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl">
                        <p className="text-emerald-500/60 text-xs font-bold uppercase tracking-widest mb-1">Available</p>
                        <p className="text-3xl font-black text-emerald-400">{stats.available.toLocaleString()}</p>
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-6 rounded-3xl">
                        <p className="text-indigo-500/60 text-xs font-bold uppercase tracking-widest mb-1">Redeemed</p>
                        <p className="text-3xl font-black text-indigo-400">{stats.redeemed.toLocaleString()}</p>
                    </div>
                </div>

                {/* Filters & Table */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-sm">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input 
                                type="text"
                                placeholder="Search by code or email..."
                                className="w-full bg-white/5 border-white/10 rounded-xl pl-10 text-sm text-white focus:ring-indigo-500"
                                onKeyUp={(e) => {
                                    if (e.key === 'Enter') {
                                        // Simple navigation for search
                                        window.location.href = route('platform.appsumo.index', { search: e.target.value });
                                    }
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-slate-500" />
                            <select 
                                className="bg-white/5 border-white/10 rounded-xl text-sm text-white focus:ring-indigo-500 py-1.5"
                                onChange={(e) => window.location.href = route('platform.appsumo.index', { status: e.target.value })}
                                defaultValue={filters.status || ''}
                            >
                                <option value="">All Statuses</option>
                                <option value="available">Available</option>
                                <option value="redeemed">Redeemed</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">Redemption Code</th>
                                    <th className="px-6 py-4">Plan Tier</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Store Link</th>
                                    <th className="px-6 py-4 text-right">Added</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {codes.data.length > 0 ? codes.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <code className="text-white font-mono font-bold bg-white/10 px-2 py-1 rounded text-sm">
                                                {item.code}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-300 text-sm">{item.plan_tier}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.is_redeemed ? (
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                                                        <CheckCircle size={12} /> Redeemed
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 break-all">{item.redeemed_by_email}</div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                                                    <AlertCircle size={12} /> Available
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.tenant ? (
                                                <Link 
                                                    href={route('store.dashboard', { store_slug: item.tenant.slug })}
                                                    className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
                                                >
                                                    {item.tenant.name}
                                                    <ExternalLink size={12} />
                                                </Link>
                                            ) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 text-right">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-500">
                                                <Ticket size={48} className="opacity-20" />
                                                <p>No codes found. Generate some above!</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modals */}
                {showGenerate && (
                    <div className="fixed inset-0 bg-[#020010]/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                                <Plus className="text-indigo-400" />
                                Bulk Generate Codes
                            </h2>
                            <form onSubmit={handleGenerate} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Count (Max 1,000)</label>
                                    <input 
                                        type="number" 
                                        value={data.count}
                                        onChange={e => setData('count', e.target.value)}
                                        className="w-full bg-white/5 border-white/10 rounded-2xl text-white px-5 py-3 focus:ring-indigo-500"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Plan Tier</label>
                                    <select 
                                        value={data.tier}
                                        onChange={e => setData('tier', e.target.value)}
                                        className="w-full bg-white/5 border-white/10 rounded-2xl text-white px-5 py-3 focus:ring-indigo-500"
                                    >
                                        <option value="Tier 1">Tier 1 (Single Store)</option>
                                        <option value="Tier 2">Tier 2 (3 Stores)</option>
                                        <option value="Tier 3">Tier 3 (10 Stores)</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setShowGenerate(false)}
                                        className="flex-1 bg-white/5 text-slate-400 px-6 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        {processing ? <RefreshCcw className="animate-spin" size={16} /> : 'Generate Now'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showImport && (
                    <div className="fixed inset-0 bg-[#020010]/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
                        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-xl w-full p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                            <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3 text-glow">
                                <Upload className="text-emerald-400" />
                                Import External Codes
                            </h2>
                            <form onSubmit={handleImport} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Codes (Paste comma or newline separated)</label>
                                    <textarea 
                                        rows="8"
                                        placeholder="CODE-123, CODE-456..."
                                        value={data.codes}
                                        onChange={e => setData('codes', e.target.value)}
                                        className="w-full bg-white/5 border-white/10 rounded-2xl text-white px-5 py-3 focus:ring-indigo-500 font-mono text-sm"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Assign to Plan Tier</label>
                                    <select 
                                        value={data.tier}
                                        onChange={e => setData('tier', e.target.value)}
                                        className="w-full bg-white/5 border-white/10 rounded-2xl text-white px-5 py-3 focus:ring-indigo-500"
                                    >
                                        <option value="Tier 1">Tier 1 (Single Store)</option>
                                        <option value="Tier 2">Tier 2 (3 Stores)</option>
                                        <option value="Tier 3">Tier 3 (10 Stores)</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 pt-4">
                                    <button 
                                        type="button"
                                        onClick={() => setShowImport(false)}
                                        className="flex-1 bg-white/5 text-slate-400 px-6 py-3 rounded-2xl font-bold hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={processing}
                                        className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        {processing ? <RefreshCcw className="animate-spin" size={16} /> : 'Start Import'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
