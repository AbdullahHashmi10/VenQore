import React, { useState } from 'react';
import MarketingLayout from '../Shared/MarketingLayout';
import { Head, Link, router } from '@inertiajs/react';
import {
    Search, ChevronRight, Menu, X, ArrowRight, FileText, Info, HelpCircle as FaqIcon
} from 'lucide-react';

function DocFAQItem({ qa, index }) {
    const [isOpen, setIsOpen] = useState(false);
    const panelId = `faq-${qa.slug}-${index}-answer`;

    return (
        <div
            id={`faq-${qa.slug}-${index}`}
            itemScope
            itemType="https://schema.org/Question"
            className={`vq-faq__item ${isOpen ? 'is-open' : ''}`}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="vq-faq__q"
                aria-expanded={isOpen}
                aria-controls={panelId}
                style={{ fontSize: '19px', lineHeight: 1.35 }}
            >
                <span itemProp="name">{qa.question}</span>
                <span className="vq-faq__sign" aria-hidden="true" />
            </button>

            <div className="vq-faq__a" id={panelId}>
                <div>
                    <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer" style={{ paddingBottom: 'var(--vq-space-6)' }}>
                        <div
                            itemProp="text"
                            className="vq-read vq-read--raw vq-read--sm"
                            dangerouslySetInnerHTML={{ __html: qa.answer_html }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

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

    const docTitle = currentDoc?.title
        ? `${currentDoc.title} — VenQore Documentation`
        : 'Documentation — VenQore';
    const docDescription = currentDoc?.description
        || 'Guides and how-tos for VenQore — setting up your system, the point of sale, inventory, purchasing, documents and the double-entry ledger behind them.';

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: currentDoc?.title || 'VenQore Documentation',
        description: docDescription,
        publisher: {
            '@type': 'Organization',
            name: 'VenQore',
            url: 'https://venqore.com'
        }
    };

    const pageTitle = searchQuery
        ? <>Search results for &ldquo;{searchQuery}&rdquo;</>
        : (currentDoc?.title || 'Knowledge Base & Help Center');
    const pageLede = !searchQuery && currentDoc?.description
        ? currentDoc.description
        : 'Everything you need to know about setting up your retail operating system, hardware integration, inventory management, and profit analytics.';

    return (
        <MarketingLayout title={docTitle} description={docDescription}>
            <Head>
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Head>

            {/* ── Page head ─────────────────────────────────────── */}
            <section className="vq-section vq-mc-top vq-mc-top--flush">
                <div className="vq-container">
                    <div className="vq-mc-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">
                            Documentation{currentDoc?.category ? ` · ${currentDoc.category}` : ''}
                        </span>
                        <h1 className="vq-h1 vq-mt-4">{pageTitle}</h1>
                        <p className="vq-lede vq-mt-5">{pageLede}</p>
                    </div>
                </div>
            </section>

            <section className="vq-section vq-mc-body" style={{ paddingTop: 'var(--vq-space-8)' }}>
                <div className="vq-container">
                    <div className="vq-mc-doc" style={{ borderTop: '1px solid var(--vq-line)', paddingTop: 'var(--vq-space-10)' }}>
                        {/* ── LEFT RAIL: search + navigation ─────────── */}
                        <aside className="vq-mc-rail" data-open={mobileSidebarOpen ? 'true' : 'false'}>
                            <form onSubmit={handleSearchSubmit} className="vq-mc-search" role="search">
                                <Search size={18} aria-hidden="true" />
                                <label htmlFor="docs-search" className="vq-sr">Search Q&amp;A and docs</label>
                                <input
                                    id="docs-search"
                                    type="text"
                                    className="vq-input"
                                    placeholder="Search Q&amp;A / docs…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    style={{ paddingRight: search ? '64px' : undefined }}
                                />
                                {search && (
                                    <button type="button" onClick={clearSearch} className="vq-mc-search__clear">
                                        Clear
                                    </button>
                                )}
                            </form>

                            <button
                                type="button"
                                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                                className="vq-card vq-card--flat vq-mc-railtoggle vq-mt-4"
                                aria-expanded={mobileSidebarOpen}
                            >
                                <span className="vq-row vq-gap-3">
                                    <FileText size={18} aria-hidden="true" style={{ color: 'var(--vq-accent-text)' }} />
                                    {currentDoc.title || 'Table of Contents'}
                                </span>
                                {mobileSidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
                                <span className="vq-sr">{mobileSidebarOpen ? 'Close' : 'Open'} documentation menu</span>
                            </button>

                            <nav className="vq-mc-rail__nav vq-mt-8" aria-label="Documentation">
                                {Object.keys(navigation).map((category, idx) => (
                                    <div key={idx} className="vq-mc-rail__group">
                                        <span className="vq-eyebrow vq-mc-rail__label">{category}</span>
                                        {navigation[category].map((item, keyIdx) => (
                                            <Link
                                                key={keyIdx}
                                                href={`/docs/${item.slug}`}
                                                onClick={() => setMobileSidebarOpen(false)}
                                                className={`vq-mc-rail__link ${item.active ? 'is-active' : ''}`}
                                                aria-current={item.active ? 'page' : undefined}
                                            >
                                                <span>{item.title}</span>
                                                <ChevronRight size={14} aria-hidden="true" style={{ flex: 'none', opacity: item.active ? 1 : 0.45 }} />
                                            </Link>
                                        ))}
                                    </div>
                                ))}
                            </nav>
                        </aside>

                        {/* ── CONTENT ─────────────────────────────────── */}
                        <div style={{ minWidth: 0 }}>
                            {/* SEARCH RESULTS VIEW */}
                            {searchQuery && (
                                <div>
                                    <div className="vq-mc-rowhead" style={{ marginBottom: 'var(--vq-space-6)' }}>
                                        <h2 className="vq-h3">Matching questions</h2>
                                        <span className="vq-badge vq-badge--accent">
                                            {searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'}
                                        </span>
                                    </div>

                                    {searchResults.length > 0 ? (
                                        <div className="vq-stack vq-gap-4">
                                            {searchResults.map((qa, i) => (
                                                <div key={i} id={`search-result-${i}`} className="vq-card" style={{ padding: 'var(--vq-space-8)' }}>
                                                    <div className="vq-mc-meta">
                                                        <span className="vq-badge vq-badge--accent">{qa.category}</span>
                                                        <span className="vq-mc-meta__item">Found in &ldquo;{qa.slug}&rdquo;</span>
                                                    </div>
                                                    <h3 className="vq-h3 vq-mt-4" style={{ fontSize: '20px' }}>{qa.question}</h3>
                                                    <div
                                                        className="vq-read vq-read--raw vq-read--sm vq-mt-3"
                                                        dangerouslySetInnerHTML={{ __html: qa.answer_html }}
                                                    />
                                                    <div className="vq-mc-lcard__foot" style={{ justifyContent: 'flex-end', marginTop: 'var(--vq-space-6)' }}>
                                                        <Link href={`/docs/${qa.slug}`} className="vq-link">
                                                            Go to full guide <ArrowRight size={16} aria-hidden="true" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="vq-card vq-mc-empty">
                                            <Info size={32} aria-hidden="true" />
                                            <h3 className="vq-h3 vq-mt-4">No Q&amp;A matches found</h3>
                                            <p className="vq-body vq-text-2 vq-mt-2" style={{ marginInline: 'auto' }}>Try searching different keywords like "POS", "printer", "WooCommerce", or "FBR".</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MAIN DOCUMENT TEXT VIEW */}
                            {!searchQuery && (
                                <article>
                                    {/* Server-compiled HTML body (SimpleMarkdownParser result) */}
                                    <div
                                        className="vq-read vq-read--raw"
                                        dangerouslySetInnerHTML={{ __html: currentDoc.body_html }}
                                    />

                                    {/* Q&A blocks for AI crawlers and users */}
                                    {currentDoc.qas && currentDoc.qas.length > 0 && (
                                        <div style={{ marginTop: 'var(--vq-space-16)', maxWidth: '72ch' }}>
                                            <span className="vq-eyebrow vq-eyebrow--accent">
                                                <FaqIcon size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px', marginRight: 8 }} />
                                                Quick answers
                                            </span>
                                            <h2 className="vq-h2 vq-mt-3" style={{ marginBottom: 'var(--vq-space-6)' }}>
                                                Related Questions &amp; Answers
                                            </h2>
                                            <div className="vq-faq">
                                                {currentDoc.qas.map((qa, i) => (
                                                    <DocFAQItem key={i} qa={qa} index={i} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </article>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
