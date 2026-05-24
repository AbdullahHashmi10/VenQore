import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Calendar, User, ChevronRight } from 'lucide-react';

const BlogIndex = ({ posts }) => {
    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans selection:bg-indigo-500/40">
            <Head title="VenQore Blog — Financial Truth & Business Growth" />
            
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-900/10 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] bg-violet-900/5 rounded-full blur-[140px]" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 py-8 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/logo.png" alt="VenQore" className="h-10 w-auto" />
                        <span className="font-black text-white text-xl uppercase tracking-tighter">VenQore</span>
                    </Link>
                    <div className="flex gap-8 items-center">
                        <Link href="/features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</Link>
                        <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link>
                        <Link href="/blog" className="text-sm text-white font-bold border-b-2 border-indigo-500 pb-1">Blog</Link>
                        <Link href="/login" className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-bold hover:bg-white/10 transition-all">Sign In</Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-16 pb-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-3xl mb-16">
                        <h1 className="text-6xl font-black tracking-tighter mb-6 leading-none">
                            Insights for the <br />
                            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">No-Nonsense Operator.</span>
                        </h1>
                        <p className="text-slate-400 text-xl leading-relaxed">
                            Hard truths about business data, accounting integrity, and customer retention. No fluff. No fillers.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {posts.map((post) => (
                            <Link 
                                key={post.slug} 
                                href={`/blog/${post.slug}`}
                                className="group relative bg-white/5 border border-white/10 rounded-[2.5rem] p-4 transition-all hover:bg-white/[0.07] hover:border-indigo-500/30 overflow-hidden"
                            >
                                <div className="aspect-[16/9] bg-slate-800 rounded-[1.8rem] mb-8 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#020010] to-transparent opacity-60" />
                                    <div className="absolute bottom-6 left-6 flex gap-3">
                                        <span className="px-4 py-1.5 bg-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-4 pb-4">
                                    <div className="flex items-center gap-4 text-slate-500 text-xs mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={12} />
                                            {post.date}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <User size={12} />
                                            {post.author}
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight text-white mb-4 group-hover:text-indigo-300 transition-colors leading-tight">
                                        {post.title}
                                    </h2>
                                    <p className="text-slate-400 leading-relaxed mb-6 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-widest">
                                        Read Article
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <span className="text-slate-600 text-sm">© 2026 VenQore. The Books Are Always Right.</span>
                    <div className="flex gap-8 text-sm text-slate-500">
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BlogIndex;
