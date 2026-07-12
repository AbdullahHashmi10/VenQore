import React, { useState } from 'react';
import { router, usePage, Head, Link } from '@inertiajs/react';
import ReportsLayout from '@/Layouts/ReportsLayout';
import {
    ArrowLeft, Calendar, Package, DollarSign, Layers, Info, Search
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';

export default function PointInTimeInventory({ data = [], stats = [], meta = {} }) {
    const { store } = usePage().props;
    const [asOf, setAsOf] = useState(meta.as_of || new Date().toISOString().split('T')[0]);
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('stock_value');
    const [sortDir, setSortDir] = useState('desc');

    const applyDate = () => {
        router.get(route('store.reports.point-in-time-inventory', { store_slug: store.slug }), { as_of: asOf }, { preserveState: true, preserveScroll: true });
    };

    const filtered = data
        .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.sku || '').toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
            const av = a[sortKey], bv = b[sortKey];
            if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === 'asc' ? av - bv : bv - av;
        });

    const toggleSort = (key) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const statIcon = (label) => {
        if (label.includes('Date')) return <Calendar size={18} />;
        if (label.includes('Value')) return <DollarSign size={18} />;
        if (label.includes('Quantity')) return <Layers size={18} />;
        return <Package size={18} />;
    };

    return (
        <ReportsLayout title="Point-In-Time Inventory">
            <Head title="Point-In-Time Inventory" />
            <div className="flex flex-col h-full gap-4 w-full">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-3 pl-2">
                        <Link href={route('store.reports.index', { store_slug: store.slug })} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Point-In-Time Inventory</h1>
                            <p className="text-xs text-slate-500 font-medium">Stock quantity and value reconstructed as of any past date</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 rounded-xl">
                        <Calendar size={16} className="text-slate-400 ml-1" />
                        <span className="text-xs font-bold text-slate-500 uppercase">As of</span>
                        <input
                            type="date"
                            value={asOf}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setAsOf(e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-600 dark:text-slate-300"
                        />
                        <button onClick={applyDate} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-colors shadow-sm">
                            View
                        </button>
                    </div>
                </div>

                {/* Info note about reconstruction method */}
                {meta.note && (
                    <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 shrink-0">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <span>{meta.note}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                    {stats.map((s, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center gap-2 text-indigo-500 mb-2">{statIcon(s.label)}</div>
                            <p className="text-xs font-bold text-slate-500 uppercase">{s.label}</p>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight mt-1">{s.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden flex-1 min-h-0">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white">Inventory Snapshot</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs w-56"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                                <tr>
                                    {[
                                        { key: 'name', label: 'Product' },
                                        { key: 'sku', label: 'SKU' },
                                        { key: 'category', label: 'Category' },
                                        { key: 'quantity', label: 'Quantity', align: 'right' },
                                        { key: 'unit_cost', label: 'Unit Cost', align: 'right' },
                                        { key: 'stock_value', label: 'Stock Value', align: 'right' },
                                    ].map(col => (
                                        <th
                                            key={col.key}
                                            onClick={() => toggleSort(col.key)}
                                            className={`px-6 py-3 font-bold cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-200 ${col.align === 'right' ? 'text-right' : ''}`}
                                        >
                                            {col.label} {sortKey === col.key && (sortDir === 'asc' ? '↑' : '↓')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">No inventory found as of this date.</td></tr>
                                ) : filtered.map((row, idx) => (
                                    <tr key={row.product_id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{row.name}</td>
                                        <td className="px-6 py-3 text-slate-500 font-mono text-xs">{row.sku}</td>
                                        <td className="px-6 py-3 text-slate-500">{row.category}</td>
                                        <td className="px-6 py-3 text-right text-slate-600 dark:text-slate-300 font-mono">{row.quantity}</td>
                                        <td className="px-6 py-3 text-right text-slate-500 font-mono">{formatCurrency(row.unit_cost, store)}</td>
                                        <td className="px-6 py-3 text-right font-bold text-slate-700 dark:text-slate-200 font-mono">{formatCurrency(row.stock_value, store)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ReportsLayout>
    );
}
