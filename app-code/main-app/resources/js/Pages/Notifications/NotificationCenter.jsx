import React from 'react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import { usePage, Head, Link, router } from '@inertiajs/react';
import MobileListHeader from '@/Components/MobileListHeader';
import MobileStats from '@/Components/MobileStats';
import { ListPageFrame, ListToolbar, ListAddButton, ListStatCards } from '@/Components/ListShell';
import { Bell, Check, Trash2, Clock, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';

export default function NotificationsIndex({ notifications }) {
    const { store } = usePage().props;

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
        <OneGlanceLayout title="Notifications" activeMenu="Notifications" noPadding>
            <Head title="Notifications" />

            <div className="max-md:p-1.5 md:contents">
            <ListPageFrame className="max-md:max-w-4xl max-md:mx-auto max-md:space-y-6">
                <ListToolbar
                    title="Notifications"
                    actions={notifications.data.length > 0 ? <ListAddButton icon={Check} onClick={markAllRead}>Mark all read</ListAddButton> : null}
                />
                <ListStatCards cards={[
                    { label: 'Total', value: notifications.total ?? notifications.data.length, icon: Bell },
                    { label: 'Unread', value: notifications.data.filter((n) => !n.read_at).length, icon: AlertTriangle, icon_tone: 'bg-amber-50 text-amber-600' },
                ]} />

                <MobileListHeader title="Notifications" add={notifications.data.length > 0 ? { onClick: markAllRead, label: 'Mark all read', icon: Check } : undefined} />
                <MobileStats bp="md" hero={0} items={[
                    { label: 'Total', value: notifications.total ?? notifications.data.length, tone: 'ink', icon: Bell },
                    { label: 'Unread', value: notifications.data.filter((n) => !n.read_at).length, tone: 'amber', icon: AlertTriangle },
                ]} />

                {/* Notifications List */}
                <div className="bg-surface rounded-2xl shadow-sm border border-line overflow-hidden min-h-[400px] md:min-h-0 md:flex-1 md:overflow-auto md:rounded-[14px]">
                    {notifications.data.length > 0 ? (
                        <div className="divide-y divide-line">
                            {notifications.data.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-6 flex items-start gap-4 transition-colors ${notification.read_at ? 'opacity-75 bg-sunken/50 dark:bg-app' : 'bg-surface hover:bg-interactive-hover dark:hover:bg-interactive-hover'}`}
                                >
                                    <div className="shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-base ${notification.read_at ? 'font-medium text-ink-secondary' : 'font-bold text-ink'}`}>
                                                {notification.data.title || 'Notification'}
                                            </p>
                                            <span className="text-xs text-ink-muted flex items-center gap-1 shrink-0 ml-4">
                                                <Clock size={12} />
                                                {new Date(notification.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-ink-secondary text-sm leading-relaxed mb-3">
                                            {notification.data.message || 'No details.'}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            {!notification.read_at && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
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
                                        className="p-2 text-ink-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-sunken rounded-full flex items-center justify-center mb-4 text-ink-muted">
                                <Bell size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-ink-secondary dark:text-ink">All caught up!</h3>
                            <p className="text-ink-muted">You have no new notifications.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {notifications.links && notifications.data.length > 0 && (
                    <div className="flex justify-center mt-6 md:mt-0 md:shrink-0">
                        {/* Simple Previous/Next for now, or proper pagination component */}
                        <div className="flex gap-2">
                            {notifications.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${link.active
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-surface text-ink-secondary hover:bg-interactive-hover dark:hover:bg-interactive-hover'} ${!link.url && 'opacity-50 cursor-not-allowed'}`}
                                >{(link.label || '').replace(/<[^>]*>/g, '').replace(/&laquo;/g, '\u00ab').replace(/&raquo;/g, '\u00bb').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')}</Link>
                            ))}
                        </div>
                    </div>
                )}
            </ListPageFrame>
            </div>
        </OneGlanceLayout>
    );
}
