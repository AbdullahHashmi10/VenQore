import React, { useState, useEffect, useRef } from 'react';
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
    Sparkles,
    Briefcase
} from 'lucide-react';

export default function CommandBar({ isOpen, onClose }) {
    const { props } = usePage();
    const store = props.store;
    const features = props.plan?.features ?? {};
    const userRole = props.auth?.user?.role;
    const userPerms = props.auth?.user?.permissions ?? [];

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Close on escape, navigate on enter
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    const baseActions = [
        { id: 'home', name: 'Go to Home', category: 'Navigation', icon: Home, route: 'store.home' },
        { id: 'dashboard', name: 'Go to Dashboard', category: 'Navigation', icon: BarChart2, route: 'store.dashboard' },
        { id: 'pos', name: 'Open POS Terminal', category: 'Quick Actions', icon: ShoppingCart, route: 'store.pos', perm: 'pos' },
        { id: 'new-invoice', name: 'Create Sale Invoice', category: 'Quick Actions', icon: Plus, route: 'store.sales.create', perm: 'sales.create' },
        { id: 'new-expense', name: 'Record Expense', category: 'Quick Actions', icon: CreditCard, route: 'store.expenses.index', perm: 'expenses.create' },
        { id: 'new-job', name: 'Create Work Job Card', category: 'Quick Actions', icon: Briefcase, route: 'store.jobs.create', feature: 'work_orders' }
    ];

    const filtered = baseActions.filter(action => {
        if (action.perm && !userPerms.includes(action.perm)) return false;
        if (action.feature && !features[action.feature]) return false;
        if (query.trim() === '') return true;
        return action.name.toLowerCase().includes(query.toLowerCase());
    });

    const handleSelect = (action) => {
        if (action.route) {
            router.visit(route(action.route, { store_slug: store?.slug }));
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[selectedIndex]) {
                handleSelect(filtered[selectedIndex]);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-900/60 backdrop-blur-sm">
            <div 
                ref={containerRef}
                className="w-full max-w-xl bg-surface rounded-lg shadow-2xl border border-border overflow-hidden"
                onKeyDown={handleKeyDown}
            >
                <div className="flex items-center px-4 border-b border-border">
                    <Search className="h-5 w-5 text-ink-muted mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search actions or ask Vena Assist..."
                        className="w-full py-4 bg-transparent text-ink placeholder-ink-muted focus:outline-none text-sm"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                    {filtered.length > 0 ? (
                        filtered.map((action, index) => (
                            <button
                                key={action.id}
                                onClick={() => handleSelect(action)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors ${
                                    index === selectedIndex
                                        ? 'bg-brand/10 text-brand'
                                        : 'hover:bg-sunken text-ink'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <action.icon className="h-4 w-4 text-ink-muted" />
                                    <span className="text-sm font-medium">{action.name}</span>
                                </div>
                                <span className="text-xs text-ink-muted">{action.category}</span>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center space-y-3">
                            <p className="text-sm text-ink-muted">No actions found matching "{query}"</p>
                            {features.ai_assistant && (
                                <button 
                                    onClick={() => {
                                        window.dispatchEvent(new CustomEvent('amd:open-vena-assistant', { detail: { query } }));
                                        onClose();
                                    }}
                                    className="inline-flex items-center space-x-2 px-3 py-1.5 bg-brand text-white rounded-md text-xs font-semibold hover:bg-brand-hover transition-colors"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    <span>Ask Vena Assistant</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
