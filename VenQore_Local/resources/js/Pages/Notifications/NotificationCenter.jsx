import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { usePage, Head, Link, router } from '@inertiajs/react';
import { Bell, Check, Trash2, Clock, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';

export default function NotificationsIndex({ notifications }) {

    const getIcon = (type) => {
        if (type.includes('Error') || type.includes('Risk')) return <AlertOctagon size={20} className="text-red-500" />;
        if (type.includes('Warning')) return <AlertTriangle size={20} className="text-amber-500" />;
        if (type.includes('Success')) return <CheckCircle size={20} className="text-emerald-500" />;
        return <Info size={20} className="text-blue-500" />;
    };

    const markAllRead = () => {
        router.post(route('store.notifications.mark-all-read', { store_slug: store.slug }));
    };

    const markAsRead = (id) => {
        router.post(route('store.notifications.mark-read', id));
    };

    const deleteNotification = (id) => {
        router.delete(route('store.notifications.destroy', id));
    };

    return (
        <OneGlanceLayout title="Notifications" activeMenu="Notifications">
            <Head title="Notifications" />

            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Actions */}
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">All Notifications</h2>
                            <p className="text-sm text-slate-500">Manage your system alerts and messages.</p>
                        </div>
                    </div>
                    {notifications.data.length > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors text-sm font-medium"
                        >
                            <Check size={16} /> Mark all read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px]">
                    {notifications.data.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {notifications.data.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-6 flex items-start gap-4 transition-colors ${notification.read_at ? 'opacity-75 bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                >
                                    <div className="shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-base ${notification.read_at ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>
                                                {notification.data.title || 'Notification'}
                                            </p>
                                            <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 ml-4">
                                                <Clock size={12} />
                                                {new Date(notification.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-3">
                                            {notification.data.message || 'No details.'}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            {!notification.read_at && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                                                >
                                                    Mark as Read
                                                </button>
                                            )}
                                            {notification.data.action_url && (
                                                <Link
                                                    href={notification.data.action_url}
                                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                                >
                                                    View Details
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <Bell size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">All caught up!</h3>
                            <p className="text-slate-500">You have no new notifications.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {notifications.links && notifications.data.length > 0 && (
                    <div className="flex justify-center mt-6">
                        {/* Simple Previous/Next for now, or proper pagination component */}
                        <div className="flex gap-2">
                            {notifications.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${link.active
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'} ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
