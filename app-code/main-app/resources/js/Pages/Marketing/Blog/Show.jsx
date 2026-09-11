import React, { useMemo } from 'react';
import MarketingLayout from '../Shared/MarketingLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { marked } from 'marked';

/* ═══════════════════════════════════════════════════════════════════════
   V6 BLOG ARTICLE — "The Deep Read"
   A reading column (.vq-read, ~72ch, 18px / 1.7) under a V6 page head.
   Markdown styles live in resources/css/venqore-v6/mkt-content.css.
   ═══════════════════════════════════════════════════════════════════════ */

const ArticleContent = ({ content }) => {
    const html = useMemo(() => {
        if (!content) return '';
        marked.setOptions({
            gfm: true,
            breaks: false,
            headerIds: true,
            mangle: false,
        });
        return marked.parse(content);
    }, [content]);

    if (!html) return null;

    return (
        <div
            className="vq-read"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default function BlogShow({ post, recentPosts = [] }) {
    // Hooks run before the early return so their order never changes.
    const wordCount = useMemo(() => {
        if (!post?.content) return 0;
        return post.content.trim().split(/\s+/).length;
    }, [post?.content]);

    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    if (!post) return null;

    return (
        <MarketingLayout
            title={`${post.title} — VenQore`}
            description={post.excerpt}
        >
            <Head>
                <meta property="og:type" content="article" />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={post.excerpt} />
            </Head>

            <article>
                {/* ── Article head ───────────────────────────── */}
                <header className="vq-section vq-mc-top vq-mc-top--flush">
                    <div className="vq-container vq-container--narrow">
                        <div className="vq-mc-back">
                            <Link href="/blog" className="vq-link">
                                <ArrowLeft size={16} aria-hidden="true" /> Back to all articles
                            </Link>
                        </div>

                        <div className="vq-mc-meta">
                            <span className="vq-badge vq-badge--accent">{post.category || 'Financial Truth'}</span>
                            <span className="vq-mc-meta__item">
                                <Clock size={14} aria-hidden="true" /> {readTime} min read · {wordCount.toLocaleString()} words
                            </span>
                            {post.date && <span className="vq-mc-meta__item">{post.date}</span>}
                        </div>

                        <h1 className="vq-h1 vq-mt-6">{post.title}</h1>

                        {post.excerpt && (
                            <p className="vq-lede vq-mt-6">{post.excerpt}</p>
                        )}

                        <div className="vq-row vq-gap-3 vq-mt-8" style={{ paddingBottom: 'var(--vq-space-8)', borderBottom: '1px solid var(--vq-line)' }}>
                            <span
                                className="vq-mc-icon vq-mc-icon--round"
                                aria-hidden="true"
                                style={{ width: 44, height: 44, fontFamily: 'var(--vq-font-numeric)', fontWeight: 700, fontSize: 14 }}
                            >
                                VQ
                            </span>
                            <div>
                                <div style={{ fontSize: 'var(--vq-fs-small)', fontWeight: 600, color: 'var(--vq-text)' }}>{post.author || 'VenQore Editorial'}</div>
                                <div className="vq-caption">Systems &amp; Accounting Research</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Body ───────────────────────────────────── */}
                <div className="vq-section vq-mc-body" style={{ paddingTop: 'var(--vq-space-6)' }}>
                    <div className="vq-container vq-container--narrow">
                        <ArticleContent content={post.content || post.excerpt} />

                        {/* Post-article callout */}
                        <div className="vq-card vq-card--xl vq-center" style={{ marginTop: 'var(--vq-space-20)', padding: 'clamp(32px, 5vw, 48px)' }}>
                            <span className="vq-eyebrow vq-eyebrow--accent">Build your system</span>
                            <h2 className="vq-h2 vq-mt-4">Run real money through an immutable Core Ledger.</h2>
                            <p className="vq-body vq-text-2 vq-mt-4" style={{ maxWidth: '52ch', marginInline: 'auto' }}>
                                VenQore assembles point of sale, inventory, and real double-entry accounting configured to your exact business workflow.
                            </p>
                            <div className="vq-mt-8">
                                <Link href="/build-workspace" className="vq-btn vq-btn--primary vq-btn--lg">
                                    Start building workspace <span className="vq-btn__arrow"><ArrowRight size={16} aria-hidden="true" /></span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* ── Related articles ───────────────────────────── */}
            {recentPosts.length > 0 && (
                <section className="vq-section vq-section--alt">
                    <div className="vq-container">
                        <div className="vq-section-head" style={{ marginBottom: 'var(--vq-space-10)' }}>
                            <span className="vq-eyebrow">Continue reading</span>
                            <h2 className="vq-h2">Related field guides</h2>
                        </div>
                        <div className="vq-grid vq-grid--3">
                            {recentPosts.map((rel, idx) => (
                                <Link key={rel.slug || idx} href={`/blog/${rel.slug}`} className="vq-card vq-card--interactive vq-mc-lcard">
                                    {rel.category && <span className="vq-badge vq-badge--accent" style={{ alignSelf: 'flex-start' }}>{rel.category}</span>}
                                    <h3 className="vq-mc-lcard__title" style={{ marginTop: 'var(--vq-space-2)' }}>{rel.title}</h3>
                                    {rel.excerpt && <p className="vq-mc-lcard__text">{rel.excerpt}</p>}
                                    <div className="vq-mc-lcard__foot">
                                        <span>{rel.date}</span>
                                        <span className="vq-mc-lcard__cta">Read guide <ArrowRight size={15} aria-hidden="true" /></span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </MarketingLayout>
    );
}
