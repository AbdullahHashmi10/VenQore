import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { Plus, Edit2, Database, Shield, Layout, Save, X } from 'lucide-react';

export default function PlatformIndex({ platforms }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        slug: '',
        is_active: true
    });

    const startAdd = () => {
        reset();
        setIsAdding(true);
        setEditingId(null);
    };

    const startEdit = (p) => {
        setData({
            name: p.name,
            slug: p.slug,
            is_active: p.is_active
        });
        setEditingId(p.id);
        setIsAdding(false);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('platform.platforms.update', editingId), {
                onSuccess: () => cancel()
            });
        } else {
            post(route('platform.platforms.store'), {
                onSuccess: () => cancel()
            });
        }
    };

    return (
        <OneGlanceLayout title="System Platforms" mode="admin" activeMenu="Platforms">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">System Platforms</h2>
                    <p className="text-slate-400 mt-1">Define high-level software platforms (e.g. VenQore Cloud, VenQore On-Prem)</p>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={startAdd}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={18} /> Add Platform
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    {platforms.map((p) => (
                        <div 
                            key={p.id}
                            className={`p-6 rounded-3xl border transition-all flex items-center justify-between ${
                                editingId === p.id 
                                ? 'bg-indigo-500/10 border-indigo-500 shadow-xl shadow-indigo-500/10' 
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{p.name}</h3>
                                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">{p.slug}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    p.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                                }`}>
                                    {p.is_active ? 'Active' : 'Disabled'}
                                </span>
                                <button
                                    onClick={() => startEdit(p)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {platforms.length === 0 && (
                        <div className="p-20 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
                            <Database size={48} className="mx-auto mb-4 text-slate-700" />
                            <p className="text-slate-500 font-medium">No platforms defined yet.</p>
                        </div>
                    )}
                </div>

                {/* Form Section (Sidebar style) */}
                <div className="lg:col-span-1">
                    {(isAdding || editingId) ? (
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sticky top-28 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                {editingId ? <Edit2 size={20} className="text-indigo-400" /> : <Plus size={20} className="text-emerald-400" />}
                                {editingId ? 'Edit Platform' : 'New Platform'}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Platform Name</label>
                                    <input 
                                        type="text"
                                        value={data.name}
                                        onChange={e => {
                                            setData('name', e.target.value);
                                            if (!editingId) setData('slug', e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                                        }}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                                        placeholder="e.g. VenQore Cloud"
                                        required
                                    />
                                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Identifier (Slug)</label>
                                    <input 
                                        type="text"
                                        value={data.slug}
                                        onChange={e => setData('slug', e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm uppercase tracking-tighter"
                                        placeholder="E.G. CLOUD-S1"
                                        required
                                    />
                                    {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug}</p>}
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                    <span className="text-sm font-bold text-slate-300">Status Active</span>
                                    <button 
                                        type="button"
                                        onClick={() => setData('is_active', !data.is_active)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${data.is_active ? 'bg-emerald-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${data.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="pt-4 flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20"
                                    >
                                        <Save size={18} />
                                        {editingId ? 'Update Platform' : 'Save Platform'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancel}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black uppercase tracking-widest transition-all"
                                    >
                                        <X size={18} /> Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-10 text-center">
                            <Shield size={40} className="mx-auto mb-4 text-slate-700 opacity-50" />
                            <p className="text-slate-600 text-sm font-medium">Select a platform to edit or add a new one.</p>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
