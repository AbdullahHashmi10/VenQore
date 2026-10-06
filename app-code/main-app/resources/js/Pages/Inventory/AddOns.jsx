import React, { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { Plus, Trash2, Pencil, X, Loader2, Layers, Check } from 'lucide-react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import ConfirmModal from '@/Components/ConfirmModal';

/**
 * Add-ons library (FOH plan, step 1c).
 *
 * Define a group once ("Pizza toppings: Extra cheese +100, Olives +50"), then say
 * where it applies: whole categories and/or single products. Variants stay variants;
 * add-ons are extras on top of a line.
 */
const blankGroup = () => ({ id: null, name: '', min_select: 0, max_select: 1, modifiers: [{ id: null, name: '', price_delta: 0, is_default: false, available: true }], category_ids: [], product_ids: [] });

const notify = (message, type = 'success') => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('amd:toast', { detail: { message, type } }));
};

const rule = (g) => {
    const min = Number(g.min_select) || 0, max = Number(g.max_select) || 1;
    if (min >= 1 && max === 1) return 'Pick one';
    if (min >= 1) return `Pick ${min}–${max}`;
    return max === 1 ? 'Optional, one' : `Optional, up to ${max}`;
};

export default function AddOns({ storeSlug, groups: initial = [], categories = [], products = [] }) {
    const [groups, setGroups] = useState(initial);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [productSearch, setProductSearch] = useState('');

    const catName = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories]);

    const save = async () => {
        if (!editing.name.trim()) { setError('Give the group a name, e.g. "Pizza toppings".'); return; }
        if (!editing.modifiers.some(m => m.name.trim())) { setError('Add at least one add-on.'); return; }
        setSaving(true); setError('');
        const body = {
            name: editing.name.trim(),
            min_select: Number(editing.min_select) || 0,
            max_select: Number(editing.max_select) || 1,
            modifiers: editing.modifiers.filter(m => m.name.trim()).map(m => ({
                id: m.id, name: m.name.trim(), price_delta: Number(m.price_delta) || 0, is_default: !!m.is_default, available: m.available !== false,
            })),
            category_ids: editing.category_ids,
            product_ids: editing.product_ids,
        };
        try {
            const { data } = editing.id
                ? await axios.put(route('store.addons.update', { store_slug: storeSlug, id: editing.id }), body)
                : await axios.post(route('store.addons.store', { store_slug: storeSlug }), body);
            setGroups(prev => editing.id ? prev.map(g => g.id === data.group.id ? data.group : g) : [...prev, data.group]);
            notify('Add-on group saved');
            setEditing(null);
        } catch (e) {
            setError(e?.response?.data?.message || 'Could not save this group.');
        } finally { setSaving(false); }
    };

    const remove = async () => {
        try {
            await axios.delete(route('store.addons.destroy', { store_slug: storeSlug, id: deleteId }));
            setGroups(prev => prev.filter(g => g.id !== deleteId));
            notify('Add-on group deleted');
        } catch (e) { notify('Could not delete that group.', 'error'); }
        setDeleteId(null);
    };

    const setMod = (i, patch) => setEditing(g => ({ ...g, modifiers: g.modifiers.map((m, j) => j === i ? { ...m, ...patch } : m) }));
    const toggle = (key, id) => setEditing(g => ({ ...g, [key]: g[key].includes(id) ? g[key].filter(x => x !== id) : [...g[key], id] }));

    const shownProducts = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        return products.filter(p => !q || p.name.toLowerCase().includes(q)).slice(0, 60);
    }, [products, productSearch]);

    return (
        <OneGlanceLayout>
            <Head title="Add-ons" />
            <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink flex items-center gap-2"><Layers size={22} /> Add-ons</h1>
                        <p className="text-sm text-ink-muted mt-1 max-w-2xl">
                            Extras a guest can add to a dish: extra cheese, olives, a side. Define a group once, then attach it to a whole category
                            (all your pizzas) or to single items. Sizes and flavours stay as variants on the product.
                        </p>
                    </div>
                    <button type="button" onClick={() => { setEditing(blankGroup()); setError(''); }}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm">
                        <Plus size={16} /> New group
                    </button>
                </div>

                {groups.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-line p-10 text-center text-ink-muted text-sm">
                        No add-on groups yet. Create one, for example "Pizza toppings", and attach it to your Pizza category.
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    {groups.map(g => (
                        <div key={g.id} className="rounded-2xl bg-surface border border-line p-4 shadow-sm space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-bold text-ink">{g.name}</div>
                                    <div className="text-xs text-ink-muted">{rule(g)}</div>
                                </div>
                                <div className="flex gap-1">
                                    <button type="button" aria-label="Edit group" onClick={() => { setEditing({ ...g, modifiers: g.modifiers.map(m => ({ ...m })) }); setError(''); }} className="p-2 rounded-lg hover:bg-sunken text-ink-secondary"><Pencil size={15} /></button>
                                    <button type="button" aria-label="Delete group" onClick={() => setDeleteId(g.id)} className="p-2 rounded-lg hover:bg-sunken text-red-600"><Trash2 size={15} /></button>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {g.modifiers.map(m => (
                                    <span key={m.id} className={`text-xs px-2 py-1 rounded-full border border-line bg-sunken ${m.available ? '' : 'opacity-50 line-through'}`}>
                                        {m.name}{Number(m.price_delta) ? ` ${m.price_delta > 0 ? '+' : ''}${m.price_delta}` : ''}
                                    </span>
                                ))}
                            </div>
                            <div className="text-xs text-ink-muted">
                                Applies to:{' '}
                                {g.category_ids.length || g.product_ids.length
                                    ? [...g.category_ids.map(id => `all ${catName[id] || 'category'}`), ...(g.product_ids.length ? [`${g.product_ids.length} item${g.product_ids.length === 1 ? '' : 's'}`] : [])].join(', ')
                                    : 'nothing yet'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-line">
                            <h2 className="font-bold text-ink">{editing.id ? 'Edit add-on group' : 'New add-on group'}</h2>
                            <button type="button" aria-label="Close" onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-sunken"><X size={16} /></button>
                        </div>
                        <div className="p-4 space-y-5">
                            {error && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">{error}</div>}

                            <label className="block text-xs font-semibold text-ink-muted">Group name
                                <input value={editing.name} onChange={e => setEditing(g => ({ ...g, name: e.target.value }))} placeholder="Pizza toppings"
                                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink" />
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="block text-xs font-semibold text-ink-muted">Minimum to pick
                                    <input type="number" min="0" value={editing.min_select} onChange={e => setEditing(g => ({ ...g, min_select: e.target.value }))}
                                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink" />
                                    <span className="font-normal">0 = optional</span>
                                </label>
                                <label className="block text-xs font-semibold text-ink-muted">Maximum to pick
                                    <input type="number" min="1" value={editing.max_select} onChange={e => setEditing(g => ({ ...g, max_select: e.target.value }))}
                                        className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink" />
                                </label>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-ink-muted">Add-ons in this group</div>
                                {editing.modifiers.map((m, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input value={m.name} onChange={e => setMod(i, { name: e.target.value })} placeholder="Extra cheese"
                                            className="flex-1 min-w-0 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink" />
                                        <input type="number" value={m.price_delta} onChange={e => setMod(i, { price_delta: e.target.value })} aria-label="Price change"
                                            className="w-24 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink text-right" />
                                        <label className="flex items-center gap-1 text-xs text-ink-muted whitespace-nowrap"><input type="checkbox" checked={!!m.is_default} onChange={e => setMod(i, { is_default: e.target.checked })} /> Pre-ticked</label>
                                        <label className="flex items-center gap-1 text-xs text-ink-muted whitespace-nowrap"><input type="checkbox" checked={m.available !== false} onChange={e => setMod(i, { available: e.target.checked })} /> In stock</label>
                                        <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => setEditing(g => { const m = [...g.modifiers]; [m[i - 1], m[i]] = [m[i], m[i - 1]]; return { ...g, modifiers: m }; })} className="px-2 py-1 rounded-lg hover:bg-sunken text-ink-muted disabled:opacity-30">↑</button>
                                        <button type="button" aria-label="Move down" disabled={i === editing.modifiers.length - 1} onClick={() => setEditing(g => { const m = [...g.modifiers]; [m[i + 1], m[i]] = [m[i], m[i + 1]]; return { ...g, modifiers: m }; })} className="px-2 py-1 rounded-lg hover:bg-sunken text-ink-muted disabled:opacity-30">↓</button>
                                        <button type="button" aria-label="Remove add-on" onClick={() => setEditing(g => ({ ...g, modifiers: g.modifiers.filter((_, j) => j !== i) }))} className="p-2 rounded-lg hover:bg-sunken text-red-600"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => setEditing(g => ({ ...g, modifiers: [...g.modifiers, { id: null, name: '', price_delta: 0, is_default: false, available: true }] }))}
                                    className="text-xs font-semibold text-brand-600 inline-flex items-center gap-1"><Plus size={14} /> Add another</button>
                                <p className="text-xs text-ink-muted">The price change can be negative (for example "No cheese, -30").</p>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-ink-muted">Offer on every item in these categories</div>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(c => {
                                        const on = editing.category_ids.includes(c.id);
                                        return (
                                            <button key={c.id} type="button" onClick={() => toggle('category_ids', c.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-ink-secondary border-line'}`}>
                                                {on && <Check size={12} className="inline mr-1" />}{c.name}
                                            </button>
                                        );
                                    })}
                                    {categories.length === 0 && <span className="text-xs text-ink-muted">No categories yet.</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-ink-muted">Or offer on single items ({editing.product_ids.length} chosen)</div>
                                <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search items"
                                    className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink" />
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                    {shownProducts.map(p => {
                                        const on = editing.product_ids.includes(p.id);
                                        return (
                                            <button key={p.id} type="button" onClick={() => toggle('product_ids', p.id)}
                                                className={`px-3 py-1.5 rounded-full text-xs border ${on ? 'bg-brand-600 text-white border-brand-600' : 'bg-surface text-ink-secondary border-line'}`}>
                                                {p.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t border-line">
                            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-sm font-semibold border border-line">Cancel</button>
                            <button type="button" disabled={saving} onClick={save} className="px-5 py-2 rounded-xl text-sm font-bold bg-brand-600 text-white inline-flex items-center gap-2 disabled:opacity-60">
                                {saving && <Loader2 size={14} className="animate-spin" />} Save group
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                show={!!deleteId}
                title="Delete this add-on group?"
                message="It will stop being offered on every item and category it is attached to. Past sales keep what was sold."
                confirmLabel="Delete"
                isDangerous
                onConfirm={remove}
                onClose={() => setDeleteId(null)}
            />
        </OneGlanceLayout>
    );
}
