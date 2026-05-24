import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Check, Boxes, ArrowRight, Zap, ShieldCheck, Globe, Building2 } from 'lucide-react';

const PricingCard = ({ plan, price, description, features, accent, badge, ctaLabel }) => (
    <div className={`relative rounded-[3.5rem] p-px overflow-hidden group ${accent ? 'bg-gradient-to-b from-indigo-500 to-purple-600' : 'bg-white/10'}`}>
        {badge && (
            <div className="absolute top-8 right-[-35px] rotate-45 bg-gradient-to-r from-indigo-500 to-purple-600 px-12 py-1.5 text-[10px] font-black uppercase tracking-widest text-white z-20 shadow-lg">
                {badge}
            </div>
        )}
        <div className={`rounded-[3.4rem] p-10 h-full flex flex-col relative z-10 ${accent ? 'bg-[#020010]' : 'bg-white/5 backdrop-blur-sm'}`}>
            <div className="mb-10">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">{plan}</h3>
                <div className="flex items-end gap-2 mb-6">
                    <span className="text-6xl font-black text-white tracking-tighter">${price}</span>
                    <span className="text-slate-500 font-bold mb-2 uppercase text-xs tracking-widest">/ Month</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">{description}</p>
            </div>
            
            <div className="flex-1 space-y-5 mb-12">
                {features.map((f, i) => (
                    <div key={i} className="flex gap-4">
                        <Check size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-slate-300 leading-tight">{f}</span>
                    </div>
                ))}
            </div>

            <Link 
                href="/register" 
                className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.02] text-center ${
                    accent 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20' 
                        : 'bg-white text-black hover:bg-indigo-50'
                }`}
            >
                {ctaLabel}
            </Link>
        </div>
    </div>
);

const PricingPage = () => {
    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans selection:bg-indigo-500/40 pb-24">
            <Head title="Pricing Plans — VenQore" />
            
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-indigo-900/5 rounded-full blur-[160px] animate-pulse" />
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
                        <Link href="/pricing" className="text-white">Pricing</Link>
                        <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <Link href="/login" className="px-6 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all font-black">Sign In</Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 pt-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-indigo-400 text-sm font-black uppercase tracking-[0.4em] mb-10">Absolute Transparency</h2>
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 uppercase leading-none">
                            Scale Without <br /><span className="text-indigo-500">The Drama.</span>
                        </h1>
                        <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                            No hidden fees. No "per-report" costs. Auditor-grade financials on every plan.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                        <PricingCard 
                            plan="Solo"
                            price="19"
                            description="For the single-terminal shop that demands exact numbers."
                            features={[
                                "Single Location",
                                "Unlimited Sales / Month",
                                "FIFO Batch Tracking",
                                "Full Accounting Ledger",
                                "38 Auditor Reports",
                                "Email Support"
                            ]}
                            ctaLabel="Start Trial"
                        />
                        <PricingCard 
                            plan="Growth"
                            price="39"
                            description="The professional choice for scaling a modern brand."
                            features={[
                                "Unlimited Warehouses",
                                "WooCommerce Two-Way Sync",
                                "AI Retention Engine",
                                "AI Churn Forecasting",
                                "Manager RBAC Controls",
                                "Priority 24/7 Support"
                            ]}
                            accent={true}
                            badge="Recommended"
                            ctaLabel="Scale Now"
                        />
                        <PricingCard 
                            plan="Multi-Loc"
                            price="79"
                            description="Central command for multi-branch retail empires."
                            features={[
                                "Inter-Branch Stock Transfers",
                                "Branch-wise P&L Comparison",
                                "Centralized Pricing Control",
                                "Consolidated Financials",
                                "Dedicated Success Manager",
                                "Onboarding Assistance"
                            ]}
                            ctaLabel="Go Enterprise"
                        />
                        <PricingCard 
                            plan="Enterprise"
                            price="199"
                            description="Total control for high-volume enterprise operations."
                            features={[
                                "White-Label Options",
                                "Custom REST API Access",
                                "Audit-Log SIEM Export",
                                "On-Prem Backup Engine",
                                "Custom Feature Requests",
                                "SLA Guarantees"
                            ]}
                            ctaLabel="Contact Sales"
                        />
                    </div>

                    {/* FAQ Mini */}
                    <div className="mt-32 max-w-2xl mx-auto text-center">
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-4">Common Question</p>
                        <h3 className="text-2xl font-black text-white mb-6 tracking-tight italic">"What happens if I outgrow my plan?"</h3>
                        <p className="text-slate-400 leading-relaxed font-medium">VenQore is built to grow with you. Upgrading takes 30 seconds and your data doesn't move. No downtime, no migration, no friction.</p>
                    </div>

                    {/* Logo Cloud / Trust */}
                    <div className="mt-32 border-t border-white/5 pt-20 flex flex-col md:flex-row items-center justify-center gap-16 grayscale opacity-30">
                        <ShieldCheck size={48} />
                        <Building2 size={48} />
                        <Globe size={48} />
                        <Zap size={48} />
                        <ShieldCheck size={48} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PricingPage;
