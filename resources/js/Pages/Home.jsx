import React, { useRef, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    Zap,
    ShoppingCart,
    ShoppingBag,
    DollarSign,
    Package,
    Users,
    LayoutDashboard,
    UserCog,
    Settings,
    BarChart2,
    ShieldCheck,
    Database,
    Activity,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Clock
} from 'lucide-react';

// --- 3D SPECULAR TILT CARD ---
const FeatureCard = ({ icon: Icon, title, description, colorClass, glowColor, routeName }) => {
    const cardRef = useRef(null);
    const glowRef = useRef(null);
    const { store } = usePage().props;

    const handleMouseMove = (e) => {
        if (!cardRef.current || !glowRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        const glowX = (x / rect.width) * 100;
        const glowY = (y / rect.height) * 100;
        glowRef.current.style.opacity = '1';
        glowRef.current.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.25), transparent 70%)`;
    };

    const handleMouseLeave = () => {
        if (!cardRef.current || !glowRef.current) return;
        cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        glowRef.current.style.opacity = '0';
    };

    const href = typeof route === 'function' && routeName
        ? route(routeName.startsWith('store.') ? routeName : `store.${routeName}`, { store_slug: store?.slug })
        : '#';

    return (
        <Link
            href={href}
            className="group relative w-full h-full min-h-[210px] cursor-pointer block"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background Radial Glow */}
            <div className={`absolute inset-0 ${colorClass} rounded-2xl blur-[50px] opacity-10 group-hover:opacity-25 transition-opacity duration-500`} />

            {/* Card Shell */}
            <div
                ref={cardRef}
                className="relative h-full w-full bg-surface backdrop-blur-xl rounded-2xl border border-line dark:border-white/10 p-6 flex flex-col items-center text-center transition-all duration-200 ease-out will-change-transform shadow-sm group-hover:shadow-xl dark:shadow-none group-hover:border-brand-300 dark:group-hover:border-brand-500/40"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div
                    ref={glowRef}
                    className="absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-0 mix-blend-soft-light z-20 rounded-2xl"
                />

                <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                    <div className={`mb-4 p-4 rounded-2xl bg-surface dark:bg-white/5 border border-line dark:border-white/10 ${glowColor} shadow-inner transition-transform duration-300 group-hover:scale-110`}>
                        <Icon size={30} />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-ink group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors">
                        {title}
                    </h3>
                    <p className="text-ink-muted text-sm font-light leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
};

export default function Home({ recentActivity = [], systemLogs = [] }) {
    const { props } = usePage();
    const user = props.auth?.user;
    const store = props.store;

    const userRole = user?.role;
    const userPerms = user?.permissions || [];
    const isFullAccess = userRole === 'owner' || userRole === 'admin' || userRole === 'manager' || !!user?.is_platform_admin;
    const hasPerm = (...keys) => isFullAccess || keys.some(k => userPerms.some(p => p === k || p.startsWith(k + '.')));
    const hasAdminPerm = (...keys) => isFullAccess || keys.some(k => userPerms.includes(k));

    // Active category filter: 'all', 'operations', 'admin'
    const [selectedCategory, setSelectedCategory] = useState('all');
    // Active tab in Recent Activity: 'store' or 'system'
    const [activityTab, setActivityTab] = useState('store');

    // All available shortcuts combining operations and store admin features
    const allShortcuts = [
        // --- Core Operations ---
        {
            name: 'Point of Sale',
            icon: Zap,
            route: 'store.pos',
            description: 'Process sales instantly at checkout.',
            colorClass: 'bg-brand-600',
            glowColor: 'text-brand-500 dark:text-brand-400',
            category: 'operations',
            perm: () => hasPerm('pos')
        },
        {
            name: 'New Sale',
            icon: ShoppingCart,
            route: 'store.sales.invoice.create',
            description: 'Create detailed invoices and orders.',
            colorClass: 'bg-blue-600',
            glowColor: 'text-blue-500 dark:text-blue-400',
            category: 'operations',
            perm: () => hasPerm('sales')
        },
        {
            name: 'All Inventory',
            icon: Package,
            route: 'store.inventory.index',
            description: 'View products, stock levels, and batches.',
            colorClass: 'bg-emerald-600',
            glowColor: 'text-emerald-500 dark:text-emerald-400',
            category: 'operations',
            perm: () => hasPerm('inventory')
        },
        {
            name: 'New Purchase',
            icon: ShoppingBag,
            route: 'store.purchases.create',
            description: 'Stock up inventory & manage purchase orders.',
            colorClass: 'bg-teal-600',
            glowColor: 'text-teal-500 dark:text-teal-400',
            category: 'operations',
            perm: () => hasPerm('purchases')
        },
        {
            name: 'New Expense',
            icon: DollarSign,
            route: 'store.expenses.index',
            description: 'Record operating expenses and business costs.',
            colorClass: 'bg-amber-600',
            glowColor: 'text-amber-500 dark:text-amber-400',
            category: 'operations',
            perm: () => hasPerm('finance.expenses')
        },
        {
            name: 'All Parties',
            icon: Users,
            route: 'store.parties.index',
            description: 'Manage customers, suppliers, and contacts.',
            colorClass: 'bg-indigo-600',
            glowColor: 'text-indigo-500 dark:text-indigo-400',
            category: 'operations',
            perm: () => hasPerm('purchases.suppliers', 'admin.staff_view', 'sales')
        },

        // --- Store Management & Administration (Unified from /admin) ---
        {
            name: 'Admin Dashboard',
            icon: LayoutDashboard,
            route: 'store.admin.dashboard',
            description: 'View system KPIs, cash flow snapshots, and metrics.',
            colorClass: 'bg-brand-600',
            glowColor: 'text-brand-500 dark:text-brand-400',
            category: 'admin',
            perm: () => hasAdminPerm('admin.settings_manage')
        },
        {
            name: 'User Management',
            icon: UserCog,
            route: 'store.admin.users',
            description: 'Add staff, invite teammates, and manage roles.',
            colorClass: 'bg-emerald-600',
            glowColor: 'text-emerald-500 dark:text-emerald-400',
            category: 'admin',
            perm: () => hasAdminPerm('users.manage')
        },
        {
            name: 'System Settings',
            icon: Settings,
            route: 'store.admin.settings',
            description: 'Configure store preferences and system defaults.',
            colorClass: 'bg-neutral-600',
            glowColor: 'text-ink-muted',
            category: 'admin',
            perm: () => hasAdminPerm('admin.settings_manage')
        },
        {
            name: 'Reports Center',
            icon: BarChart2,
            route: 'store.reports.index',
            description: 'Detailed analytics on sales, inventory, and finances.',
            colorClass: 'bg-purple-600',
            glowColor: 'text-purple-500 dark:text-purple-400',
            category: 'admin',
            perm: () => hasPerm('reports')
        },
        {
            name: 'Security Logs',
            icon: ShieldCheck,
            route: 'store.admin.logs',
            description: 'Monitor system access, audit trails, and actions.',
            colorClass: 'bg-amber-600',
            glowColor: 'text-amber-500 dark:text-amber-400',
            category: 'admin',
            perm: () => hasAdminPerm('audit', 'admin.settings_manage')
        },
        {
            name: 'Database Management',
            icon: Database,
            route: 'store.admin.data',
            description: 'Perform exports, imports, and data maintenance.',
            colorClass: 'bg-blue-600',
            glowColor: 'text-blue-500 dark:text-blue-400',
            category: 'admin',
            perm: () => hasAdminPerm('admin.settings_manage')
        },
    ];

    // Filter shortcuts by user permission and active category tab
    const authorizedShortcuts = allShortcuts.filter(s => !s.perm || s.perm());
    const visibleShortcuts = authorizedShortcuts.filter(s => {
        if (selectedCategory === 'all') return true;
        return s.category === selectedCategory;
    });

    const hasAdminShortcuts = authorizedShortcuts.some(s => s.category === 'admin');

    return (
        <OneGlanceLayout activeMenu="Home">
            <Head title="Home" />

            <div className="min-h-full flex flex-col relative p-6 md:p-8">
                {/* Mesh Gradient Background (Dark Mode) */}
                <div className="hidden dark:block fixed top-0 right-0 w-[800px] h-[800px] bg-brand-600/15 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="hidden dark:block fixed bottom-0 left-0 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none" />
                <div className="hidden dark:block fixed inset-0 bg-[url('/images/noise.svg')] opacity-20 pointer-events-none" />

                {/* Header Greeting & Category Tabs */}
                <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-bold text-ink tracking-tight mb-1 uppercase">
                            Welcome back, {user?.name?.split(' ')[0] || 'Partner'}
                        </h1>
                        <p className="text-ink-muted uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Monitoring {store?.name || 'Your Store'}
                        </p>
                    </div>

                    {/* Category Filter Pills (Only shown if user has access to multiple categories) */}
                    {hasAdminShortcuts && (
                        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface border border-line self-start md:self-auto shadow-sm">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedCategory === 'all'
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'text-ink-muted hover:text-ink hover:bg-neutral-100 dark:hover:bg-white/5'
                                }`}
                            >
                                All ({authorizedShortcuts.length})
                            </button>
                            <button
                                onClick={() => setSelectedCategory('operations')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedCategory === 'operations'
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'text-ink-muted hover:text-ink hover:bg-neutral-100 dark:hover:bg-white/5'
                                }`}
                            >
                                Operations
                            </button>
                            <button
                                onClick={() => setSelectedCategory('admin')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedCategory === 'admin'
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'text-ink-muted hover:text-ink hover:bg-neutral-100 dark:hover:bg-white/5'
                                }`}
                            >
                                Administration
                            </button>
                        </div>
                    )}
                </div>

                {/* Big Shortcuts Grid (Clean 3-column responsive layout) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 mb-8 shrink-0">
                    {visibleShortcuts.map((shortcut, index) => (
                        <FeatureCard
                            key={`${shortcut.name}-${index}`}
                            title={shortcut.name}
                            icon={shortcut.icon}
                            description={shortcut.description}
                            routeName={shortcut.route}
                            colorClass={shortcut.colorClass}
                            glowColor={shortcut.glowColor}
                        />
                    ))}
                </div>

                {/* Recent Activity Section */}
                {hasPerm('sales', 'reports', 'audit') && (
                    <div className="bg-surface backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-line dark:border-white/10 shadow-sm relative z-10 flex flex-col shrink-0 h-auto mb-10">
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-line dark:border-white/5 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
                                    <Activity size={22} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                                        Recent Activity
                                    </h2>
                                    <p className="text-xs text-ink-muted">
                                        Real-time event feed for your business store
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Activity Sub-Tabs (if user has audit rights) */}
                                {systemLogs && systemLogs.length > 0 && (
                                    <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100 dark:bg-white/5 text-xs font-semibold">
                                        <button
                                            onClick={() => setActivityTab('store')}
                                            className={`px-3 py-1 rounded-md transition-colors ${
                                                activityTab === 'store'
                                                    ? 'bg-surface text-ink shadow-sm font-bold'
                                                    : 'text-ink-muted hover:text-ink'
                                            }`}
                                        >
                                            Store Operations
                                        </button>
                                        <button
                                            onClick={() => setActivityTab('system')}
                                            className={`px-3 py-1 rounded-md transition-colors ${
                                                activityTab === 'system'
                                                    ? 'bg-surface text-ink shadow-sm font-bold'
                                                    : 'text-ink-muted hover:text-ink'
                                            }`}
                                        >
                                            System Logs
                                        </button>
                                    </div>
                                )}

                                {activityTab === 'store' ? (
                                    <Link
                                        href={route('store.sales.index', { store_slug: store?.slug })}
                                        className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        View All Sales <ArrowRight size={13} />
                                    </Link>
                                ) : (
                                    <Link
                                        href={route('store.admin.logs', { store_slug: store?.slug })}
                                        className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        View All Logs <ArrowRight size={13} />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Activity Item List */}
                        <div className="space-y-3">
                            {activityTab === 'store' && (
                                <>
                                    {recentActivity.map((activity, i) => {
                                        const isPositive = activity.amount && activity.amount.includes('+');
                                        return (
                                            <div
                                                key={activity.id || i}
                                                className="flex items-center justify-between p-4 rounded-xl bg-surface dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 border border-line dark:border-white/5 transition-colors group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                            isPositive
                                                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                                        }`}
                                                    >
                                                        {isPositive ? (
                                                            <ArrowUpRight size={20} />
                                                        ) : (
                                                            <ArrowDownRight size={20} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-ink group-hover:text-brand-600 transition-colors">
                                                            {activity.title}
                                                        </p>
                                                        <p className="text-xs text-ink-muted mt-0.5">
                                                            {activity.subtitle || 'Transaction recorded'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className={`text-sm font-bold ${
                                                            isPositive
                                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                                : 'text-ink'
                                                        }`}
                                                    >
                                                        {activity.amount}
                                                    </p>
                                                    <p className="text-2xs text-ink-muted mt-0.5 flex items-center justify-end gap-1">
                                                        <Clock size={11} /> {activity.time}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {recentActivity.length === 0 && (
                                        <div className="py-12 text-center text-ink-muted">
                                            <Activity size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-semibold">No recent transactions to display</p>
                                            <p className="text-xs text-ink-muted mt-1">
                                                Sales, returns, and expenses will appear here automatically.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {activityTab === 'system' && (
                                <>
                                    {systemLogs.map((log, i) => (
                                        <div
                                            key={log.id || i}
                                            className="flex items-center justify-between p-4 rounded-xl bg-surface dark:bg-white/5 hover:bg-neutral-50 dark:hover:bg-white/10 border border-line dark:border-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-ink">
                                                        {log.action}
                                                    </p>
                                                    <p className="text-xs text-ink-muted mt-0.5">
                                                        {log.description} &bull; <span className="text-brand-600 dark:text-brand-400 font-semibold">{log.user}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xs text-ink-muted flex items-center justify-end gap-1">
                                                    <Clock size={11} /> {log.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {systemLogs.length === 0 && (
                                        <div className="py-12 text-center text-ink-muted">
                                            <ShieldCheck size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm font-semibold">No recent security logs</p>
                                            <p className="text-xs text-ink-muted mt-1">
                                                User logins and administrative actions will be logged here.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </OneGlanceLayout>
    );
}
