import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import PageHeader from '@/Components/PageHeader';
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
        <OneGlanceLayout title="Recycle Bin" mode="admin">
            <Head title="Recycle Bin" />

            <div className="flex flex-col h-full gap-6 p-6 overflow-hidden">
                <PageHeader
                    title="Recycle Bin"
                    subtitle="Restore deleted items or permanently remove them"
                    icon={Trash2}
                    breadcrumbs={[
                        { label: 'Recycle Bin' }
                    ]}
                />

                <div className="overflow-y-auto flex-1">

                    <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-app border-b border-line">
                                <tr>
                                    <th className="p-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider">Type</th>
                                    <th className="p-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider">Item Details</th>
                                    <th className="p-4 text-left text-xs font-bold text-ink-muted uppercase tracking-wider">Deleted At</th>
                                    <th className="p-4 text-right text-xs font-bold text-ink-muted uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-12 text-center text-ink-muted">
                                            <Trash2 size={48} className="mx-auto mb-3 opacity-20" />
                                            <p>Recycle Bin is empty</p>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={`${item.type}-${item.id}-${index}`} className="hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors">
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.type === 'product'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    : 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-bold text-ink">{item.title}</div>
                                                <div className="text-sm text-ink-muted">{item.description}</div>
                                            </td>
                                            <td className="p-4 text-sm text-ink-muted">
                                                {new Date(item.deleted_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
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
            </div>
        </OneGlanceLayout>
    );
}
