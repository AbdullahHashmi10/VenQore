import React, { useMemo } from 'react';
import MarketingLayout from '../Shared/MarketingLayout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft, Clock, Tag, ChevronRight, BookOpen, Share2
} from 'lucide-react';
import { marked } from 'marked';

/* ═══════════════════════════════════════════════════════════════════════
   V6 BLOG ARTICLE — "The Deep Read"
   100% V6 Design System typography, high-contrast readable markdown
   styling, breadcrumbs, reading time, and author metadata.
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
            className="vq-prose"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default function BlogShow({ post, recentPosts = [] }) {
    if (!post) return null;

    const wordCount = useMemo(() => {
        if (!post.content) return 0;
        return post.content.trim().split(/\s+/).length;
    }, [post.content]);

    const readTime = useMemo(() => {
        return Math.max(1, Math.ceil(wordCount / 200));
    }, [wordCount]);

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

            <article style={{ paddingTop: 'clamp(70px, 8vw, 100px)', paddingBottom: 'var(--vq-space-16)' }}>
                <div className="vq-container vq-container--narrow">
                    {/* Back link */}
                    <div style={{ marginBottom: '28px' }}>
                        <Link href="/blog" className="vq-link" style={{ gap: '8px' }}>
                            <ArrowLeft size={15} /> Back to all articles
                        </Link>
                    </div>

                    {/* Metadata Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        <span className="vq-chip" style={{ background: 'rgba(35, 196, 166, 0.12)', borderColor: 'rgba(35, 196, 166, 0.3)', color: 'var(--vq-accent)' }}>
                            {post.category || 'Financial Truth'}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--vq-text-3)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--vq-font-numeric)' }}>
                            <Clock size={13} style={{ color: 'var(--vq-accent)' }} /> {readTime} min read · {wordCount.toLocaleString()} words
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--vq-text-3)', fontFamily: 'var(--vq-font-numeric)' }}>
                            {post.date}
                        </span>
                    </div>

                    {/* Article Title */}
                    <h1 className="vq-h1" style={{ margin: '0 0 24px', fontWeight: '700', lineHeight: '1.15', letterSpacing: '-0.03em', color: 'var(--vq-text)' }}>
                        {post.title}
                    </h1>

                    {/* Excerpt callout */}
                    {post.excerpt && (
                        <div style={{
                            padding: '20px 24px',
                            background: 'var(--vq-surface)',
                            border: '1px solid var(--vq-line)',
                            borderLeft: '4px solid var(--vq-accent)',
                            borderRadius: 'var(--vq-r-md)',
                            marginBottom: '40px',
                            fontSize: '17px',
                            lineHeight: '1.6',
                            color: 'var(--vq-text-2)'
                        }}>
                            {post.excerpt}
                        </div>
                    )}

                    {/* Author Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '24px', marginBottom: '40px', borderBottom: '1px solid var(--vq-line)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '999px', background: 'var(--vq-surface-raised)', border: '1px solid var(--vq-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--vq-accent)', fontWeight: '700' }}>
                                VQ
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--vq-text)' }}>{post.author || 'VenQore Editorial'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--vq-text-3)' }}>Systems & Accounting Research</div>
                            </div>
                        </div>
                    </div>

                    {/* Body Content */}
                    <ArticleContent content={post.content || post.excerpt} />

                    {/* Post-article Callout */}
                    <div style={{ marginTop: '56px', padding: '36px', borderRadius: 'var(--vq-r-xl)', background: 'var(--vq-surface)', border: '1px solid var(--vq-line)', boxShadow: 'var(--vq-elev-2)', textAlign: 'center' }}>
                        <span className="vq-eyebrow vq-eyebrow--accent">BUILD YOUR SYSTEM</span>
                        <h3 className="vq-h2" style={{ margin: '12px 0', color: 'var(--vq-text)' }}>
                            Run real money through an immutable Core Ledger.
                        </h3>
                        <p className="vq-lede" style={{ maxWidth: '480px', marginInline: 'auto', marginBottom: '24px' }}>
                            VenQore assembles point of sale, inventory, and real double-entry accounting configured to your exact business workflow.
                        </p>
                        <Link href="/build-workspace" className="vq-btn vq-btn--primary vq-btn--lg">
                            Start building workspace &rarr;
                        </Link>
                    </div>
                </div>
            </article>

            {/* Related Articles */}
            {recentPosts.length > 0 && (
                <section className="vq-section vq-section--alt" style={{ borderTop: '1px solid var(--vq-line)' }}>
                    <div className="vq-container">
                        <span className="vq-kicker">CONTINUE READING</span>
                        <h2 className="vq-h2" style={{ margin: '8px 0 28px' }}>Related Field Guides</h2>
                        <div className="vq-grid vq-grid--3">
                            {recentPosts.map((rel, idx) => (
                                <div key={rel.slug || idx} className="vq-card vq-card--interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <span className="vq-chip" style={{ alignSelf: 'flex-start', fontSize: '11px' }}>{rel.category}</span>
                                    <h3 className="vq-h3" style={{ fontSize: '17px', color: 'var(--vq-text)', flex: '1' }}>{rel.title}</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--vq-text-3)', lineClamp: 2, overflow: 'hidden' }}>{rel.excerpt}</p>
                                    <Link href={`/blog/${rel.slug}`} className="vq-link" style={{ marginTop: 'auto' }}>
                                        Read guide <ChevronRight size={14} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Prose styling */}
            <style>{`
                .vq-prose {
                    font-size: 17px;
                    line-height: 1.75;
                    color: var(--vq-text-2);
                    font-family: var(--vq-font-sans);
                }
                .vq-prose h2 {
                    font-size: 26px;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    color: var(--vq-text);
                    margin-top: 48px;
                    margin-bottom: 18px;
                    font-family: var(--vq-font-display);
                }
                .vq-prose h3 {
                    font-size: 21px;
                    font-weight: 600;
                    color: var(--vq-text);
                    margin-top: 36px;
                    margin-bottom: 14px;
                    font-family: var(--vq-font-display);
                }
                .vq-prose p {
                    margin-bottom: 24px;
                    max-width: none;
                }
                .vq-prose ul, .vq-prose ol {
                    margin-bottom: 24px;
                    padding-left: 24px;
                }
                .vq-prose ul { list-style: disc; }
                .vq-prose ol { list-style: decimal; }
                .vq-prose li {
                    margin-bottom: 8px;
                    line-height: 1.65;
                }
                .vq-prose blockquote {
                    border-left: 4px solid var(--vq-accent);
                    padding: 16px 24px;
                    margin: 28px 0;
                    background: var(--vq-surface);
                    border-radius: 0 var(--vq-r-md) var(--vq-r-md) 0;
                    color: var(--vq-text);
                    font-style: italic;
                }
                .vq-prose table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 32px 0;
                    font-size: 15px;
                }
                .vq-prose th, .vq-prose td {
                    padding: 12px 16px;
                    border: 1px solid var(--vq-line);
                    text-align: left;
                }
                .vq-prose th {
                    background: var(--vq-surface-raised);
                    color: var(--vq-text);
                    font-weight: 600;
                }
                .vq-prose code {
                    font-family: var(--vq-font-numeric);
                    font-size: 14px;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: var(--vq-surface-raised);
                    border: 1px solid var(--vq-line);
                    color: var(--vq-accent-text);
                }
                .vq-prose pre {
                    padding: 20px;
                    border-radius: var(--vq-r-lg);
                    background: var(--vq-surface-raised);
                    border: 1px solid var(--vq-line);
                    overflow-x: auto;
                    margin: 28px 0;
                }
                .vq-prose pre code {
                    padding: 0;
                    border: 0;
                    background: transparent;
                }
                .vq-prose strong {
                    color: var(--vq-text);
                    font-weight: 600;
                }
            `}</style>
        </MarketingLayout>
    );
}
