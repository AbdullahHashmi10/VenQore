import React from 'react';
import MarketingLayout, {
    RevealOnScroll, MagneticButton, SectionLabel
} from '../Shared/MarketingLayout';
import { Link } from '@inertiajs/react';
import {
    ArrowRight, Clock, Tag, ChevronRight, BookOpen, Sparkles
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
   BLOG INDEX — "The Signal"
   Visual Concept: An editorial magazine layout. Clean, spacious,
   typographically driven. Featured article takes full width with
   dramatic treatment. Grid below is tight and scannable.
   ═══════════════════════════════════════════════════════════════════════ */

const FeaturedPost = ({ post }) => (
    <RevealOnScroll>
        <Link href={`/blog/${post.slug}`} className="block group">
            <div className="relative rounded-[3rem] bg-white/[0.02] border border-white/[0.06] overflow-hidden hover:border-indigo-500/20 hover:bg-white/[0.04] transition-all duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image / Visual */}
                    <div className="relative aspect-[16/10] lg:aspect-auto bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 vq-grid-pattern opacity-50" />
                        <div className="relative text-center p-12">
                            <div className="text-8xl font-black text-white/[0.04] font-display tracking-tighter leading-none group-hover:text-white/[0.06] transition-colors duration-700">01</div>
                            <BookOpen size={48} className="text-indigo-500/20 mx-auto mt-4 group-hover:text-indigo-500/30 group-hover:scale-110 transition-all duration-700" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-[0.2em] uppercase">
                                {post.category}
                            </span>
                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <Clock size={10} /> {post.date}
                            </span>
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-4 font-display group-hover:text-indigo-100 transition-colors">
                            {post.title}
                        </h2>
                        <p className="text-slate-500 leading-relaxed mb-8 line-clamp-3">
                            {post.excerpt}
                        </p>

                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-600 font-bold">{post.author}</span>
                            <span className="text-indigo-400 text-xs font-bold uppercase tracking-[0.15em] flex items-center gap-2 group-hover:gap-3 transition-all">
                                Read Article <ArrowRight size={13} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    </RevealOnScroll>
);

const PostCard = ({ post, index }) => (
    <RevealOnScroll delay={index * 0.1}>
        <Link href={`/blog/${post.slug}`} className="block group h-full">
            <div className="rounded-[2rem] bg-white/[0.02] border border-white/[0.06] overflow-hidden hover:border-indigo-500/20 hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
                {/* Visual Header */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 vq-dot-pattern" />
                    <div className="text-6xl font-black text-white/[0.03] font-display tracking-tighter group-hover:text-white/[0.05] transition-colors duration-500">
                        {String(index + 2).padStart(2, '0')}
                    </div>
                </div>

                {/* Content */}
                <div className="p-7 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {post.category}
                        </span>
                        <span className="text-[10px] text-slate-700 font-bold">{post.date}</span>
                    </div>

                    <h3 className="text-lg font-black text-white tracking-tight leading-snug mb-3 font-display group-hover:text-indigo-100 transition-colors flex-1">
                        {post.title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-5 line-clamp-2">
                        {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                        <span className="text-[10px] text-slate-700 font-bold">{post.author}</span>
                        <ChevronRight size={14} className="text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                    </div>
                </div>
            </div>
        </Link>
    </RevealOnScroll>
);

export default function BlogIndex({ posts = [] }) {
    const featured = posts[0];
    const rest = posts.slice(1);

    return (
        <MarketingLayout
            title="Blog — VenQore"
            description="Insights on financial accuracy, inventory management, and building operations that don't lie about your numbers."
        >
            {/* ── 1. HERO ─────────────────────────────────────── */}
            <section className="relative pt-40 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <RevealOnScroll>
                        <SectionLabel icon={Sparkles}>The Signal</SectionLabel>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.1}>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-6 font-display">
                            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">Ideas That</span>{' '}
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent vq-text-glow">Matter.</span>
                        </h1>
                    </RevealOnScroll>
                    <RevealOnScroll delay={0.2}>
                        <p className="text-lg text-slate-500 max-w-xl mx-auto">
                            Deep dives into financial accuracy, operational control, and the hidden mechanics that make or break a business.
                        </p>
                    </RevealOnScroll>
                </div>
            </section>

            {/* ── 2. FEATURED POST ────────────────────────────── */}
            {featured && (
                <section className="py-8 px-6">
                    <div className="max-w-6xl mx-auto">
                        <FeaturedPost post={featured} />
                    </div>
                </section>
            )}

            {/* ── 3. POST GRID ────────────────────────────────── */}
            {rest.length > 0 && (
                <section className="py-16 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rest.map((post, i) => (
                                <PostCard key={post.uid || i} post={post} index={i} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── 4. NEWSLETTER CTA ──────────────────────────── */}
            <section className="py-32 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <RevealOnScroll>
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[3rem] p-12 md:p-16 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter font-display mb-4">
                                Stay <span className="text-indigo-400">Sharp.</span>
                            </h2>
                            <p className="text-slate-500 mb-10 max-w-sm mx-auto">
                                Get our best thinking on financial accuracy and operational control. No spam. No filler.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="flex-1 w-full px-6 py-4 bg-white/[0.04] border border-white/[0.08] rounded-full text-white text-sm placeholder:text-slate-700 outline-none focus:border-indigo-500/40 transition-colors"
                                />
                                <MagneticButton variant="accent" className="whitespace-nowrap w-full sm:w-auto justify-center">
                                    Subscribe
                                </MagneticButton>
                            </div>
                        </div>
                    </RevealOnScroll>
                </div>
            </section>
        </MarketingLayout>
    );
}
