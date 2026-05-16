import React from 'react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel
} from '../Shared/MarketingLayout';
import { Link } from '@inertiajs/react';
import {
    ArrowLeft, ArrowRight, Clock, Tag, Share2,
    ChevronRight, BookOpen
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   BLOG ARTICLE — "The Deep Read"
   Visual Concept: Long-form editorial with generous whitespace,
   strong typographic hierarchy, and a reading experience that
   feels like a premium publication. No clutter. Just the idea.
   ═══════════════════════════════════════════════════════════════════════ */

const RelatedPost = ({ post, index }) => (
    <RevealOnScroll delay={index * 0.1}>
        <Link href={`/blog/${post.slug}`} className="block group">
            <div className="rounded-[2rem] bg-white/[0.02] border border-white/[0.06] p-6 hover:border-indigo-500/20 hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-500">
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 inline-block">
                    {post.category}
                </span>
                <h4 className="text-base font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-indigo-100 transition-colors line-clamp-2">
                    {post.title}
                </h4>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <span className="text-[10px] text-slate-700 font-bold">{post.date}</span>
                    <ChevronRight size={14} className="text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </Link>
    </RevealOnScroll>
);

/* Simple markdown-like renderer for the post content */
const ArticleContent = ({ content }) => {
    if (!content) return null;

    const paragraphs = content.split('\n\n');

    return (
        <div className="space-y-6">
            {paragraphs.map((para, i) => {
                const trimmed = para.trim();
                if (!trimmed) return null;

                // Blockquote
                if (trimmed.startsWith('> ')) {
                    return (
                        <blockquote key={i} className="border-l-2 border-indigo-500/40 pl-6 py-2 text-lg text-indigo-200/80 italic leading-relaxed font-medium">
                            {trimmed.replace(/^>\s*/, '')}
                        </blockquote>
                    );
                }

                // Bold heading (lines starting with **)
                if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                    return (
                        <h3 key={i} className="text-xl font-black text-white tracking-tight font-display mt-10 mb-4">
                            {trimmed.replace(/\*\*/g, '')}
                        </h3>
                    );
                }

                // Bullet list
                if (trimmed.startsWith('* ')) {
                    const items = trimmed.split('\n').filter(l => l.trim().startsWith('* '));
                    return (
                        <ul key={i} className="space-y-3 pl-1">
                            {items.map((item, j) => (
                                <li key={j} className="flex items-start gap-3 text-slate-400 leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 mt-2.5 flex-shrink-0" />
                                    <span>{item.replace(/^\*\s*/, '')}</span>
                                </li>
                            ))}
                        </ul>
                    );
                }

                // Regular paragraph — handle inline bold
                const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
                return (
                    <p key={i} className="text-slate-400 leading-[1.9] text-[17px]">
                        {parts.map((part, j) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="text-white font-semibold">{part.replace(/\*\*/g, '')}</strong>;
                            }
                            return <span key={j}>{part}</span>;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

export default function BlogShow({ post, recentPosts = [] }) {
    if (!post) return null;

    return (
        <MarketingLayout
            title={`${post.title} — VenQore Blog`}
            description={post.excerpt}
        >
            {/* ── 1. ARTICLE HEADER ───────────────────────────── */}
            <section className="relative pt-40 pb-16 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* Back link */}
                    <RevealOnScroll>
                        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-400 transition-colors mb-12 group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Back to Blog</span>
                        </Link>
                    </RevealOnScroll>

                    {/* Meta */}
                    <RevealOnScroll delay={0.05}>
                        <div className="flex items-center gap-4 mb-8">
                            <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-[0.2em] uppercase">
                                {post.category}
                            </span>
                            <span className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5">
                                <Clock size={11} /> {post.date}
                            </span>
                        </div>
                    </RevealOnScroll>

                    {/* Title */}
                    <RevealOnScroll delay={0.1}>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.05] mb-8 font-display">
                            {post.title}
                        </h1>
                    </RevealOnScroll>

                    {/* Excerpt */}
                    <RevealOnScroll delay={0.15}>
                        <p className="text-xl text-slate-400 leading-relaxed mb-8 font-medium">
                            {post.excerpt}
                        </p>
                    </RevealOnScroll>

                    {/* Author / Share */}
                    <RevealOnScroll delay={0.2}>
                        <div className="flex items-center justify-between py-6 border-y border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-black">
                                    {post.author?.charAt(0) || 'V'}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{post.author}</div>
                                    <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">{post.date}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-slate-600 hover:text-white hover:border-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <Share2 size={12} /> Share
                            </button>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 2. ARTICLE BODY ─────────────────────────────── */}
            <section className="pb-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <RevealOnScroll>
                        <ArticleContent content={post.content} />
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 3. RELATED POSTS ────────────────────────────── */}
            {recentPosts.length > 0 && (
                <section className="py-24 px-6 border-t border-white/5">
                    <div className="max-w-5xl mx-auto">
                        <RevealOnScroll>
                            <div className="flex items-center justify-between mb-12">
                                <h2 className="text-2xl font-black text-white tracking-tight font-display">More from The Signal</h2>
                                <Link href="/blog" className="text-indigo-400 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 hover:gap-3 transition-all">
                                    All Posts <ArrowRight size={12} />
                                </Link>
                            </div>
                        </RevealOnScroll>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {recentPosts.filter(p => p.slug !== post.slug).slice(0, 3).map((p, i) => (
                                <RelatedPost key={p.uid || i} post={p} index={i} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── 4. CTA ──────────────────────────────────────── */}
            <section className="py-24 px-6 text-center">
                <RevealOnScroll>
                    <div className="max-w-2xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter font-display mb-4">
                            Ready The See the <span className="text-indigo-400">Difference?</span>
                        </h2>
                        <p className="text-slate-500 mb-8">14-day free trial. No credit card required.</p>
                        <MagneticButton href="/register" variant="primary">
                            Start Free Trial <ArrowRight size={16} />
                        </MagneticButton>
                    </div>
                </RevealOnScroll>
            </section>
        </MarketingLayout>
    );
}
