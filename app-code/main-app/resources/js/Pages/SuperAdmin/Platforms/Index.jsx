import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell'; // routed through unified Command Center shell
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
                    <p className="text-ink-muted mt-1">Define high-level software platforms (e.g. VenQore Cloud, VenQore On-Prem)</p>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={startAdd}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold transition-all shadow-lg "
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
                            className={`p-6 rounded-2xl border transition-all flex items-center justify-between ${
                                editingId === p.id 
                                ? 'bg-brand-500/10 border-brand-500 shadow-xl ' 
                                : 'bg-neutral-900 border-neutral-800 hover:border-line-strong shadow-lg'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${p.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-neutral-800 text-ink-muted'}`}>
                                    <Database size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{p.name}</h3>
                                    <p className="text-xs font-mono text-ink-muted uppercase tracking-widest">{p.slug}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-widest ${
                                    p.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-neutral-800 text-ink-muted border border-neutral-700'
                                }`}>
                                    {p.is_active ? 'Active' : 'Disabled'}
                                </span>
                                <button
                                    onClick={() => startEdit(p)}
                                    className="p-2 text-ink-muted hover:text-white hover:bg-interactive-hover rounded-xl transition-all"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {platforms.length === 0 && (
                        <div className="p-20 text-center bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800">
                            <Database size={48} className="mx-auto mb-4 text-ink-secondary" />
                            <p className="text-ink-muted font-medium">No platforms defined yet.</p>
                        </div>
                    )}
                </div>

                {/* Form Section (Sidebar style) */}
                <div className="lg:col-span-1">
                    {(isAdding || editingId) ? (
                        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 sticky top-28 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                {editingId ? <Edit2 size={20} className="text-brand-400" /> : <Plus size={20} className="text-emerald-400" />}
                                {editingId ? 'Edit Platform' : 'New Platform'}
                            </h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">Platform Name</label>
                                    <input 
                                        type="text"
                                        value={data.name}
                                        onChange={e => {
                                            setData('name', e.target.value);
                                            if (!editingId) setData('slug', e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                                        }}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold"
                                        placeholder="e.g. VenQore Cloud"
                                        required
                                    />
                                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-ink-muted uppercase tracking-widest mb-2">Identifier (Slug)</label>
                                    <input 
                                        type="text"
                                        value={data.slug}
                                        onChange={e => setData('slug', e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono text-sm uppercase tracking-tighter"
                                        placeholder="E.G. CLOUD-S1"
                                        required
                                    />
                                    {errors.slug && <p className="text-red-400 text-xs mt-1">{errors.slug}</p>}
                                </div>

                                <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-2xl border border-neutral-800">
                                    <span className="text-sm font-bold text-neutral-300">Status Active</span>
                                    <button 
                                        type="button"
                                        onClick={() => setData('is_active', !data.is_active)}
                                        className={`w-12 h-6 rounded-full p-1 transition-all ${data.is_active ? 'bg-emerald-600' : 'bg-neutral-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${data.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="pt-4 flex flex-col gap-3">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-lg "
                                    >
                                        <Save size={18} />
                                        {editingId ? 'Update Platform' : 'Save Platform'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancel}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-neutral-800 hover:bg-interactive-hover text-neutral-300 rounded-2xl font-bold uppercase tracking-widest transition-all"
                                    >
                                        <X size={18} /> Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-neutral-900/30 border border-dashed border-neutral-800 rounded-2xl p-10 text-center">
                            <Shield size={40} className="mx-auto mb-4 text-ink-secondary opacity-50" />
                            <p className="text-ink-secondary text-sm font-medium">Select a platform to edit or add a new one.</p>
                        </div>
                    )}
                </div>
            </div>
        </OneGlanceLayout>
    );
}
