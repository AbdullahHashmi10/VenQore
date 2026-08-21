import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ articles, query: initialQuery }) {
    const [search, setSearch] = useState(initialQuery || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/help', { q: search }, { preserveState: true });
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12 font-sans">
            <Head title="Help Centre — VenQore POS" />
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight text-white">VenQore Help Centre</h1>
                    <p className="text-ink-muted max-w-xl mx-auto">
                        Search knowledge base articles for setup, POS hardware, inventory limits, and AppSumo LTD features.
                    </p>
                    <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search articles (e.g. BYOK, hardware, LTD limits)..."
                            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-neutral-100 focus:outline-none focus:border-purple-500"
                        />
                        <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-semibold transition">
                            Search
                        </button>
                    </form>
                </header>

                <div className="grid md:grid-cols-2 gap-6">
                    {articles.map((article) => (
                        <div key={article.slug} className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-purple-500/50 transition">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-950/80 text-purple-400 border border-purple-800/40">
                                {article.category}
                            </span>
                            <h2 className="text-xl font-bold mt-3 text-white">
                                <Link href={`/help/articles/${article.slug}`} className="hover:text-purple-400 transition">
                                    {article.title}
                                </Link>
                            </h2>
                            <p className="text-ink-muted text-sm mt-2 leading-relaxed">{article.summary}</p>
                            <div className="mt-4">
                                <Link href={`/help/articles/${article.slug}`} className="text-sm font-semibold text-purple-400 hover:underline">
                                    Read Article &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
