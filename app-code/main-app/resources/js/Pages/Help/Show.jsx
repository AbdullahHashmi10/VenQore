import React from 'react';
import { Link } from '@inertiajs/react';
import MarketingLayout, { RevealOnScroll } from '@/Pages/Marketing/Shared/MarketingLayout';

/**
 * A single Help Centre article.
 *
 * Same rebuild as Help/Index.jsx: it now renders inside MarketingLayout, so an
 * article reached from search has the site header, the footer and a way back;
 * the forced near-black ground and the true-neutral ramp are gone; and every
 * colour is a role — `bg-surface`, `text-ink`, `border-line`, and the mode-aware
 * accent forms — so the page reads correctly in both themes (§4, §15).
 *
 * The removed class names are described, not quoted: Tailwind scans raw file
 * text, so naming one in a comment builds it again.
 *
 * The `article` prop, the `/help` link and every string are untouched.
 */
export default function Show({ article }) {
    return (
        <MarketingLayout
            title={`${article.title} — VenQore Help Centre`}
            description={article.summary}
        >
            <section className="max-w-3xl mx-auto space-y-6 px-6 pt-32 pb-24">
                <div>
                    <Link
                        href="/help"
                        className="text-sm font-semibold text-accent-text transition-colors duration-fast hover:text-accent-fill-hover"
                    >
                        &larr; Back to Help Centre
                    </Link>
                </div>

                <RevealOnScroll direction="up">
                    <article className="space-y-4 rounded-lg border border-line bg-surface p-8">
                        <span className="inline-block rounded-full bg-accent-quiet px-3 py-1 text-2xs font-semibold uppercase tracking-wider text-accent-text">
                            {article.category}
                        </span>

                        <h1 className="text-3xl font-bold tracking-tight text-ink">{article.title}</h1>

                        <p className="border-b border-line-subtle pb-4 text-lg text-ink-secondary">{article.summary}</p>

                        <div className="space-y-4 pt-2 leading-relaxed text-ink-secondary">
                            <p>{article.content}</p>
                        </div>
                    </article>
                </RevealOnScroll>
            </section>
        </MarketingLayout>
    );
}
