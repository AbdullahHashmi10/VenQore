import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Boxes, MessageCircle, Mail, Phone, MapPin, Send, ArrowRight } from 'lucide-react';

const ContactPage = () => {
    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans selection:bg-indigo-500/40">
            <Head title="Contact Us — VenQore" />
            
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/5 rounded-full blur-[160px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/5 rounded-full blur-[140px]" />
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

            <main className="relative z-10 pt-24 pb-32">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24">
                    {/* Left Info */}
                    <div>
                        <h2 className="text-indigo-400 text-sm font-black uppercase tracking-[0.4em] mb-10">Direct Access</h2>
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 uppercase leading-none">
                            We Don't Hide <br />Behind <span className="text-indigo-500">Tickets.</span>
                        </h1>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed mb-16 max-w-lg">
                            Whether you're a multi-location enterprise or a solo operator, you get professional attention.
                        </p>

                        <div className="space-y-12">
                            <div className="flex gap-6 group">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <MessageCircle size={28} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">WhatsApp Sales</h4>
                                    <p className="text-slate-500 mb-4 text-sm font-medium">Immediate response for demos and pricing.</p>
                                    <a href="https://wa.me/92XXXXXXXXXX" className="text-indigo-400 font-bold flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest text-xs">
                                        CHAT ON WHATSAPP <ArrowRight size={14} />
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                    <Mail size={28} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">General Inquiry</h4>
                                    <p className="text-slate-500 mb-4 text-sm font-medium">Partnerships, billing, and career inquiries.</p>
                                    <a href="mailto:hello@venqore.com" className="text-purple-400 font-bold flex items-center gap-2 hover:text-white transition-colors uppercase tracking-widest text-xs">
                                        hello@venqore.com <ArrowRight size={14} />
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-6 group">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                                    <MapPin size={28} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Presence</h4>
                                    <p className="text-slate-500 text-sm font-medium">Serving retail operators globally. <br />HQ: Islamabad, Pakistan.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Form */}
                    <div className="bg-white/5 border border-white/10 rounded-[4rem] p-12 md:p-16 relative overflow-hidden backdrop-blur-xl">
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-white tracking-tighter mb-10 uppercase">Send a Message</h3>
                            <form className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Name</label>
                                        <input type="text" placeholder="John Doe" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
                                        <input type="email" placeholder="john@business.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Subject</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none">
                                        <option className="bg-[#020010]">Sales & Demo</option>
                                        <option className="bg-[#020010]">Technical Support</option>
                                        <option className="bg-[#020010]">Billing Inquiry</option>
                                        <option className="bg-[#020010]">Partnership</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Your Message</label>
                                    <textarea rows="5" placeholder="Tell us about your business..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"></textarea>
                                </div>
                                <button type="button" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20">
                                    Initiate Contact <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto text-center flex flex-col md:flex-row items-center justify-between gap-6">
                    <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Response window: 2-4 business hours.</span>
                    <div className="flex gap-10 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
                        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ContactPage;
