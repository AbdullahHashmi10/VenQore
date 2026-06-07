import React, { useState } from 'react';
import { Link, usePage, Head } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    CreditCard, 
    Users, 
    Settings, 
    Package, 
    Ticket, 
    Layers, 
    LogOut, 
    Bell,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    Store,
    Database,
    Zap
} from 'lucide-react';
import Toast from '@/Components/Toast';

export default function SuperAdminLayout({ children, title }) {
    const { props } = usePage();
    const { auth, flash } = props;
    const [collapsed, setCollapsed] = useState(false);
    
    // Quick Nav Items
    const navItems = [
        { label: 'Platform HQ', icon: LayoutDashboard, href: route('platform.dashboard'), active: route().current('platform.dashboard') },
        { label: 'Plans & Limits', icon: Layers, href: route('platform.plans.index'), active: route().current('platform.plans.*') },
        { label: 'Platforms', icon: Database, href: route('platform.platforms.index'), active: route().current('platform.platforms.*') },
        { label: 'Coupons', icon: Ticket, href: route('platform.coupons.index'), active: route().current('platform.coupons.*') },
        { label: 'Tenant Overrides', icon: Zap, href: route('platform.tenants.overrides'), active: route().current('platform.tenants.*') },
        { label: 'Manage Stores', icon: Store, href: route('platform.stores'), active: route().current('platform.stores') },
        { label: 'Manage Users', icon: Users, href: route('platform.users'), active: route().current('platform.users') },
    ];

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
            <Head title={`${title} | Platform HQ`} />
            
            {/* Sidebar */}
            <aside 
                className={`flex flex-col transition-all duration-300 border-r border-slate-800 bg-slate-900 shadow-2xl relative z-50 ${collapsed ? 'w-20' : 'w-72'}`}
            >
                {/* Logo Section */}
                <div className="h-20 flex items-center px-6 gap-4 border-b border-slate-800/50">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                        <ShieldCheck className="text-white" size={24} />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col overflow-hidden whitespace-nowrap">
                            <span className="font-black text-xl tracking-tight text-white">VENQORE</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Command Center</span>
                        </div>
                    )}
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {navItems.map((item, idx) => (
                        <Link
                            key={idx}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${
                                item.active 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                            }`}
                        >
                            <item.icon size={20} className={item.active ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                            {!collapsed && <span className="font-semibold text-sm">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-slate-800/50 space-y-1">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all font-semibold text-sm"
                    >
                        <ChevronLeft size={20} />
                        {!collapsed && <span>Back to Site</span>}
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-semibold text-sm w-full text-left"
                    >
                        <LogOut size={20} />
                        {!collapsed && <span>Logout</span>}
                    </Link>
                </div>

                {/* Collapse Toggle */}
                <button 
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute top-24 -right-3 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-indigo-600 transition-colors z-[60]"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header */}
                <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-sm font-bold text-slate-100">{auth?.user?.name}</span>
                            <span className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">Super Administrator</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-indigo-500 flex items-center justify-center font-bold text-xs">
                           {auth?.user?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                    </div>
                </header>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {/* Toast System Placeholder (Mirroring OneGlanceLayout for consistency) */}
            {flash?.success && <Toast message={flash.success} type="success" />}
            {flash?.error && <Toast message={flash.error} type="error" />}
        </div>
    );
}

// Minimal scrollbar styles for dark mode
const style = document.createElement('style');
style.textContent = `
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #1e293b;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #334155;
    }
`;
document.head.appendChild(style);
