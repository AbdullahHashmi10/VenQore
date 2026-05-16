import React, { useState, useRef, useEffect } from 'react';
import { usePage, Link, router } from '@inertiajs/react';
import {
    Sparkles, X, Send, Loader2, ArrowRight, Minimize2,
    ExternalLink, TrendingUp, Package, DollarSign, Users,
    ChevronDown, MessageSquare
} from 'lucide-react';

/**
 * AI Assistant Modal - Full-screen centered AI chat experience
 * 
 * Features:
 * - Midnight Nebula theme
 * - Persistent conversation across pages (via sessionStorage)
 * - Minimizes to floating bubble
 * - Suggested questions
 * - Action buttons in responses
 */
export default function AiAssistantModal({
    isOpen,
    onClose,
    onMinimize,
    initialQuery = '',
    settings = {},
    store: propStore = null
}) {
    const { store: pageStore } = usePage().props;
    const activeStore = propStore || pageStore;
    const [query, setQuery] = useState(initialQuery);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Load persisted messages from sessionStorage
    useEffect(() => {
        const saved = sessionStorage.getItem('amd_ai_messages');
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) { }
        }
    }, []);

    // Save messages to sessionStorage
    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem('amd_ai_messages', JSON.stringify(messages));
        }
    }, [messages]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle initial query
    useEffect(() => {
        if (isOpen && initialQuery) {
            setQuery(initialQuery);
            handleSend(initialQuery);
        }
    }, [isOpen, initialQuery]);

    const handleSend = async (customQuery = null) => {
        const q = customQuery || query;
        if (!q.trim() || isLoading) return;

        // Add user message
        const userMessage = { role: 'user', content: q };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setIsLoading(true);

        try {
            console.log('AI Assistant Query:', q, 'Store:', activeStore?.slug);
            const res = await window.axios.get(route('store.ai.query', { store_slug: activeStore?.slug }), { params: { query: q } });
            const aiMessage = {
                role: 'assistant',
                content: res.data.answer,
                relatedLinks: getRelatedLinks(q)
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err) {
            const errorMessage = {
                role: 'assistant',
                content: err.response?.data?.message || err.response?.data?.error || "Sorry, I couldn't process that request. (" + (err.message) + ")",
                isError: true
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Icon map for related links (to survive JSON serialization)
    const iconMap = {
        TrendingUp,
        DollarSign,
        Package,
        Users
    };

    // Get related navigation links based on query
    const getRelatedLinks = (q) => {
        const lower = q.toLowerCase();
        const links = [];

        if (lower.includes('profit') || lower.includes('loss') || lower.includes('margin')) {
            links.push({ label: 'View P&L Report', route: 'store.reports.profit-loss', iconName: 'TrendingUp' });
        }
        if (lower.includes('sales') || lower.includes('revenue') || lower.includes('sold')) {
            links.push({ label: 'Sales Dashboard', route: 'store.sales.dashboard', iconName: 'DollarSign' });
        }
        if (lower.includes('stock') || lower.includes('inventory') || lower.includes('product')) {
            links.push({ label: 'Inventory', route: 'store.inventory.dashboard', iconName: 'Package' });
        }
        if (lower.includes('expense') || lower.includes('cost') || lower.includes('spending')) {
            links.push({ label: 'Expenses', route: 'expenses.index', iconName: 'DollarSign' });
        }
        if (lower.includes('customer') || lower.includes('party') || lower.includes('supplier') || lower.includes('owe')) {
            links.push({ label: 'Parties', route: 'store.parties.index', iconName: 'Users' });
        }

        return links.slice(0, 3); // Max 3 links
    };

    const handleClearHistory = () => {
        setMessages([]);
        sessionStorage.removeItem('amd_ai_messages');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const suggestedQuestions = [
        "How much profit did we make this week?",
        "What are our best selling products?",
        "Show me today's sales summary",
        "What's our current stock level for milk?",
        "How much did we spend on expenses this month?"
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop - Midnight Nebula */}
            <div
                className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/95 to-slate-950 backdrop-blur-xl"
                onClick={onClose}
            >
                {/* Nebula effects */}
                <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-purple-600/15 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[80px]" />
            </div>

            {/* Chat Container */}
            <div className="relative w-full max-w-3xl h-[80vh] flex flex-col bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800/50 bg-gradient-to-r from-indigo-900/30 to-purple-900/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/25">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">VenQore AI Assistant</h2>
                            <p className="text-sm text-slate-400">Ask anything about your business</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {messages.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Clear History
                            </button>
                        )}
                        <button
                            onClick={onMinimize}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                            title="Minimize"
                        >
                            <Minimize2 size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                            title="Close"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                                <Sparkles size={32} className="text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">How can I help you today?</h3>
                            <p className="text-slate-400 text-sm mb-8 max-w-md">
                                Ask me about your sales, profits, stock levels, expenses, or any business data.
                            </p>

                            {/* Suggested Questions */}
                            <div className="w-full max-w-lg space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Try asking</p>
                                {suggestedQuestions.slice(0, 4).map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(q)}
                                        className="w-full text-left p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-indigo-500/30 text-slate-300 hover:text-white transition-all text-sm"
                                    >
                                        "{q}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-md'
                                        : msg.isError
                                            ? 'bg-red-900/30 text-red-300 border border-red-800/50 rounded-2xl rounded-tl-md'
                                            : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-md'
                                        } p-4`}>
                                        {msg.role === 'assistant' && !msg.isError && (
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/30">
                                                <Sparkles size={14} className="text-indigo-400" />
                                                <span className="text-xs font-bold text-indigo-400">AI Insight</span>
                                            </div>
                                        )}
                                        <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>

                                        {/* Related Links */}
                                        {msg.relatedLinks && msg.relatedLinks.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-slate-700/30 flex flex-wrap gap-2">
                                                {msg.relatedLinks.map((link, linkIdx) => {
                                                    const IconComponent = iconMap[link.iconName];
                                                    return (
                                                        <Link
                                                            key={linkIdx}
                                                            href={route(link.route, { store_slug: activeStore?.slug })}
                                                            onClick={onMinimize}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium transition-colors"
                                                        >
                                                            {IconComponent && <IconComponent size={12} />}
                                                            {link.label}
                                                            <ExternalLink size={10} />
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-2xl rounded-tl-md p-4">
                                        <div className="flex items-center gap-3">
                                            <Loader2 size={16} className="animate-spin text-indigo-400" />
                                            <span className="text-sm text-slate-400">Analyzing your data...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-5 border-t border-slate-800/50 bg-slate-900/50">
                    <div className="flex items-center gap-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-2 focus-within:border-indigo-500/50 transition-colors">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about sales, profits, stock, expenses..."
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 px-3 py-2"
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!query.trim() || isLoading}
                            className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-600 mt-3">
                        Powered by {settings?.ai_provider === 'openai' ? 'OpenAI GPT' : 'Google Gemini'} • Your data stays private
                    </p>
                </div>
            </div>
        </div>
    );
}
