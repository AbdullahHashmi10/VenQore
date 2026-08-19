import React, { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import Nav from './Nav';
import CommandBar from './CommandBar';
import { Search, Bell, Sparkles, Menu, X, LogOut, User } from 'lucide-react';

export default function AppShell({ children, activeMenu }) {
    const { props } = usePage();
    const { auth, store, appearance } = props;
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCmdBarOpen, setIsCmdBarOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Keyboard shortcut to trigger Command Bar (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCmdBarOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="min-h-screen bg-app text-ink flex flex-col font-sans">
            {/* Command Bar search overlay */}
            <CommandBar isOpen={isCmdBarOpen} onClose={() => setIsCmdBarOpen(false)} />

            {/* Header section */}
            <header className="h-16 border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="md:hidden p-2 text-ink-muted hover:text-ink hover:bg-sunken rounded-md"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <Link href={route('store.home', { store_slug: store?.slug })} className="flex items-center space-x-2">
                        <span className="font-extrabold text-lg text-brand tracking-tight">
                            {store?.name ?? 'VenQore'}
                        </span>
                    </Link>
                </div>

                {/* Topbar Search and Actions */}
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setIsCmdBarOpen(true)}
                        className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-sunken border border-border text-ink-muted hover:text-ink hover:border-brand/40 rounded-md text-xs transition-colors"
                    >
                        <Search className="h-4 w-4" />
                        <span className="pr-4">Search...</span>
                        <kbd className="bg-app border border-border px-1.5 py-0.5 rounded text-[10px] font-mono">⌘K</kbd>
                    </button>

                    <button 
                        onClick={() => setIsCmdBarOpen(true)}
                        className="sm:hidden p-2 text-ink-muted hover:text-ink hover:bg-sunken rounded-md"
                    >
                        <Search className="h-5 w-5" />
                    </button>

                    <button className="p-2 text-ink-muted hover:text-ink hover:bg-sunken rounded-md relative">
                        <Bell className="h-5 w-5" />
                        {auth?.unread_notifications_count > 0 && (
                            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-danger rounded-full ring-2 ring-surface" />
                        )}
                    </button>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsProfileOpen(prev => !prev)}
                            className="flex items-center space-x-2 p-1.5 hover:bg-sunken rounded-md transition-colors"
                        >
                            <div className="h-8 w-8 bg-brand/10 text-brand font-bold rounded-md flex items-center justify-center text-sm uppercase">
                                {auth?.user?.avatar_initial ?? 'U'}
                            </div>
                        </button>

                        {isProfileOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-xl py-1 z-20">
                                    <div className="px-4 py-2 border-b border-border">
                                        <p className="text-xs text-ink-muted">Signed in as</p>
                                        <p className="text-sm font-semibold truncate text-ink">{auth?.user?.name}</p>
                                    </div>
                                    <Link 
                                        href={route('store.settings', { store_slug: store?.slug })}
                                        className="flex items-center px-4 py-2 text-sm text-ink-muted hover:bg-sunken hover:text-ink transition-colors"
                                    >
                                        <User className="h-4 w-4 mr-2" />
                                        <span>Profile Settings</span>
                                    </Link>
                                    <Link 
                                        href={route('logout')} 
                                        method="post" 
                                        as="button"
                                        className="w-full flex items-center px-4 py-2 text-sm text-danger hover:bg-danger/10 text-left transition-colors"
                                    >
                                        <LogOut className="h-4 w-4 mr-2" />
                                        <span>Sign Out</span>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-surface shrink-0">
                    <Nav activeMenu={activeMenu} />
                </aside>

                {/* Mobile Drawer Sidebar */}
                {isSidebarOpen && (
                    <div className="fixed inset-0 z-40 flex md:hidden">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface border-r border-border">
                            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                                <span className="font-extrabold text-lg text-brand tracking-tight">
                                    {store?.name ?? 'VenQore'}
                                </span>
                                <button 
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 text-ink-muted hover:text-ink hover:bg-sunken rounded-md"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <Nav activeMenu={activeMenu} onMenuSelect={() => setIsSidebarOpen(false)} />
                        </div>
                    </div>
                )}

                {/* Main Content Pane */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
