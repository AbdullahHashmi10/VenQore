import React from 'react';
import MarketingLayout from '../Shared/MarketingLayout';
import { Link } from '@inertiajs/react';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   V6 BLOG INDEX — "The Signal"
   Site type scale, token colours only (reads in light and dark), one card
   style for every post. Styles: resources/css/venqore-v6/mkt-content.css.
   ═══════════════════════════════════════════════════════════════════════ */

const PostMeta = ({ post }) => (
    <div className="vq-mc-meta">
        {post.category && <span className="vq-badge vq-badge--accent">{post.category}</span>}
        {post.date && (
            <span className="vq-mc-meta__item">
                <Clock size={14} aria-hidden="true" /> {post.date}
            </span>
        )}
    </div>
);

const FeaturedPost = ({ post }) => (
    <Link href={`/blog/${post.slug}`} className="vq-card vq-card--interactive vq-mc-feature">
        <div className="vq-mc-feature__art" aria-hidden="true">
            <BookOpen size={40} strokeWidth={1.6} />
            <span className="vq-eyebrow vq-eyebrow--accent">Featured</span>
        </div>
        <div className="vq-mc-feature__body">
            <PostMeta post={post} />
            <h2 className="vq-mc-feature__title">{post.title}</h2>
            {post.excerpt && <p className="vq-mc-feature__text">{post.excerpt}</p>}
            <div className="vq-mc-lcard__foot" style={{ marginTop: 'var(--vq-space-2)' }}>
                <span>{post.author}</span>
                <span className="vq-mc-lcard__cta">
                    Read article <ArrowRight size={16} aria-hidden="true" />
                </span>
            </div>
        </div>
    </Link>
);

const PostCard = ({ post }) => (
    <Link href={`/blog/${post.slug}`} className="vq-card vq-card--interactive vq-mc-lcard">
        <PostMeta post={post} />
        <h3 className="vq-mc-lcard__title" style={{ marginTop: 'var(--vq-space-2)' }}>{post.title}</h3>
        {post.excerpt && <p className="vq-mc-lcard__text">{post.excerpt}</p>}
        <div className="vq-mc-lcard__foot">
            <span>{post.author}</span>
            <span className="vq-mc-lcard__cta">
                Read <ArrowRight size={15} aria-hidden="true" />
            </span>
        </div>
    </Link>
);

export default function BlogIndex({ posts = { data: [] } }) {
    const postItems = Array.isArray(posts) ? posts : (posts.data || []);
    const featured = postItems[0];
    const rest = postItems.slice(1);
    const hasPagination = !Array.isArray(posts) && posts.last_page > 1;
    const total = !Array.isArray(posts) && typeof posts.total === 'number' ? posts.total : postItems.length;

    return (
        <MarketingLayout
            title="Blog & Field Guides — VenQore"
            description="Deep dives into financial accuracy, operational control, and the hidden mechanics that make or break retail & wholesale businesses."
        >
            {/* ── 1. HERO ─────────────────────────────────────── */}
            <section className="vq-section vq-mc-top">
                <div className="vq-amb" aria-hidden="true"><span className="vq-amb__aurora" style={{ opacity: 0.22 }} /></div>
                <div className="vq-container" style={{ position: 'relative' }}>
                    <div className="vq-mc-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">The Signal · VenQore editorial</span>
                        <h1 className="vq-display vq-mt-4">Ideas that <em className="vq-italic">matter.</em></h1>
                        <p className="vq-lede vq-mt-6">
                            Deep dives into financial accuracy, inventory velocity, and the mathematical laws that ensure your books always balance.
                        </p>
                    </div>
                </div>
            </section>

            <section className="vq-section vq-mc-body">
                <div className="vq-container">
                    {/* ── 2. FEATURED POST ────────────────────── */}
                    {featured ? (
                        <FeaturedPost post={featured} />
                    ) : (
                        <div className="vq-card vq-mc-empty">
                            <BookOpen size={32} aria-hidden="true" />
                            <h2 className="vq-h3 vq-mt-4">No articles yet</h2>
                            <p className="vq-body vq-text-2 vq-mt-2" style={{ marginInline: 'auto' }}>New field guides will appear here as they are published.</p>
                        </div>
                    )}

                    {/* ── 3. POST GRID ────────────────────────── */}
                    {rest.length > 0 && (
                        <div style={{ marginTop: 'var(--vq-space-20)' }}>
                            <div className="vq-mc-rowhead">
                                <div>
                                    <span className="vq-eyebrow">All articles &amp; guides</span>
                                    <h2 className="vq-h2 vq-mt-3">More from the Signal</h2>
                                </div>
                                <span className="vq-caption">{total} publications</span>
                            </div>

                            <div className="vq-grid vq-grid--3">
                                {rest.map((post, i) => (
                                    <PostCard key={post.uid || post.slug || i} post={post} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── 4. PAGINATION ───────────────────────── */}
                    {hasPagination && (
                        <nav className="vq-mc-pager" aria-label="Blog pages">
                            {posts.prev_page_url ? (
                                <Link href={posts.prev_page_url} preserveScroll className="vq-btn vq-btn--secondary">
                                    &larr; Previous
                                </Link>
                            ) : <span />}

                            <span className="vq-caption vq-num">
                                Page {posts.current_page} of {posts.last_page}
                            </span>

                            {posts.next_page_url ? (
                                <Link href={posts.next_page_url} preserveScroll className="vq-btn vq-btn--secondary">
                                    Next &rarr;
                                </Link>
                            ) : <span />}
                        </nav>
                    )}
                </div>
            </section>
        </MarketingLayout>
    );
}
