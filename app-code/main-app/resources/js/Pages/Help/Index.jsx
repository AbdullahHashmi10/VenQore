import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { LifeBuoy, Search } from 'lucide-react';
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
export default function Index({ articles, query: initialQuery }) {
    const [search, setSearch] = useState(initialQuery || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/help', { q: search }, { preserveState: true });
    };

    return (
        <MarketingLayout
            title="Help Centre — VenQore POS"
            description="Search knowledge base articles for setup, POS hardware, inventory limits, and AppSumo LTD features."
        >
            <section className="max-w-5xl mx-auto px-6 pt-32 pb-12 text-center">
                <RevealOnScroll direction="up">
                    <SectionLabel icon={LifeBuoy} text="HELP CENTRE" />

                    <h1 className="text-4xl font-bold tracking-tight text-ink">VenQore Help Centre</h1>

                    <p className="mt-4 max-w-xl mx-auto text-ink-secondary leading-relaxed">
                        Search knowledge base articles for setup, POS hardware, inventory limits, and AppSumo LTD features.
                    </p>

                    <form onSubmit={handleSearch} className="mt-8 max-w-md mx-auto flex gap-2">
                        <label htmlFor="help-search" className="sr-only">Search articles</label>
                        <div className="relative flex-1">
                            <Search
                                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
                                aria-hidden="true"
                            />
                            <input
                                id="help-search"
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search articles (e.g. BYOK, hardware, LTD limits)..."
                                className="h-control-lg w-full rounded-md border border-line bg-surface pl-11 pr-4 text-base text-ink transition-colors duration-fast placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-focus"
                            />
                        </div>
                        <button
                            type="submit"
                            className="h-control-lg shrink-0 rounded-md bg-accent-fill px-6 font-semibold text-accent-on transition-colors duration-fast hover:bg-accent-fill-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                            Search
                        </button>
                    </form>
                </RevealOnScroll>
            </section>

            <section className="max-w-5xl mx-auto px-6 pb-24">
                <div className="grid gap-6 md:grid-cols-2">
                    {articles.map((article) => (
                        <RevealOnScroll key={article.slug} direction="up">
                            <article className="h-full rounded-lg border border-line bg-surface p-6 transition-colors duration-fast hover:border-accent">
                                <span className="inline-block rounded-full bg-accent-quiet px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-accent-text">
                                    {article.category}
                                </span>
                                <h2 className="mt-3 text-xl font-bold text-ink">
                                    <Link
                                        href={`/help/articles/${article.slug}`}
                                        className="transition-colors duration-fast hover:text-accent-text"
                                    >
                                        {article.title}
                                    </Link>
                                </h2>
                                <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{article.summary}</p>
                                <div className="mt-4">
                                    <Link
                                        href={`/help/articles/${article.slug}`}
                                        className="text-sm font-semibold text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                                    >
                                        Read Article &rarr;
                                    </Link>
                                </div>
                            </article>
                        </RevealOnScroll>
                    ))}
                </div>
            </section>
        </MarketingLayout>
    );
}
