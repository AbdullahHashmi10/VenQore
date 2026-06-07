import React, { useState, useEffect, useRef, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Search,
    Home,
    ShoppingCart,
    Package,
    Users,
    DollarSign,
    BarChart2,
    Settings,
    FileText,
    Plus,
    CreditCard,
    Truck,
    Calculator,
    Tag,
    ArrowRight,
    Command
} from 'lucide-react';

const CommandPalette = () => {
    const { auth, store } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    const userRole = auth.user?.role;
    const userPerms = auth.user?.permissions || [];

    // Permission Map
    const COMMAND_PERMISSIONS = {
        'pos': ['pos'],
        'inventory': ['inventory'],
        'parties': ['customers'],
        'reports': ['reports'],
        'settings': ['settings'],
        'new-sale': ['sales'],
        'new-purchase': ['purchases'],
        'new-product': ['inventory'],
        'new-customer': ['customers'],
        'new-expense': ['finance'],
        'payment-in': ['finance'],
        'payment-out': ['finance'],
        'report-sales': ['reports'],
        'report-purchases': ['reports'],
        'report-pnl': ['reports'],
        'report-stock': ['reports'],
        'report-daybook': ['reports'],
        'stock-levels': ['inventory'],
        'categories': ['inventory'],
        'production': ['inventory']
    };

    // All available commands
    const rawCommands = [
        // Navigation
        { id: 'home', name: 'Go to Home', keywords: 'home dashboard', icon: Home, action: () => router.visit(route('store.home', { store_slug: store?.slug })), category: 'Navigation' },
        { id: 'pos', name: 'Open POS', keywords: 'pos sell cashier', icon: ShoppingCart, action: () => router.visit(route('store.pos', { store_slug: store?.slug })), category: 'Navigation' },
        { id: 'inventory', name: 'Inventory Dashboard', keywords: 'inventory products stock items', icon: Package, action: () => router.visit(route('store.inventory.dashboard', { store_slug: store?.slug })), category: 'Navigation' },
        { id: 'parties', name: 'Parties / Contacts', keywords: 'parties customers suppliers contacts', icon: Users, action: () => router.visit(route('store.parties.index', { store_slug: store?.slug })), category: 'Navigation' },
        { id: 'reports', name: 'Reports', keywords: 'reports analytics insights', icon: BarChart2, action: () => router.visit(route('store.reports.index', { store_slug: store?.slug })), category: 'Navigation' },
        { id: 'settings', name: 'Settings', keywords: 'settings preferences config', icon: Settings, action: () => router.visit(route('store.settings', { store_slug: store?.slug })), category: 'Navigation' },

        // Quick Actions
        { id: 'new-sale', name: 'New Sale Invoice', keywords: 'new sale invoice create', icon: Plus, action: () => router.visit(route('store.sales.create', { store_slug: store?.slug })), category: 'Quick Actions' },
        { id: 'new-purchase', name: 'New Purchase', keywords: 'new purchase buy', icon: Truck, action: () => router.visit(route('store.purchases.create', { store_slug: store?.slug })), category: 'Quick Actions' },
        { id: 'new-product', name: 'Add Product', keywords: 'new product item add create', icon: Package, action: () => router.visit(route('store.inventory.dashboard', { store_slug: store?.slug }) + '?action=add'), category: 'Quick Actions' },
        { id: 'new-customer', name: 'Add Customer', keywords: 'new customer party add create', icon: Users, action: () => router.visit(route('store.parties.index', { store_slug: store?.slug }) + '?action=add&type=customer'), category: 'Quick Actions' },
        { id: 'new-expense', name: 'Add Expense', keywords: 'new expense add create', icon: CreditCard, action: () => router.visit(route('store.expenses.index', { store_slug: store?.slug }) + '?action=add'), category: 'Quick Actions' },
        { id: 'payment-in', name: 'Record Payment In', keywords: 'payment receive in money', icon: DollarSign, action: () => router.visit(route('store.payment-in.create', { store_slug: store?.slug })), category: 'Quick Actions' },
        { id: 'payment-out', name: 'Record Payment Out', keywords: 'payment out pay money', icon: DollarSign, action: () => router.visit(route('store.payment-out.create', { store_slug: store?.slug })), category: 'Quick Actions' },

        // Reports
        { id: 'report-sales', name: 'Sales Report', keywords: 'report sales revenue', icon: FileText, action: () => router.visit(route('store.reports.sales', { store_slug: store?.slug })), category: 'Reports' },
        { id: 'report-purchases', name: 'Purchases Report', keywords: 'report purchases buying', icon: FileText, action: () => router.visit(route('store.reports.purchases', { store_slug: store?.slug })), category: 'Reports' },
        { id: 'report-pnl', name: 'Profit & Loss', keywords: 'report profit loss pnl', icon: Calculator, action: () => router.visit(route('store.reports.profit-loss', { store_slug: store?.slug })), category: 'Reports' },
        { id: 'report-stock', name: 'Stock Valuation', keywords: 'report stock valuation inventory', icon: Tag, action: () => router.visit(route('store.reports.inventory-valuation', { store_slug: store?.slug })), category: 'Reports' },
        { id: 'report-daybook', name: 'Day Book', keywords: 'report daybook daily', icon: FileText, action: () => router.visit(route('store.reports.trial-balance', { store_slug: store?.slug })), category: 'Reports' },

        // Inventory
        { id: 'stock-levels', name: 'Stock Levels', keywords: 'stock levels quantity low', icon: Package, action: () => router.visit(route('store.inventory.dashboard', { store_slug: store?.slug })), category: 'Inventory' },
        { id: 'categories', name: 'Categories', keywords: 'categories organize', icon: Tag, action: () => router.visit(route('store.inventory.dashboard', { store_slug: store?.slug })), category: 'Inventory' },
        { id: 'production', name: 'Production / Manufacturing', keywords: 'production manufacturing make', icon: Settings, action: () => router.visit(route('store.production.index', { store_slug: store?.slug })), category: 'Inventory' },
    ];

    const commands = rawCommands.filter(cmd => {
        if (userRole === 'platform_admin') return true;
        const required = COMMAND_PERMISSIONS[cmd.id];
        if (!required || required.length === 0) return true;
        return required.some(p => userPerms.includes(p));
    });

    // Filter commands based on query
    const filteredCommands = query.trim() === ''
        ? commands
        : commands.filter(cmd =>
            cmd.name.toLowerCase().includes(query.toLowerCase()) ||
            cmd.keywords.toLowerCase().includes(query.toLowerCase())
        );

    // Group by category
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {});

    // Flatten for keyboard navigation
    const flatCommands = filteredCommands;

    // Keyboard shortcut to open
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+K or Cmd+K
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }

            // Escape to close
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Keyboard navigation within palette
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, flatCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && flatCommands[selectedIndex]) {
            e.preventDefault();
            executeCommand(flatCommands[selectedIndex]);
        }
    }, [flatCommands, selectedIndex]);

    const executeCommand = (cmd) => {
        setIsOpen(false);
        cmd.action();
    };

    // Auto-scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
                onClick={() => setIsOpen(false)}
            />

            {/* Palette */}
            <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[201] animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <Search size={20} className="text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a command or search..."
                            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white text-lg placeholder-slate-400"
                        />
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">esc</kbd>
                            <span>to close</span>
                        </div>
                    </div>

                    {/* Results */}
                    <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
                        {Object.keys(groupedCommands).length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                <p className="font-medium">No commands found</p>
                                <p className="text-sm">Try a different search term</p>
                            </div>
                        ) : (
                            Object.entries(groupedCommands).map(([category, cmds]) => (
                                <div key={category} className="mb-3">
                                    <p className="px-3 py-1.5 text-xs font-bold uppercase text-slate-400 tracking-wider">
                                        {category}
                                    </p>
                                    {cmds.map((cmd, idx) => {
                                        const globalIdx = flatCommands.findIndex(c => c.id === cmd.id);
                                        const isSelected = globalIdx === selectedIndex;

                                        return (
                                            <button
                                                key={cmd.id}
                                                data-index={globalIdx}
                                                onClick={() => executeCommand(cmd)}
                                                onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                                                    ${isSelected
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }
                                                `}
                                            >
                                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-100 dark:bg-indigo-800/50' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                    <cmd.icon size={16} />
                                                </div>
                                                <span className="flex-1 font-medium">{cmd.name}</span>
                                                {isSelected && (
                                                    <ArrowRight size={16} className="text-indigo-500" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">↑</kbd>
                                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">↓</kbd>
                                <span>to navigate</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">↵</kbd>
                                <span>to select</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Command size={12} />
                            <span>Command Palette</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CommandPalette;
