import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, LifeBuoy, Search } from 'lucide-react';
import MarketingLayout, { RevealOnScroll, SectionLabel } from '@/Pages/Marketing/Shared/MarketingLayout';

/**
 * Help Centre index — a public page, so it wears the public shell.
 *
 * What changed, and why:
 *   · It now renders inside MarketingLayout. It did not before, which meant a
 *     visitor who landed here from search had no header, no footer and no route
 *     back to the site — a dead end on one of the few pages people arrive at
 *     cold.
 *   · The forced near-black ground and the true-neutral ramp are gone. The page
 *     takes `bg-app` / `text-ink` from the layout and reads correctly in both
 *     themes (DESIGN-RULES §4, §15).
 *   · Every colour is now a role: surfaces, ink, line, and the mode-aware accent
 *     forms. Nothing here names a pigment.
 *
 * The removed class names are described rather than quoted: Tailwind scans raw
 * file text, so a class written in a comment is a class that gets built again.
 *
 * Props, routes and copy are untouched — same `/help` GET with `q`, same
 * article links, same strings.
 */
export default function Index({ articles = [], query: initialQuery }) {
    const [search, setSearch] = useState(initialQuery || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/help', { q: search }, { preserveState: true });
    };

    return (
        <MarketingLayout
            title="Help Centre — VenQore POS"
            description="Search knowledge base articles for setup, POS hardware, inventory, accounting and plan limits."
        >
            <section className="vq-section vq-mc-top">
                <div className="vq-container">
                    <div className="vq-mc-head">
                        <SectionLabel icon={LifeBuoy} text="Help centre" />
                        <h1 className="vq-h1">VenQore Help Centre</h1>
                        <p className="vq-lede vq-mt-5">
                            Search knowledge base articles for setup, POS hardware, inventory, accounting and plan limits.
                        </p>

                        <form onSubmit={handleSearch} className="vq-mc-searchrow vq-mt-8" role="search" style={{ maxWidth: '600px' }}>
                            <div className="vq-mc-search">
                                <Search size={18} aria-hidden="true" />
                                <label htmlFor="help-search" className="vq-sr">Search articles</label>
                                <input
                                    id="help-search"
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search articles (e.g. barcode printer, stock transfer, plan limits)..."
                                    className="vq-input"
                                    style={{ fontSize: 'var(--vq-fs-body)' }}
                                />
                            </div>
                            <button type="submit" className="vq-btn vq-btn--primary vq-btn--lg">
                                Search
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <section className="vq-section vq-mc-body">
                <div className="vq-container">
                    {articles.length > 0 ? (
                        <div className="vq-grid vq-grid--2">
                            {articles.map((article, i) => (
                                <RevealOnScroll key={article.slug} direction="up" delay={Math.min(i, 3) * 0.05}>
                                    <Link
                                        href={`/help/articles/${article.slug}`}
                                        className="vq-card vq-card--interactive vq-mc-lcard"
                                    >
                                        <span className="vq-badge vq-badge--accent" style={{ alignSelf: 'flex-start' }}>
                                            {article.category}
                                        </span>
                                        <h2 className="vq-mc-lcard__title" style={{ marginTop: 'var(--vq-space-2)' }}>{article.title}</h2>
                                        <p className="vq-mc-lcard__text">{article.summary}</p>
                                        <div className="vq-mc-lcard__foot">
                                            <span className="vq-mc-lcard__cta">
                                                Read Article <ArrowRight size={15} aria-hidden="true" />
                                            </span>
                                        </div>
                                    </Link>
                                </RevealOnScroll>
                            ))}
                        </div>
                    ) : (
                        <div className="vq-card vq-mc-empty">
                            <LifeBuoy size={32} aria-hidden="true" />
                            <h2 className="vq-h3 vq-mt-4">No articles match that search</h2>
                            <p className="vq-body vq-text-2 vq-mt-2" style={{ marginInline: 'auto' }}>
                                Try a different keyword, or <Link href="/help">browse every article</Link>.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </MarketingLayout>
    );
}
