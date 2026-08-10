import React, { useMemo } from 'react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel
} from '../Shared/MarketingLayout';
import { Link } from '@inertiajs/react';
import {
    ArrowLeft, ArrowRight, Clock, Tag, Share2,
    ChevronRight, BookOpen
} from 'lucide-react';
import { marked } from 'marked';

/* ═══════════════════════════════════════════════════════════════════════
   BLOG ARTICLE — "The Deep Read"
   Visual Concept: Long-form editorial with generous whitespace,
   strong typographic hierarchy, and a reading experience that
   feels like a premium publication. No clutter. Just the idea.
   ═══════════════════════════════════════════════════════════════════════ */

const RelatedPost = ({ post, index }) => (
    <RevealOnScroll delay={index * 0.1}>
        <Link href={`/blog/${post.slug}`} className="block group">
            <div className="rounded-[2rem] bg-slate-900/[0.02] dark:bg-white/[0.02] border border-slate-900/[0.08] dark:border-white/[0.06] p-6 hover:border-indigo-500/20 hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-500">
                <span className="px-2.5 py-0.5 rounded-full bg-slate-900/[0.03] dark:bg-white/5 text-3xs font-black text-slate-500 uppercase tracking-widest mb-3 inline-block">
                    {post.category}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors line-clamp-2">
                    {post.title}
                </h4>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-900/[0.06] dark:border-white/5">
                    <span className="text-2xs text-slate-700 font-bold">{post.date}</span>
                    <ChevronRight size={14} className="text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    </RevealOnScroll>
);

/* Full Markdown renderer using `marked` ───────────────────────────── */
const ArticleContent = ({ content }) => {
    const html = useMemo(() => {
        if (!content) return '';

        // Configure marked for safe, clean output
        marked.setOptions({
            gfm: true,        // GitHub Flavoured Markdown (tables, strikethrough, etc.)
            breaks: false,     // Don't convert \n to <br>
            headerIds: true,   // Generate IDs on headings for anchor links
            mangle: false,     // Don't mangle email addresses
        });

        return marked.parse(content);
    }, [content]);

    if (!html) return null;

    return (
        <div
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
};

export default function BlogShow({ post, recentPosts = [] }) {
    if (!post) return null;

    // Calculate reading time (~200 words per min)
    const wordCount = useMemo(() => {
        if (!post.content) return 0;
        return post.content.trim().split(/\s+/).length;
    }, [post.content]);

    const readTime = useMemo(() => {
        return Math.max(1, Math.ceil(wordCount / 200));
    }, [wordCount]);

    return (
        <MarketingLayout
            title={`${post.title} — VenQore Blog`}
            description={post.excerpt}
        >
            {/* ── 1. ARTICLE HEADER ───────────────────────────── */}
            <section className="relative pt-36 pb-12 px-6 overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Back link */}
                    <RevealOnScroll>
                        <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 hover:text-indigo-400 transition-colors mb-8 group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back to Blog</span>
                        </Link>
                    </RevealOnScroll>

                    {/* Meta tags */}
                    <RevealOnScroll delay={0.05}>
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className="px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-3xs font-black tracking-[0.2em] uppercase">
                                {post.category || 'Retail Intelligence'}
                            </span>
                            <span className="text-2xs text-slate-400 font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/40 border border-white/5">
                                <Clock size={12} className="text-indigo-400" /> {readTime} min read ({wordCount.toLocaleString()} words)
                            </span>
                            <span className="text-2xs text-slate-400 font-bold flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/40 border border-white/5">
                                <Tag size={12} className="text-indigo-400" /> Published {post.date}
                            </span>
                        </div>
                    </RevealOnScroll>

                    {/* Title */}
                    <RevealOnScroll delay={0.1}>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.08] mb-6 font-display">
                            {post.title}
                        </h1>
                    </RevealOnScroll>

                    {/* Excerpt */}
                    {post.excerpt && (
                        <RevealOnScroll delay={0.15}>
                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8 font-medium border-l-2 border-indigo-500/50 pl-4 py-1">
                                {post.excerpt}
                            </p>
                        </RevealOnScroll>
                    )}

                    {/* Author & Share bar */}
                    <RevealOnScroll delay={0.2}>
                        <div className="flex flex-wrap items-center justify-between gap-4 py-5 border-y border-slate-900/[0.08] dark:border-white/10 mb-10">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 shadow-lg shadow-indigo-500/20">
                                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-white text-sm font-black">
                                        {post.author?.charAt(0) || 'V'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        {post.author || 'VenQore Editorial'}
                                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Verified Author</span>
                                    </div>
                                    <div className="text-3xs text-slate-400 uppercase tracking-widest font-bold">Retail Systems Engineer</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        if (navigator.clipboard) {
                                            navigator.clipboard.writeText(window.location.href);
                                            alert('Article link copied to clipboard!');
                                        }
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/[0.04] dark:bg-slate-900/40 hover:bg-indigo-600/20 border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white transition-all text-2xs font-bold uppercase tracking-widest"
                                >
                                    <Share2 size={13} /> Copy Link
                                </button>
                            </div>
                        </div>
                    </RevealOnScroll>

                    {/* Featured Image */}
                    {post.image && (
                        <RevealOnScroll delay={0.25}>
                            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-950/50 mb-12 group">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-72 md:h-[420px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
                            </div>
                        </RevealOnScroll>
                    )}
                </div>
            </section>

            {/* ── 2. ARTICLE BODY ─────────────────────────────── */}
            <section className="pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <ArticleContent content={post.content} />
                </div>
            </section>

            {/* ── 3. RELATED POSTS ────────────────────────────── */}
            {recentPosts.length > 0 && (
                <section className="py-20 px-6 border-t border-slate-900/[0.08] dark:border-white/10 bg-slate-900/[0.01] dark:bg-slate-950/40">
                    <div className="max-w-5xl mx-auto">
                        <RevealOnScroll>
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <span className="text-3xs font-black text-indigo-400 uppercase tracking-widest block mb-1">Recommended Reading</span>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-display">More Articles from VenQore</h2>
                                </div>
                                <Link href="/blog" className="text-indigo-400 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 hover:gap-3 transition-all">
                                    All Articles <ArrowRight size={12} />
                                </Link>
                            </div>
                        </RevealOnScroll>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {recentPosts.filter(p => p.slug !== post.slug).slice(0, 3).map((p, i) => (
                                <RelatedPost key={p.uid || i} post={p} index={i} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── 4. CTA BANNER ───────────────────────────────── */}
            <section className="py-24 px-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 to-slate-950 pointer-events-none" />
                <RevealOnScroll>
                    <div className="max-w-3xl mx-auto relative z-10 bg-slate-900/60 border border-white/10 rounded-3xl p-10 backdrop-blur-xl">
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-3xs font-black uppercase tracking-widest inline-block mb-4">
                            Zero Processing Markups
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter font-display mb-4">
                            Ready to Experience <span className="text-indigo-400">Zero-Fee Retail POS?</span>
                        </h2>
                        <p className="text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
                            Join independent retailers saving thousands annually on credit card processing markups. Hardware-agnostic, offline-resilient, and 100% transparent.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <MagneticButton href="/register" variant="primary">
                                Start 14-Day Free Trial <ArrowRight size={16} />
                            </MagneticButton>
                            <Link href="/pricing" className="px-6 py-3 rounded-full border border-white/15 text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest inline-flex items-center">
                                View TCO Calculator
                            </Link>
                        </div>
                    </div>
                </RevealOnScroll>
            </section>
        </MarketingLayout>
    );
}
