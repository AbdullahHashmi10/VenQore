import React from 'react';
import MarketingLayout from '../Shared/MarketingLayout';
import { Link } from '@inertiajs/react';
import {
    ArrowRight, Clock, ChevronRight, BookOpen, Sparkles, Tag
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   V6 BLOG INDEX — "The Signal"
   100% V6 Design System: dark ambient surface, high-contrast Bricolage
   headings, Plus Jakarta copy, mint accent badges, and clean cards.
   ═══════════════════════════════════════════════════════════════════════ */

const FeaturedPost = ({ post }) => (
    <div className="vq-card vq-card--interactive" style={{ padding: '0', overflow: 'hidden', borderRadius: 'var(--vq-r-xl)' }}>
        <Link href={`/blog/${post.slug}`} className="block" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'stretch' }}>
                {/* Visual Artwork Banner */}
                <div style={{
                    position: 'relative',
                    minHeight: '280px',
                    background: 'radial-gradient(circle at 30% 30%, rgba(35, 196, 166, 0.18), transparent 70%), var(--vq-surface-raised)',
                    borderRight: '1px solid var(--vq-line)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '36px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '16px',
                        left: '20px',
                        fontFamily: 'var(--vq-font-numeric)',
                        fontWeight: '800',
                        fontSize: '72px',
                        lineHeight: '1',
                        color: 'rgba(255, 255, 255, 0.04)',
                        userSelect: 'none'
                    }}>01</div>
                    <BookOpen size={48} style={{ color: 'var(--vq-accent)', opacity: 0.85, marginBottom: '16px' }} />
                    <span className="vq-eyebrow vq-eyebrow--accent" style={{ letterSpacing: '.18em' }}>FEATURED INTELLIGENCE</span>
                </div>

                {/* Content */}
                <div style={{ padding: 'clamp(28px, 4vw, 44px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span className="vq-chip" style={{ background: 'rgba(35, 196, 166, 0.12)', borderColor: 'rgba(35, 196, 166, 0.3)', color: 'var(--vq-accent)' }}>
                            {post.category}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--vq-text-3)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--vq-font-numeric)' }}>
                            <Clock size={13} style={{ color: 'var(--vq-accent)' }} /> {post.date}
                        </span>
                    </div>

                    <h2 className="vq-h2" style={{ margin: '0', color: 'var(--vq-text)', lineHeight: '1.2' }}>
                        {post.title}
                    </h2>

                    <p className="vq-lede" style={{ margin: '0', color: 'var(--vq-text-2)', fontSize: '15px', lineHeight: '1.6' }}>
                        {post.excerpt}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--vq-line-soft)' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--vq-text-2)' }}>{post.author}</span>
                        <span className="vq-link" style={{ fontWeight: '700', letterSpacing: '.04em' }}>
                            Read Article <ArrowRight size={14} />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    </div>
);

const PostCard = ({ post, index }) => (
    <div className="vq-card vq-card--interactive" style={{ padding: '0', overflow: 'hidden', borderRadius: 'var(--vq-r-lg)', display: 'flex', flexDirection: 'column' }}>
        <Link href={`/blog/${post.slug}`} className="block" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Visual Thumbnail */}
            <div style={{
                height: '140px',
                background: 'radial-gradient(circle at top right, rgba(35, 196, 166, 0.12), transparent 60%), var(--vq-surface-raised)',
                borderBottom: '1px solid var(--vq-line-soft)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <span style={{
                    position: 'absolute',
                    right: '16px',
                    bottom: '8px',
                    fontFamily: 'var(--vq-font-numeric)',
                    fontWeight: '800',
                    fontSize: '48px',
                    color: 'rgba(255, 255, 255, 0.04)',
                    userSelect: 'none'
                }}>
                    {String(index + 2).padStart(2, '0')}
                </span>
                <span className="vq-eyebrow" style={{ color: 'var(--vq-text-3)', fontSize: '11px' }}>
                    {post.category}
                </span>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: '1', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--vq-text-3)', fontFamily: 'var(--vq-font-numeric)' }}>
                    <span>{post.category}</span>
                    <span>{post.date}</span>
                </div>

                <h3 className="vq-h3" style={{ margin: '0', fontSize: '18px', lineHeight: '1.3', color: 'var(--vq-text)', flex: '1' }}>
                    {post.title}
                </h3>

                <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.55', color: 'var(--vq-text-2)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.excerpt}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--vq-line-soft)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--vq-text-3)' }}>{post.author}</span>
                    <span className="vq-link" style={{ fontSize: '13px' }}>
                        Read <ChevronRight size={14} />
                    </span>
                </div>
            </div>
        </Link>
    </div>
);

export default function BlogIndex({ posts = { data: [] } }) {
    const postItems = Array.isArray(posts) ? posts : (posts.data || []);
    const featured = postItems[0];
    const rest = postItems.slice(1);
    const hasPagination = !Array.isArray(posts) && posts.last_page > 1;

    return (
        <MarketingLayout
            title="Blog & Field Guides — VenQore"
            description="Deep dives into financial accuracy, operational control, and the hidden mechanics that make or break retail & wholesale businesses."
        >
            {/* ── 1. HERO ─────────────────────────────────────── */}
            <section className="vq-section vq-section--tight" style={{ paddingTop: 'clamp(140px, 15vw, 200px)', textAlign: 'center' }}>
                <div className="vq-container vq-container--narrow">
                    <span className="vq-eyebrow vq-eyebrow--accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: 'var(--vq-accent)', boxShadow: '0 0 8px var(--vq-accent)' }}></span>
                        THE SIGNAL · VENQORE EDITORIAL
                    </span>

                    <h1 className="vq-display" style={{ margin: '0 0 16px', fontWeight: '700', letterSpacing: '-0.03em' }}>
                        Ideas That <span style={{ color: 'var(--vq-accent)', position: 'relative' }}>Matter.</span>
                    </h1>

                    <p className="vq-lede" style={{ maxWidth: '580px', marginInline: 'auto' }}>
                        Deep dives into financial accuracy, inventory velocity, and the mathematical laws that ensure your books always balance.
                    </p>
                </div>
            </section>

            {/* ── 2. FEATURED POST ────────────────────────────── */}
            {featured && (
                <section style={{ paddingBottom: 'var(--vq-space-12)' }}>
                    <div className="vq-container">
                        <FeaturedPost post={featured} />
                    </div>
                </section>
            )}

            {/* ── 3. POST GRID ────────────────────────────────── */}
            {rest.length > 0 && (
                <section style={{ paddingBottom: 'var(--vq-space-16)' }}>
                    <div className="vq-container">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <span className="vq-kicker">ALL ARTICLES &amp; GUIDES</span>
                            <span className="vq-caption">{postItems.length} publications</span>
                        </div>

                        <div className="vq-grid vq-grid--3">
                            {rest.map((post, i) => (
                                <PostCard key={post.uid || post.slug || i} post={post} index={i} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── 4. PAGINATION ───────────────────────────────── */}
            {hasPagination && (
                <div className="vq-container" style={{ paddingBottom: 'var(--vq-space-16)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--vq-line)', paddingTop: '24px' }}>
                        {posts.prev_page_url ? (
                            <Link href={posts.prev_page_url} preserveScroll className="vq-btn vq-btn--secondary">
                                &larr; Previous
                            </Link>
                        ) : <span />}

                        <span className="vq-caption" style={{ fontFamily: 'var(--vq-font-numeric)', fontWeight: '600' }}>
                            Page {posts.current_page} of {posts.last_page}
                        </span>

                        {posts.next_page_url ? (
                            <Link href={posts.next_page_url} preserveScroll className="vq-btn vq-btn--secondary">
                                Next &rarr;
                            </Link>
                        ) : <span />}
                    </div>
                </div>
            )}
        </MarketingLayout>
    );
}
