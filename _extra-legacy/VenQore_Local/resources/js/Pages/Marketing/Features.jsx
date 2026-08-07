import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    ShieldCheck, Calculator, Boxes, Cpu, Zap, 
    RefreshCw, BarChart3, Globe, ScanBarcode, ArrowRight,
    CheckCircle2, FileText, Database, Layers
} from 'lucide-react';

const FeaturePillar = ({ icon: Icon, title, description, features }) => (
    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 hover:bg-white/[0.07] transition-all group">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-8 group-hover:scale-110 transition-transform">
            <Icon size={32} />
        </div>
        <h2 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase">{title}</h2>
        <p className="text-slate-400 mb-10 leading-relaxed font-medium">{description}</p>
        <ul className="space-y-4">
            {features.map((f, i) => (
                <li key={i} className="flex gap-3 text-sm font-bold text-slate-300">
                    <CheckCircle2 size={18} className="text-indigo-500 shrink-0" />
                    {f}
                </li>
            ))}
        </ul>
    </div>
);

const FeaturePage = () => {
    const reports = [
        "P&L Statement", "Balance Sheet", "Cash Flow", "Tax Report (VAT/GST)", "Stock Valuation",
        "Sale Aging", "Purchase Aging", "Day Book", "Party Statement", "Account Ledger",
        "Profit/Loss (Item Wise)", "Expense by Category", "Low Stock Alert", "Movement History",
        "Expiry Report", "Trial Balance", "Discount Report", "Sale Orders", "Bill-wise Profit",
        "Stock Summary", "Item Detail", "Loan Statement", "Tax Rate Report", "Item Profit/Loss",
        "Production Logs", "Manufacturing Cost", "Staff Performance", "Attendance Summary",
        "Customer Retention", "Churn Analysis", "Forecast (Stock)", "Forecast (Sales)",
        "Audit Trail", "Security Log", "Webhook History", "Inventory Adjustments", "Warehouse Transfers", "Global Analytics"
    ];

    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans selection:bg-indigo-500/40">
            <Head title="Platform Features — VenQore" />
            
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[160px]" />
                <div className="absolute top-[30%] right-[-10%] w-[50vw] h-[50vw] bg-purple-900/5 rounded-full blur-[140px]" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 py-8 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/images/logo.png" alt="VenQore" className="h-10 w-auto" />
                        <span className="font-black text-white text-xl uppercase tracking-tighter">VenQore</span>
                    </Link>
                    <div className="flex gap-8 items-center text-xs font-black uppercase tracking-widest text-slate-400">
                        <Link href="/features" className="text-white">Features</Link>
                        <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
                        <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
                        <Link href="/login" className="px-6 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all font-black">Sign In</Link>
                    </div>
                </div>
            </nav>

            <main className="relative z-10">
                {/* Header */}
                <section className="pt-24 pb-32 px-6 text-center">
                    <h1 className="text-7xl md:text-[9rem] font-black tracking-[0.05em] mb-10 leading-[0.8] uppercase opacity-10 absolute left-1/2 -translate-x-1/2 -top-12 pointer-events-none whitespace-nowrap">
                        CAPABILITIES
                    </h1>
                    <div className="relative z-10">
                        <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase leading-none">
                            The Complete <br /><span className="text-indigo-500">Truth Stack.</span>
                        </h2>
                        <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                            Every module built on a foundation of double-entry bookkeeping and immutable audit trails.
                        </p>
                    </div>
                </section>

                {/* The 4 Pillars */}
                <section className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FeaturePillar 
                        icon={ShieldCheck}
                        title="Truth-First Financials"
                        description="Professional accounting hidden behind an intuitive operation workflow. You run the business, we run the math."
                        features={[
                            "Double-Entry Core (Every sale posts a journal)",
                            "FIFO Inventory (Batch-level COGS tracking)",
                            "Tax Separation (VAT/GST handled automatically)",
                            "Immutable Ledger (No silent edits to posted data)",
                            "Audit Proof Logs (Trace every button click)"
                        ]}
                    />
                    <FeaturePillar 
                        icon={Zap}
                        title="Professional POS"
                        description="A keyboard-first sales interface designed for extreme speed and environment resilience."
                        features={[
                            "25+ Keyboard Shortcuts (Zero mouse needed)",
                            "Multi-Tab Management (10 orders at once)",
                            "Offline Airbag (Local cart persistence)",
                            "Hybrid Sync (Works with unstable power)",
                            "Quick Returns / Parked Sales"
                        ]}
                    />
                    <FeaturePillar 
                        icon={Layers}
                        title="Operational Mastery"
                        description="Control your inventory and movement across any number of staff and locations."
                        features={[
                            "Multi-Warehouse Sync",
                            "Inter-Branch Transfers",
                            "Assembly (BOM) & Manufacturing",
                            "Staff Hierarchy (RBAC Controls)",
                            "Kiosk Lockdown Mode"
                        ]}
                    />
                    <FeaturePillar 
                        icon={Cpu}
                        title="Predictive AI"
                        description="Intelligence that speaks to you before problems happen. Forecasts, alerts, and retention."
                        features={[
                            "Retention Engine (Alerts for quiet customers)",
                            "Stock Depletion Forecasting",
                            "Churn Probability Score",
                            "Automatic Anomaly Detection",
                            "Intelligence Dashboard"
                        ]}
                    />
                </section>

                {/* 38 Reports Section */}
                <section className="py-32 px-6 bg-white/[0.01] border-y border-white/5">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-20">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 uppercase">
                                38 Auditor-Grade <br /><span className="text-indigo-500">Master Reports.</span>
                            </h2>
                            <p className="text-slate-400 text-lg font-medium">Standard on every plan. No hidden report fees.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {reports.map((r, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-sm font-bold text-slate-400 group hover:bg-white/10 transition-all">
                                    <FileText size={16} className="text-indigo-500 opacity-50 group-hover:opacity-100" />
                                    {r}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Deep Dive Grid */}
                <section className="py-32 px-6 max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Everything Else.</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div>
                            <ScanBarcode size={40} className="text-indigo-400 mb-6" />
                            <h4 className="text-xl font-bold text-white mb-4">Device Support</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Barcode scanners, thermal printers (ESC/POS), label printers, and customer-facing displays. Plug and play.</p>
                        </div>
                        <div>
                            <Globe size={40} className="text-indigo-400 mb-6" />
                            <h4 className="text-xl font-bold text-white mb-4">eCommerce Sync</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Real-time two-way sync with WooCommerce. Sell online and in-store from one unified inventory.</p>
                        </div>
                        <div>
                            <Database size={40} className="text-indigo-400 mb-6" />
                            <h4 className="text-xl font-bold text-white mb-4">Secure Hosting</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">Hosted on SOC 2 compliant infrastructure with hourly backups and point-in-time recovery.</p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-32 px-6 text-center">
                    <div className="max-w-4xl mx-auto p-16 rounded-[4rem] bg-indigo-600 relative overflow-hidden">
                         <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-20 mix-blend-overlay" />
                         <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter uppercase relative z-10">Stop Guessing. <br />Start Knowing.</h2>
                         <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <Link href="/register" className="px-12 py-5 bg-white text-black rounded-full font-black text-xl hover:bg-slate-100 transition-all shadow-xl">Start Free Trial</Link>
                            <a href="/demo/start" className="px-12 py-5 bg-black/20 border border-white/10 rounded-full font-black text-xl hover:bg-black/30 transition-all backdrop-blur-sm">Launch Live Demo</a>
                         </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/5 py-12 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <span className="text-slate-600 text-sm">© 2026 VenQore. All capabilities verified.</span>
                    <div className="flex gap-8 text-sm text-slate-500 uppercase font-black tracking-widest text-[10px]">
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default FeaturePage;
