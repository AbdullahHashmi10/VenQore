import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Boxes, Quote, Target, Heart, Eye } from 'lucide-react';

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans selection:bg-indigo-500/40">
            <Head title="Our Story — VenQore" />
            
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-indigo-900/5 rounded-full blur-[160px]" />
                <div className="absolute bottom-[20%] left-[-10%] w-[60vw] h-[60vw] bg-purple-900/5 rounded-full blur-[140px]" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 py-8 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/logo.png" alt="VenQore" className="h-10 w-auto" />
                        <span className="font-black text-white text-xl uppercase tracking-tighter">VenQore</span>
                    </Link>
                    <div className="flex gap-8 items-center text-xs font-black uppercase tracking-widest text-slate-500">
                        <Link href="/features" className="hover:text-white transition-colors">Features</Link>
                        <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <Link href="/login" className="px-6 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all font-black">Sign In</Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">
                {/* Hero */}
                <section className="pt-24 pb-32 px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-indigo-400 text-sm font-black uppercase tracking-[0.4em] mb-10">Obsession with Truth</h2>
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-12 uppercase leading-[0.85]">
                            The Alternative <br /> Was <span className="text-indigo-500 italic">Unacceptable.</span>
                        </h1>
                        <p className="text-2xl md:text-3xl text-slate-400 font-medium leading-relaxed mb-16">
                            We spent years watching business owners struggle with software that approximations. We decided the guessing game had to stop.
                        </p>
                    </div>
                </section>

                {/* Narrative Section */}
                <section className="py-24 px-6 bg-white/[0.01] border-y border-white/5">
                    <div className="max-w-4xl mx-auto space-y-12 text-lg md:text-xl text-slate-300 leading-relaxed font-medium">
                        <p>VenQore didn't start in a boardroom. It started in the back office of a retail shop, looking at a "Sale Report" that didn't match the bank statement, and a "Stock Value" that didn't match the shelves.</p>
                        <p>We realized that most retail software was built by developers who understood "code," but didn't understand "ledger." They built beautiful interfaces on top of broken math.</p>
                        <div className="p-12 rounded-[3.5rem] bg-indigo-600/5 border border-indigo-500/20 relative">
                             <Quote size={40} className="text-indigo-500 mb-8 opacity-50" />
                             <p className="text-2xl md:text-3xl font-black text-white tracking-tight italic">"Your software should be the most honest employee in your company. If it isn't giving you the absolute truth, it's working against you."</p>
                        </div>
                        <p>We spent 18 months rebuilding the core engine before we even designed the first POS screen. We built a system where every action — a sale, a return, a transfer, a payment — creates a verified, immutable journal entry in a double-entry ledger. We brought auditor-grade discipline to the front-end operator.</p>
                        <p>Today, VenQore is the choice for operators who are done with approximations. We're here for the people who demand that their books be right, every single day.</p>
                    </div>
                </section>

                {/* Values */}
                <section className="py-32 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                   <div>
                        <Target size={40} className="text-indigo-500 mb-6" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 text-glow">Integrity of Data</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">No silent edits. No overwritten costs. No approximations. We value the proof in the ledger above all else.</p>
                   </div>
                   <div>
                        <Eye size={40} className="text-indigo-500 mb-6" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 text-glow">Operational Clarity</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Software should clarify, not complicate. We build powerful tools that feel intuitive to the human using them.</p>
                   </div>
                   <div>
                        <Heart size={40} className="text-indigo-500 mb-6" />
                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4 text-glow">Long-term Growth</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">Our AI isn't a gimmick. It's a retention engine designed to build sustainable, repeat-customer revenue.</p>
                   </div>
                </section>

                {/* Final CTA */}
                <section className="py-32 px-6 text-center">
                    <h2 className="text-4xl font-black text-white mb-10 tracking-tighter uppercase">Join the Era of Financial Truth.</h2>
                    <Link href="/register" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-black text-xl hover:bg-slate-100 transition-all hover:scale-105 shadow-2xl">
                        Become a Member →
                    </Link>
                </section>
            </main>

            <footer className="border-t border-white/5 py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">© 2026 VenQore. Truth at the Core.</span>
                    <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default AboutPage;
