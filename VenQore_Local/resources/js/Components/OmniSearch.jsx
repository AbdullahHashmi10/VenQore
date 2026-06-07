import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Search, X, Command, ArrowRight, Sparkles, Box, User, FileText,
    ChevronRight, Keyboard, Loader2
} from 'lucide-react';
import { searchRegistry, getCategoryLabel, getCategoryColor, CATEGORIES } from '@/Data/AppRegistry';

/**
 * OmniSearch - Universal Command Palette
 * 
 * Features:
 * - Ctrl+K to open
 * - Search all pages, actions, reports, settings
 * - Database search (products, parties, invoices)
 * - AI-powered analytics (Phase 3)
 * - Midnight Nebula theme
 */
export default function OmniSearch({ onAskAi, isAiLoading = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [dbResults, setDbResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isSearchingDb, setIsSearchingDb] = useState(false);

    const inputRef = useRef(null);
    const containerRef = useRef(null);

    const { auth, store } = usePage().props;
    const userRole = auth.user?.role;
    const userPerms = auth.user?.permissions || [];

    const checkPerm = (required) => {
        if (userRole === 'platform_admin') return true;
        if (!required || required.length === 0) return true;
        return required.some(p => userPerms.includes(p));
    };

    const getRequiredPerms = (item) => {
        // Route-based mapping
        if (item.route?.includes('pos')) return ['pos'];
        if (item.route?.includes('inventory') || item.route?.includes('production')) return ['inventory'];
        if (item.route?.includes('sales')) return ['sales', 'sales_view'];
        if (item.route?.includes('reports') || item.route?.includes('finance')) return ['reports', 'finance'];
        if (item.route?.includes('settings')) return ['settings'];
        if (item.route?.includes('parties') || item.route?.includes('customer')) return ['customers'];

        // Category-based fallback
        if (item.category === 'Inventory') return ['inventory'];
        if (item.category === 'Finance') return ['finance'];
        if (item.category === 'Reports') return ['reports'];

        return [];
    };

    // Keyboard shortcut: Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
                e.preventDefault();
                inputRef.current?.focus();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                if (isOpen) {
                    setIsOpen(false);
                    inputRef.current?.blur();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Search logic
    useEffect(() => {
        if (!query || query.length < 1) {
            setResults([]);
            setDbResults([]);
            return;
        }

        // 1. Search App Registry (instant)
        const appResults = searchRegistry(query);
        const filteredAppResults = appResults.filter(item => checkPerm(getRequiredPerms(item)));
        setResults(filteredAppResults);

        // 2. Search Database (debounced)
        if (query.length >= 2) {
            setIsSearchingDb(true);
            const timeout = setTimeout(() => {
                window.axios.get(route('store.global.search', { store_slug: store?.slug }), { params: { query } })
                    .then(res => {
                        setDbResults(res.data || []);
                    })
                    .catch(() => setDbResults([]))
                    .finally(() => setIsSearchingDb(false));
            }, 300);
            return () => clearTimeout(timeout);
        } else {
            setDbResults([]);
        }
    }, [query]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results, dbResults]);

    // Keyboard navigation
    const handleKeyDown = (e) => {
        const totalItems = results.length + dbResults.length + (query.length > 2 ? 1 : 0); // +1 for AI button

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % totalItems);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + totalItems) % totalItems);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelect(selectedIndex);
        }
    };

    const handleSelect = (index) => {
        // AI button is always first if query > 2
        const aiButtonIndex = query.length > 2 ? 0 : -1;

        if (index === aiButtonIndex && query.length > 2) {
            // Trigger AI
            handleAskAi();
            return;
        }

        const adjustedIndex = query.length > 2 ? index - 1 : index;

        // Check app results first
        if (adjustedIndex < results.length) {
            const item = results[adjustedIndex];
            navigateToItem(item);
        } else {
            // DB results
            const dbIndex = adjustedIndex - results.length;
            if (dbResults[dbIndex]) {
                router.visit(dbResults[dbIndex].url);
                handleClose();
            }
        }
    };

    const navigateToItem = (item) => {
        try {
            // Determine if the route needs the 'store.' prefix and 'store_slug' parameter
            const routeName = item.route.startsWith('store.') ? item.route : `store.${item.route}`;
            const url = route(routeName, { ...item.queryParams, store_slug: store?.slug });
            router.visit(url);
            handleClose();
        } catch (e) {
            // Route might not exist, just close
            console.warn('Route not found:', item.route);
            handleClose();
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setQuery('');
        setResults([]);
        setDbResults([]);
        setSelectedIndex(0);
    };

    const handleAskAi = () => {
        if (onAskAi && query.length > 2) {
            onAskAi(query);
            handleClose();
        }
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                handleClose();
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Inline Search Render
    return (
        <div ref={containerRef} className="relative z-50">
            {/* Inline Input Bar */}
            <div className={`relative flex items-center bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border transition-all rounded-2xl w-80 lg:w-96 ${isOpen ? 'border-slate-300 dark:border-slate-600 shadow-md' : 'border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <div className="pl-4 text-slate-500 dark:text-slate-400">
                    <Search size={16} />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Search anything..."
                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:outline-none text-sm text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 font-medium h-10 px-3"
                    autoComplete="off"
                />

                {query && (
                    <button
                        onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}

                <div className="pr-3 hidden sm:flex pointer-events-none">
                    <kbd className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        <span className="text-xs">⌘</span>
                        <span className="opacity-40">/</span>
                        <span className="text-[9px]">Ctrl</span>
                        <span className="ml-1 text-xs">F</span>
                    </kbd>
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-3 w-[500px] max-h-[80vh] overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-2xl shadow-black/20 dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
                    {/* Header/Gradient Line */}
                    <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-50" />

                    {/* Results Container */}
                    <div className="overflow-y-auto custom-scrollbar">
                        {/* AI Button - Always at top when query > 2 */}
                        {query.length > 2 && (
                            <div className="p-2 border-b border-slate-100 dark:border-slate-800/50">
                                <button
                                    onClick={handleAskAi}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${selectedIndex === 0
                                        ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 shadow-lg shadow-black/20'
                                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/30 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className={`p-2 rounded-lg ${selectedIndex === 0 ? 'bg-white/20' : 'bg-white dark:bg-slate-700 text-indigo-500 dark:text-indigo-400'}`}>
                                        <Sparkles size={16} className={selectedIndex === 0 ? 'text-white' : ''} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className={`text-sm font-bold ${selectedIndex === 0 ? 'text-white' : 'text-slate-800 dark:text-indigo-300'}`}>
                                            Ask AI Assistant
                                        </div>
                                        <div className={`text-[11px] ${selectedIndex === 0 ? 'text-indigo-100' : 'text-slate-500'}`}>
                                            Analyze "{query}"...
                                        </div>
                                    </div>
                                    <div className={`text-[10px] font-medium px-2 py-0.5 rounded ${selectedIndex === 0 ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-indigo-900/50 text-slate-600 dark:text-indigo-400'}`}>
                                        ENTER
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* App Registry Results */}
                        {results.length > 0 && (
                            <div className="p-2">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    Navigation
                                </div>
                                {results.map((item, idx) => {
                                    const actualIndex = (query.length > 2 ? 1 : 0) + idx;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(actualIndex)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all group mb-0.5 ${selectedIndex === actualIndex
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            <div className="flex-shrink-0">
                                                {item.icon ? <item.icon size={16} /> : <Box size={16} />}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="text-sm font-medium">{item.title}</div>
                                                {item.description && (
                                                    <div className={`text-[10px] truncate ${selectedIndex === actualIndex ? 'text-indigo-200' : 'text-slate-500'}`}>
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getCategoryColor(item.category)}`}>
                                                {getCategoryLabel(item.category)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Database Results */}
                        {dbResults.length > 0 && (
                            <div className="p-2 border-t border-slate-100 dark:border-slate-800/30">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    Data
                                    {isSearchingDb && <Loader2 size={10} className="animate-spin" />}
                                </div>
                                {dbResults.map((item, idx) => {
                                    const actualIndex = (query.length > 2 ? 1 : 0) + results.length + idx;
                                    return (
                                        <Link
                                            key={idx}
                                            href={item.url}
                                            onClick={() => setIsOpen(false)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all group mb-0.5 ${selectedIndex === actualIndex
                                                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            <div className={`p-1.5 rounded-md ${item.type === 'Answer'
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                                : 'bg-indigo-50 dark:bg-purple-500/10 text-indigo-600 dark:text-purple-400'
                                                }`}>
                                                {item.type === 'Product' && <Box size={14} />}
                                                {item.type === 'Party' && <User size={14} />}
                                                {item.type === 'Invoice' && <FileText size={14} />}
                                                {item.type === 'Answer' && <Sparkles size={14} />}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="text-sm font-medium">{item.title}</div>
                                                <div className={`text-[10px] ${selectedIndex === actualIndex ? 'text-purple-200' : 'text-slate-500'}`}>
                                                    {item.subtitle}
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-purple-900/30 text-indigo-600 dark:text-purple-400">
                                                {item.type}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {/* Empty State */}
                        {query.length > 2 && results.length === 0 && dbResults.length === 0 && !isSearchingDb && (
                            <div className="p-8 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No results found</p>
                            </div>
                        )}

                        {/* Initial State (Quick Links) */}
                        {query.length === 0 && (
                            <div className="p-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'New Sale', keys: ['N', 'S'], action: () => router.visit(route('store.pos', { store_slug: store?.slug })), perms: ['pos'] },
                                        { label: 'Add Product', keys: ['N', 'P'], action: () => router.visit(route('store.inventory.index', { store_slug: store?.slug })), perms: ['inventory'] },
                                        { label: 'Profit & Loss', keys: ['P', 'L'], action: () => router.visit(route('store.reports.profit-loss', { store_slug: store?.slug })), perms: ['reports', 'finance'] },
                                        { label: 'Settings', keys: ['S', 'T'], action: () => router.visit(route('store.admin.settings', { store_slug: store?.slug })), perms: ['settings'] },
                                    ].filter(link => checkPerm(link.perms)).map((shortcut, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { shortcut.action(); setIsOpen(false); }}
                                            className="flex items-center justify-between p-3 rounded-xl bg-slate-50:50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-700/30 transition-all group"
                                        >
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{shortcut.label}</span>
                                            <div className="flex gap-1">
                                                {shortcut.keys.map((key, i) => (
                                                    <kbd key={i} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[9px] font-bold text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-600">
                                                        {key}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={12} className="text-indigo-500 dark:text-indigo-400" />
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">Quick AI Prompts</span>
                                    </div>
                                    <div className="space-y-1">
                                        {[
                                            "How much profit did we make this week?",
                                            "What's our best selling product?",
                                        ].map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { setQuery(suggestion); inputRef.current?.focus(); }}
                                                className="block w-full text-left text-xs text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 transition-colors py-1 truncate"
                                            >
                                                "{suggestion}"
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                            <span><kbd className="font-sans">↑↓</kbd> navigate</span>
                            <span><kbd className="font-sans">↵</kbd> select</span>
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-600 font-medium">
                            VenQore Intelligence
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
