import React, { useState } from 'react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel, GlassCard
} from '../Shared/MarketingLayout';
import { Link, router } from '@inertiajs/react';
import {
    Search, BookOpen, ChevronRight, Menu, X, ArrowRight, HelpCircle,
    FileText, Zap, Compass, Info, CheckCircle2, ShieldCheck, HelpCircle as FaqIcon
} from 'lucide-react';

export default function DocsShow({
    navigation = {},
    currentDoc = {},
    searchQuery = '',
    searchResults = []
}) {
    const [search, setSearch] = useState(searchQuery || '');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (search.trim()) {
            router.get('/docs', { search: search.trim() });
        } else {
            router.get('/docs');
        }
    };

    const clearSearch = () => {
        setSearch('');
        router.get('/docs');
    };

    return (
        <MarketingLayout>
            <div className="min-h-screen bg-void-950 text-slate-500 dark:text-slate-400 font-sans relative overflow-hidden pt-24 pb-20">
                {/* Background glow effects */}
                <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.02] blur-[150px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] rounded-full bg-purple-500/[0.02] blur-[180px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    {/* Header Banner */}
                    <div className="mb-10 text-center md:text-left border-b border-slate-900/[0.08] dark:border-white/[0.06] pb-8">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-3xs font-black tracking-widest uppercase mb-4">
                            <BookOpen size={10} /> Documentation Hub
                        </span>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-display">
                            Knowledge Base &amp; Help Center
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 max-w-2xl">
                            Everything you need to know about setting up your retail operating system, hardware integration, inventory management, and profit analytics.
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Mobile Sidebar Toggle */}
                        <div className="lg:hidden w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/[0.02] dark:bg-white/[0.02] border border-slate-900/[0.08] dark:border-white/[0.06] mb-4">
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                                {currentDoc.title || 'Table of Contents'}
                            </span>
                            <button
                                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                                className="w-10 h-10 rounded-xl bg-slate-900/[0.03] dark:bg-white/[0.04] border border-slate-900/[0.08] dark:border-white/[0.08] flex items-center justify-center text-slate-900 dark:text-white"
                            >
                                {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        </div>

                        {/* LEFT SIDEBAR NAVIGATION */}
                        <aside className={`
                            w-full lg:w-72 flex-shrink-0 bg-void-950 lg:bg-transparent lg:block
                            ${mobileSidebarOpen ? 'block' : 'hidden'}
                            z-40 rounded-3xl border border-slate-900/[0.08] dark:border-white/[0.06] lg:border-none p-6 lg:p-0 mb-6 lg:mb-0
                        `}>
                            {/* Search Form */}
                            <form onSubmit={handleSearchSubmit} className="mb-6 relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search Q&amp;A / docs..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-10 py-3 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-900/[0.10] dark:border-white/[0.08] text-slate-900 dark:text-white text-xs font-medium focus:border-indigo-500/50 dark:focus:bg-white/[0.04] focus:ring-0 transition-all placeholder:text-slate-600"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:hover:text-white text-2xs"
                                    >
                                        Clear
                                    </button>
                                )}
                            </form>

                            {/* Sidebar Links group */}
                            <div className="space-y-6">
                                {Object.keys(navigation).map((category, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-2">
                                            {category}
                                        </h4>
                                        <div className="space-y-1">
                                            {navigation[category].map((item, keyIdx) => (
                                                <Link
                                                    key={keyIdx}
                                                    href={`/docs/${item.slug}`}
                                                    onClick={() => setMobileSidebarOpen(false)}
                                                    className={`
                                                        w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200
                                                        ${item.active 
                                                            ? 'bg-indigo-500/10 text-indigo-600 border-l-2 border-indigo-500 pl-4' 
                                                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-900/[0.03] dark:hover:bg-white/[0.03] hover:text-slate-900 dark:hover:text-white border-l-2 border-transparent'
                                                        }
                                                    `}
                                                >
                                                    <span className="truncate">{item.title}</span>
                                                    <ChevronRight size={12} className={`opacity-40 ${item.active ? 'opacity-100 text-indigo-400' : ''}`} />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>

                        {/* CONTENT PANEL */}
                        <main className="flex-1 w-full min-w-0">
                            {/* SEARCH RESULTS VIEW */}
                            {searchQuery && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-900/[0.08] dark:border-white/[0.06] pb-4">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            Search Results for &ldquo;{searchQuery}&rdquo;
                                        </h2>
                                        <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-2xs font-bold">
                                            {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
                                        </span>
                                    </div>

                                    {searchResults.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {searchResults.map((qa, i) => (
                                                <div 
                                                    key={i} 
                                                    id={`search-result-${i}`}
                                                    className="p-6 rounded-2xl border border-slate-900/[0.08] dark:border-white/[0.06] bg-slate-900/[0.02] dark:bg-white/[0.02] hover:border-indigo-500/30 transition-all"
                                                >
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-black uppercase">
                                                            {qa.category}
                                                        </span>
                                                        <span className="text-[10px] text-slate-600 font-bold">
                                                            Found in &ldquo;{qa.slug}&rdquo;
                                                        </span>
                                                    </div>
                                                    <h3 className="text-slate-900 dark:text-white font-bold text-sm tracking-tight mb-2 flex items-start gap-1.5">
                                                        <HelpCircle size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                                        <span>{qa.question}</span>
                                                    </h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed pl-5">
                                                        {qa.answer}
                                                    </p>
                                                    <div className="mt-4 pt-3 border-t border-slate-900/[0.06] dark:border-white/[0.04] flex justify-end">
                                                        <Link 
                                                            href={`/docs/${qa.slug}`}
                                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-300 text-2xs font-black uppercase tracking-wider flex items-center gap-1"
                                                        >
                                                            Go to full guide <ArrowRight size={12} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-900/[0.10] dark:border-white/[0.08] bg-slate-900/[0.01] dark:bg-white/[0.01]">
                                            <Info size={36} className="mx-auto text-slate-600 mb-3" />
                                            <h3 className="text-slate-900 dark:text-white font-bold text-sm">No Q&amp;A matches found</h3>
                                            <p className="text-slate-600 text-xs mt-1">Try searching different keywords like "POS", "printer", "WooCommerce", or "FBR".</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MAIN DOCUMENT TEXT VIEW */}
                            {!searchQuery && (
                                <RevealOnScroll>
                                    <div className="p-8 md:p-10 rounded-[2rem] border border-slate-900/[0.08] dark:border-white/[0.06] bg-slate-900/[0.015] dark:bg-white/[0.01] backdrop-blur-md relative">
                                        {/* Top dynamic layout header */}
                                        <div className="flex flex-wrap items-center gap-2 mb-4 border-b border-slate-900/[0.08] dark:border-white/[0.06] pb-6">
                                            <span className="text-3xs bg-slate-900/[0.03] dark:bg-white/5 border border-slate-900/[0.08] dark:border-white/10 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest font-black">
                                                {currentDoc.category}
                                            </span>
                                            {currentDoc.description && (
                                                <p className="text-slate-500 text-xs font-semibold w-full mt-2">
                                                    {currentDoc.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Server-compiled HTML body (SimpleMarkdownParser result) */}
                                        <div 
                                            className="vq-docs-content space-y-6 text-slate-500 dark:text-slate-400"
                                            dangerouslySetInnerHTML={{ __html: currentDoc.body_html }}
                                        />

                                        {/* STYLED SMALL Q&A BLOCKS FOR AI CRAWLERS AND USERS */}
                                        {currentDoc.qas && currentDoc.qas.length > 0 && (
                                            <div className="mt-12 pt-10 border-t border-slate-900/[0.08] dark:border-white/[0.06]">
                                                <div className="flex items-center gap-2 mb-6">
                                                    <FaqIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
                                                    <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-display">
                                                        Related Questions &amp; Answers
                                                    </h2>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    {currentDoc.qas.map((qa, i) => (
                                                        <div 
                                                            key={i} 
                                                            id={`faq-${currentDoc.slug}-${i}`}
                                                            itemScope 
                                                            itemType="https://schema.org/Question" 
                                                            className="p-5 rounded-2xl border border-slate-900/[0.06] dark:border-white/[0.04] bg-slate-900/[0.015] dark:bg-white/[0.01] hover:bg-white/[0.02] transition-all"
                                                        >
                                                            <h3 itemprop="name" className="text-slate-900 dark:text-white font-bold text-xs tracking-tight mb-2 flex items-start gap-2">
                                                                <span className="text-indigo-600 dark:text-indigo-400 text-3xs font-black uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded">Q</span>
                                                                <span>{qa.question}</span>
                                                            </h3>
                                                            <div itemprop="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                                                                <p itemprop="text" className="text-slate-500 dark:text-slate-400 text-3xs leading-relaxed pl-6">
                                                                    <strong>A:</strong> {qa.answer}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </RevealOnScroll>
                            )}
                        </main>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
