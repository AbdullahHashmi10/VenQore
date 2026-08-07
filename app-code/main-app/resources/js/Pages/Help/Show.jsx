import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Show({ article }) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans">
            <Head title={`${article.title} — VenQore Help Centre`} />
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <Link href="/help" className="text-sm text-purple-400 hover:underline">&larr; Back to Help Centre</Link>
                </div>
                <article className="bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-950/80 text-purple-400 border border-purple-800/40">
                        {article.category}
                    </span>
                    <h1 className="text-3xl font-extrabold text-white">{article.title}</h1>
                    <p className="text-slate-400 text-lg border-b border-slate-800 pb-4">{article.summary}</p>
                    <div className="text-slate-300 leading-relaxed space-y-4 pt-2">
                        <p>{article.content}</p>
                    </div>
                </article>
            </div>
        </div>
    );
}
