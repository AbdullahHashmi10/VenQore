import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, User, ArrowRight, Share2, Bookmark } from 'lucide-react';

const BlogShow = ({ post, recentPosts }) => {
    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans selection:bg-indigo-500/40">
            <Head title={`${post.title} — VenQore Blog`} />
            
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-900/5 rounded-full blur-[160px]" />
                <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] bg-violet-900/5 rounded-full blur-[140px]" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 py-8 px-6 backdrop-blur-md bg-[#020010]/50 sticky top-0 border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/blog" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Blog
                    </Link>
                    <Link href="/" className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                        <img src="/images/logo.png" alt="VenQore" className="h-8 w-auto" />
                        <span className="font-black text-white text-lg uppercase tracking-tighter hidden sm:block">VenQore</span>
                    </Link>
                    <div className="flex gap-4">
                        <button className="p-2 text-slate-400 hover:text-white transition-colors"><Share2 size={18} /></button>
                        <button className="p-2 text-slate-400 hover:text-white transition-colors"><Bookmark size={18} /></button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-16 pb-24 px-6">
                <article className="max-w-4xl mx-auto">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-4 py-1 bg-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest text-white">
                                {post.category}
                            </span>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <Calendar size={12} />
                                {post.date}
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[0.9] text-glow">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 w-fit">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                                VQ
                            </div>
                            <div>
                                <div className="text-sm font-bold text-white">{post.author}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Editorial Board</div>
                            </div>
                        </div>
                    </div>

                    <div className="aspect-[21/9] bg-slate-800 rounded-[2.5rem] mb-16 overflow-hidden border border-white/10 shadow-2xl">
                         <div className="w-full h-full bg-gradient-to-br from-indigo-900/40 to-purple-900/40 flex items-center justify-center">
                            <h2 className="text-4xl font-black opacity-20 tracking-tighter uppercase italic">{post.title}</h2>
                         </div>
                    </div>

                    <div className="prose prose-invert prose-indigo max-w-none text-slate-300">
                        <div className="text-xl md:text-2xl leading-relaxed font-light text-slate-400 mb-12 italic border-l-4 border-indigo-500 pl-8">
                            {post.excerpt}
                        </div>
                        
                        {/* Split content by newlines and render paragraphs */}
                        <div className="space-y-8 text-lg leading-relaxed">
                            {post.content.split('\n\n').map((paragraph, i) => {
                                if (paragraph.startsWith('**')) {
                                    return <h3 key={i} className="text-3xl font-black text-white mt-12 mb-6 tracking-tight">{paragraph.replace(/\*\*/g, '')}</h3>
                                }
                                if (paragraph.startsWith('* ')) {
                                    const listItems = paragraph.split('\n');
                                    return (
                                        <ul key={i} className="space-y-4 list-none">
                                            {listItems.map((item, j) => (
                                                <li key={j} className="flex gap-4">
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2.5 shrink-0" />
                                                    {item.replace('* ', '')}
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                }
                                if (paragraph.startsWith('>')) {
                                    return (
                                        <div key={i} className="p-8 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/30 text-indigo-200 font-medium italic relative overflow-hidden my-12">
                                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                                <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V3L20.017 3C21.1216 3 22.017 3.89543 22.017 5V19C22.017 20.1046 21.1216 21 20.017 21H14.017ZM3.017 21L3.017 18C3.017 16.8954 3.91243 16 5.017 16H8.017C8.56928 16 9.017 15.5523 9.017 15V9C9.017 8.44772 8.56928 8 8.017 8H5.017C3.91243 8 3.017 7.10457 3.017 6V3L9.017 3C10.1216 3 11.017 3.89543 11.017 5V19C11.017 20.1046 10.1216 21 9.017 21H3.017Z" /></svg>
                                            </div>
                                            {paragraph.replace('> ', '')}
                                        </div>
                                    )
                                }
                                return <p key={i} className="text-slate-300">{paragraph}</p>
                            })}
                        </div>
                    </div>

                    {/* Footer CTAs */}
                    <div className="mt-24 pt-16 border-t border-white/5">
                        <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-indigo-600 to-purple-700 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 mix-blend-overlay" />
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter leading-none relative z-10">
                                Stop building on <br /> fabricated data.
                            </h2>
                            <p className="text-indigo-100 mb-10 text-lg relative z-10 max-w-xl mx-auto">
                                Join businesses that demand financial truth. Start your 14-day free trial today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                                <Link href="/register" className="px-10 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 shadow-xl shadow-indigo-900/20">
                                    Start Free Trial
                                </Link>
                                <a href="/demo/start" className="px-10 py-4 bg-black/20 border border-white/20 rounded-full font-bold text-lg hover:bg-black/30 transition-all backdrop-blur-sm">
                                    Launch Live Demo
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Recent Posts */}
                    <div className="mt-24">
                        <h3 className="text-2xl font-black text-white mb-8 tracking-tight flex items-center justify-between">
                            More from VenQore
                            <Link href="/blog" className="text-sm font-bold text-indigo-400 hover:text-white transition-colors flex items-center gap-1.5">
                                View all <ArrowRight size={14} />
                            </Link>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {recentPosts.filter(p => p.slug !== post.slug).map(p => (
                                <Link key={p.slug} href={`/blog/${p.slug}`} className="group p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all">
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-3">{p.category}</span>
                                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors leading-tight">{p.title}</h4>
                                    <p className="text-slate-500 text-sm line-clamp-2">{p.excerpt}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </article>
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
            
            <style>{`
                .text-glow {
                    text-shadow: 0 0 40px rgba(99, 102, 241, 0.4);
                }
            `}</style>
        </div>
    );
};

export default BlogShow;
