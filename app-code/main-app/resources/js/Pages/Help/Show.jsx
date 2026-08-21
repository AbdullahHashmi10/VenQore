import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Show({ article }) {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-12 font-sans">
            <Head title={`${article.title} — VenQore Help Centre`} />
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <Link href="/help" className="text-sm text-purple-400 hover:underline">&larr; Back to Help Centre</Link>
                </div>
                <article className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 space-y-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-950/80 text-purple-400 border border-purple-800/40">
                        {article.category}
                    </span>
                    <h1 className="text-3xl font-bold text-white">{article.title}</h1>
                    <p className="text-ink-muted text-lg border-b border-neutral-800 pb-4">{article.summary}</p>
                    <div className="text-neutral-300 leading-relaxed space-y-4 pt-2">
                        <p>{article.content}</p>
                    </div>
                </article>
            </div>
        </div>
    );
}
