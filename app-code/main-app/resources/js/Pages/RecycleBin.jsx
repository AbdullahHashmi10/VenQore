import React from 'react';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
import { ListPageFrame, ListToolbar, ListStatCards } from '@/Components/ListShell';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function RecycleBin({ items = [] }) {
    const { store } = usePage().props;
    const handleRestore = (id, type) => {
        if (confirm('Are you sure you want to restore this item?')) {
            router.post(route('store.admin.recycle-bin.restore', { store_slug: store.slug, id }), { type });
        }
    };

    const handleForceDelete = (id, type) => {
        if (confirm('Are you sure? This will PERMANENTLY delete the item. This action cannot be undone.')) {
            router.delete(route('store.admin.recycle-bin.force-delete', { store_slug: store.slug, id }), {
                data: { type }
            });
        }
    };

    return (
        <OneGlanceLayout title="Recycle Bin" mode="admin" noPadding>
            <Head title="Recycle Bin" />

            <div className="max-md:p-1.5 max-md:h-full md:contents">
            <ListPageFrame className="max-md:flex max-md:flex-col max-md:h-full max-md:gap-3 max-md:p-1 max-md:overflow-hidden">
                <ListToolbar title="Recycle Bin" />
                <ListStatCards cards={[{ label: 'Deleted items', value: items.length, icon: Trash2, icon_tone: 'bg-red-50 text-red-600' }]} />
                <MobileListHeader title="Recycle Bin" />
                <MobileStats bp="md" hero={0} items={[{ label: 'Deleted items', value: items.length, tone: 'red', icon: Trash2 }]} />

                <div className="overflow-y-auto flex-1 md:min-h-0 md:overflow-auto md:rounded-[14px] md:border md:border-line md:shadow-sm md:bg-surface">

                    <div className="bg-surface rounded-xl max-md:rounded-xl border border-line overflow-hidden max-md:overflow-x-auto shadow-sm md:overflow-visible md:border-0 md:rounded-none md:shadow-none">
                        <table className="w-full max-md:min-w-[460px]">
                            <thead className="bg-app border-b border-line md:sticky md:top-0 md:z-10">
                                <tr>
                                    <th className="sticky top-0 z-10 bg-app p-4 max-md:p-2.5 text-left text-xs font-bold text-ink-muted uppercase tracking-wider">Type</th>
                                    <th className="sticky top-0 z-10 bg-app p-4 max-md:p-2.5 text-left text-xs font-bold text-ink-muted uppercase tracking-wider">Item Details</th>
                                    <th className="sticky top-0 z-10 bg-app p-4 max-md:p-2.5 text-left text-xs font-bold text-ink-muted uppercase tracking-wider">Deleted At</th>
                                    <th className="sticky top-0 z-10 bg-app p-4 max-md:p-2.5 text-right text-xs font-bold text-ink-muted uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-5 sm:p-12 text-center text-ink-muted">
                                            <Trash2 size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>Recycle Bin is empty</p>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={`${item.type}-${item.id}-${index}`} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                            <td className="p-4 max-md:p-2.5">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.type === 'product'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    : 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="p-4 max-md:p-2.5">
                                                <div className="font-bold text-ink">{item.title}</div>
                                                <div className="text-sm text-ink-muted">{item.description}</div>
                                            </td>
                                            <td className="p-4 max-md:p-2.5 max-md:text-xs text-sm text-ink-muted">
                                                {new Date(item.deleted_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 max-md:p-2.5 text-right">
                                                <div className="flex justify-end gap-2 max-md:flex-col max-md:items-stretch">
                                                    <button
                                                        onClick={() => handleRestore(item.id, item.type)}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors"
                                                    >
                                                        <RefreshCw size={14} />
                                                        Restore
                                                    </button>
                                                    <button
                                                        onClick={() => handleForceDelete(item.id, item.type)}
                                                        className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete Forever
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
