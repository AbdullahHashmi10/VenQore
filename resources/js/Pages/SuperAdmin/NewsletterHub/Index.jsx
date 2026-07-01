import React, { useState, useEffect } from 'react';
import OneGlanceLayout from '@/Layouts/PlatformShell'; // routed through unified Command Center shell
import { Head } from '@inertiajs/react';
import { Mail, Search, RefreshCw, User, CheckCircle, Database, Layout } from 'lucide-react';
import axios from 'axios';

export default function Index({ stats }) {
    const [subscribers, setSubscribers] = useState({ cloud: [], digital: [], all: [] });
    const [loading, setLoading] = useState(false);
    const [activeList, setActiveList] = useState('cloud'); // cloud | digital | all
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadSubscribers();
    }, []);

    const loadSubscribers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/VenQore/newsletter-hub/subscribers');
            if (res.data.success) {
                setSubscribers({
                    cloud: res.data.cloud,
                    digital: res.data.digital,
                    all: res.data.all
                });
            }
        } catch (err) {
            console.error('Failed to load subscribers', err);
        } finally {
            setLoading(false);
        }
    };

    const getActiveData = () => {
        if (activeList === 'cloud') return subscribers.cloud;
        if (activeList === 'digital') return subscribers.digital;
        return subscribers.all;
    };

    const filteredData = getActiveData().filter(s => 
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <OneGlanceLayout mode="admin" activeMenu="Newsletter Hub" title="Newsletter & Subscribers Hub">
            <Head title="Newsletter Hub" />

            <div className="space-y-6">
                {/* Stats Summary Card */}
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-white mb-2">Newsletter Subscription Lists</h2>
                        <p className="text-slate-400 text-sm max-w-xl">
                            Track the growth of your cloud platform insights and offline digital marketplace standalone packages update lists.
                        </p>
                    </div>
                    <div className="flex gap-4 self-stretch md:self-auto">
                        <div className="px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[120px]">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cloud List</span>
                            <span className="text-xl font-black text-white">{stats.cloud_count}</span>
                        </div>
                        <div className="px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[120px]">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Digital List</span>
                            <span className="text-xl font-black text-indigo-400">{stats.digital_count}</span>
                        </div>
                        <div className="px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[120px]">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Gross Total</span>
                            <span className="text-xl font-black text-emerald-400">{stats.total_count}</span>
                        </div>
                    </div>
                </div>

                {/* Sublist selection tabs */}
                <div className="flex border-b border-slate-800 gap-6">
                    <button
                        onClick={() => setActiveList('cloud')}
                        className={`pb-4 text-sm font-black tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${
                            activeList === 'cloud'
                                ? 'border-indigo-500 text-white'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Layout size={16} />
                        Cloud Website Subscribers
                    </button>
                    <button
                        onClick={() => setActiveList('digital')}
                        className={`pb-4 text-sm font-black tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${
                            activeList === 'digital'
                                ? 'border-indigo-500 text-white'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Database size={16} />
                        Digital Products Subscribers
                    </button>
                    <button
                        onClick={() => setActiveList('all')}
                        className={`pb-4 text-sm font-black tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${
                            activeList === 'all'
                                ? 'border-indigo-500 text-white'
                                : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Mail size={16} />
                        All Roster list
                    </button>
                </div>

                {/* Subscribers table list */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50"
                            />
                        </div>
                        <button
                            onClick={loadSubscribers}
                            disabled={loading}
                            className="p-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20">
                        <table className="w-full text-left text-xs divide-y divide-slate-800">
                            <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Subscriber Name</th>
                                    <th className="px-6 py-4">Email Address</th>
                                    <th className="px-6 py-4">Preference Interest</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Subscribed At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-slate-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading subscribers list...</td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No subscribers in this list query.</td>
                                    </tr>
                                ) : (
                                    filteredData.map(sub => (
                                        <tr key={sub.id} className="hover:bg-slate-800/20">
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <User size={14} className="text-slate-500" />
                                                <span>{sub.name || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4">{sub.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                                    sub.interest === 'digital'
                                                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                                                        : sub.interest === 'cloud'
                                                        ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                                                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                }`}>
                                                    {sub.interest === 'both' ? 'Both updates' : sub.interest === 'digital' ? 'Digital products' : 'Cloud website'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {new Date(sub.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
