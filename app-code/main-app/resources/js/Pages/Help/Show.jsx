import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
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
            <article>
                <header className="vq-section vq-mc-top vq-mc-top--flush">
                    <div className="vq-container vq-container--narrow">
                        <div className="vq-mc-back">
                            <Link href="/help" className="vq-link">
                                <ArrowLeft size={16} aria-hidden="true" /> Back to Help Centre
                            </Link>
                        </div>
                        <span className="vq-badge vq-badge--accent">{article.category}</span>
                        <h1 className="vq-h1 vq-mt-5">{article.title}</h1>
                        <p className="vq-lede vq-mt-5" style={{ paddingBottom: 'var(--vq-space-8)', borderBottom: '1px solid var(--vq-line)', maxWidth: 'none' }}>
                            {article.summary}
                        </p>
                    </div>
                </header>

                <div className="vq-section vq-mc-body" style={{ paddingTop: 'var(--vq-space-4)' }}>
                    <div className="vq-container vq-container--narrow">
                        <RevealOnScroll direction="up">
                            <div className="vq-read">
                                <p>{article.content}</p>
                            </div>
                        </RevealOnScroll>

                        <div className="vq-card vq-row vq-wrap vq-gap-4" style={{ marginTop: 'var(--vq-space-16)', justifyContent: 'space-between', padding: 'var(--vq-space-8)' }}>
                            <div>
                                <h2 className="vq-h3" style={{ fontSize: '20px' }}>Still stuck?</h2>
                                <p className="vq-small vq-text-2 vq-mt-2">Send the team a note from the contact page.</p>
                            </div>
                            <div className="vq-row vq-wrap vq-gap-3">
                                <Link href="/help" className="vq-btn vq-btn--quiet">All articles</Link>
                                <Link href="/contact" className="vq-btn vq-btn--secondary">Contact support</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </MarketingLayout>
    );
}
