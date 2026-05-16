import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Check, X, Zap, Package, BarChart3, Users, Globe, Brain,
         TrendingUp, Layers, Shield, Clock, ArrowRight, Tag } from 'lucide-react';

/**
 * WhatIsIncluded.jsx — Phase 7
 *
 * The "What's Included" page required by AppSumo.
 * Shows a detailed feature comparison table across all plans.
 * URL: /what-is-included
 */
const Feature = ({ label, starter, growth, business }) => (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
        <td className="py-3.5 pr-6 text-sm text-slate-300">{label}</td>
        <td className="py-3.5 text-center">
            {starter === true ? <Check size={15} className="mx-auto text-emerald-400" /> :
             starter === false ? <X size={15} className="mx-auto text-slate-700" /> :
             <span className="text-xs text-slate-400">{starter}</span>}
        </td>
        <td className="py-3.5 text-center">
            {growth === true ? <Check size={15} className="mx-auto text-indigo-400" /> :
             growth === false ? <X size={15} className="mx-auto text-slate-700" /> :
             <span className="text-xs text-slate-300">{growth}</span>}
        </td>
        <td className="py-3.5 text-center">
            {business === true ? <Check size={15} className="mx-auto text-amber-400" /> :
             business === false ? <X size={15} className="mx-auto text-slate-700" /> :
             <span className="text-xs text-slate-300">{business}</span>}
        </td>
    </tr>
);

const Section = ({ title, children }) => (
    <>
        <tr className="bg-white/[0.03]">
            <td colSpan={4} className="py-3 px-0 text-xs font-bold text-slate-500 uppercase tracking-widest pt-6">
                {title}
            </td>
        </tr>
        {children}
    </>
);

export default function WhatIsIncluded() {
    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans">
            <Head>
                <title>What's Included — VenQore AppSumo LTD</title>
                <meta name="description" content="Full feature breakdown for VenQore's AppSumo Lifetime Deal. See exactly what's included in each tier." />
            </Head>

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/15 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 mix-blend-overlay" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/images/logo.png" alt="VenQore" className="h-9 object-contain" />
                    <span className="font-black text-lg text-white">VenQore<span className="text-indigo-400">.</span></span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href={route('appsumo.index')} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm font-bold hover:bg-orange-500/20 transition-colors">
                        <Tag size={14} /> Redeem AppSumo Code
                    </Link>
                </div>
            </nav>

            <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm font-bold mb-6">
                        <Tag size={13} /> AppSumo Lifetime Deal
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-white mb-4">
                        What's Included
                    </h1>
                    <p className="text-slate-400 text-xl max-w-2xl mx-auto">
                        One-time purchase. No hidden fees. Lifetime access to the software.
                        2 years of hosting on venqore.com included.
                    </p>
                </div>

                {/* Plan header */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden mb-6">
                    <div className="grid grid-cols-4 border-b border-white/10">
                        <div className="p-6" />
                        <div className="p-6 text-center border-l border-white/10">
                            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">1 Code</p>
                            <p className="font-bold text-white">Starter LTD</p>
                            <p className="text-2xl font-black text-white mt-1">$79</p>
                            <p className="text-xs text-slate-500 mt-1">one-time</p>
                        </div>
                        <div className="p-6 text-center border-l border-indigo-500/30 bg-indigo-500/5">
                            <p className="text-xs text-indigo-400 uppercase tracking-widest mb-1">2 Codes Stacked</p>
                            <p className="font-bold text-indigo-300">Growth LTD</p>
                            <p className="text-2xl font-black text-white mt-1">$158</p>
                            <p className="text-xs text-slate-500 mt-1">one-time</p>
                        </div>
                        <div className="p-6 text-center border-l border-amber-500/20 bg-amber-500/5">
                            <p className="text-xs text-amber-400 uppercase tracking-widest mb-1">3 Codes Stacked</p>
                            <p className="font-bold text-amber-300">Business LTD</p>
                            <p className="text-2xl font-black text-white mt-1">$237</p>
                            <p className="text-xs text-slate-500 mt-1">one-time</p>
                        </div>
                    </div>

                    <div className="p-6">
                        <table className="w-full">
                            <tbody>
                                <Section title="Limits">
                                    <Feature label="Products (SKUs)"       starter="1,000"    growth="Unlimited"  business="Unlimited" />
                                    <Feature label="Staff Accounts"         starter="3"        growth="10"         business="Unlimited" />
                                    <Feature label="Warehouse Locations"    starter="1"        growth="3"          business="Unlimited" />
                                </Section>
                                <Section title="Point of Sale">
                                    <Feature label="POS Terminal"                   starter={true}  growth={true}  business={true} />
                                    <Feature label="Keyboard / Barcode Shortcuts"   starter={true}  growth={true}  business={true} />
                                    <Feature label="Offline Mode"                   starter={true}  growth={true}  business={true} />
                                    <Feature label="Parked Sales"                   starter={true}  growth={true}  business={true} />
                                    <Feature label="Multi-Payment Methods"          starter={true}  growth={true}  business={true} />
                                    <Feature label="Credit Sales"                   starter={true}  growth={true}  business={true} />
                                    <Feature label="POS Receipts (Thermal/A4)"      starter={true}  growth={true}  business={true} />
                                </Section>
                                <Section title="Inventory">
                                    <Feature label="Product Catalog"                starter={true}  growth={true}  business={true} />
                                    <Feature label="Variants & Attributes"          starter={true}  growth={true}  business={true} />
                                    <Feature label="FIFO Costing Engine"            starter={true}  growth={true}  business={true} />
                                    <Feature label="Stock Transfers"                starter={true}  growth={true}  business={true} />
                                    <Feature label="Stock Take / Audit"             starter={true}  growth={true}  business={true} />
                                    <Feature label="Batch & Serial Tracking"        starter={true}  growth={true}  business={true} />
                                    <Feature label="Expiry Tracking"                starter={true}  growth={true}  business={true} />
                                    <Feature label="Multi-Warehouse"                starter={false} growth={true}  business={true} />
                                </Section>
                                <Section title="Sales & Purchasing">
                                    <Feature label="Invoices & Quotations"          starter={true}  growth={true}  business={true} />
                                    <Feature label="Purchase Orders"                starter={true}  growth={true}  business={true} />
                                    <Feature label="Sales & Purchase Returns"       starter={true}  growth={true}  business={true} />
                                    <Feature label="Party Ledgers (A/R & A/P)"      starter={true}  growth={true}  business={true} />
                                    <Feature label="Discount Management"            starter={true}  growth={true}  business={true} />
                                </Section>
                                <Section title="Accounting">
                                    <Feature label="Double-Entry Accounting"         starter={true}  growth={true}  business={true} />
                                    <Feature label="Bank Accounts & Payments"        starter={true}  growth={true}  business={true} />
                                    <Feature label="Expense Management"              starter={true}  growth={true}  business={true} />
                                    <Feature label="Chart of Accounts"               starter={true}  growth={true}  business={true} />
                                    <Feature label="Journal Entries"                 starter={true}  growth={true}  business={true} />
                                </Section>
                                <Section title="Reports">
                                    <Feature label="P&L / Balance Sheet / Cash Flow" starter={true}  growth={true}  business={true} />
                                    <Feature label="Tax Report"                       starter={true}  growth={true}  business={true} />
                                    <Feature label="Stock Valuation"                  starter={true}  growth={true}  business={true} />
                                    <Feature label="Advanced Reports (38 total)"      starter="20"    growth="38+"   business="38+" />
                                    <Feature label="Sale Aging / Purchase Aging"      starter={false} growth={true}  business={true} />
                                </Section>
                                <Section title="Intelligence & Growth">
                                    <Feature label="Growth Engine (AI Retention)"    starter={false} growth={true}  business={true} />
                                    <Feature label="AI Customer Insights"            starter={false} growth={true}  business={true} />
                                    <Feature label="WooCommerce Sync"                starter={false} growth={true}  business={true} />
                                    <Feature label="Public REST API"                 starter={false} growth={false} business={true} />
                                </Section>
                                <Section title="Hosting & Support">
                                    <Feature label="Included Hosting"               starter="2 Years" growth="2 Years" business="2 Years" />
                                    <Feature label="After 2 Years"                  starter="$9/mo"   growth="$9/mo"   business="$9/mo" />
                                    <Feature label="Self-Host Option"               starter={true}    growth={true}   business={true} />
                                    <Feature label="Email Support"                  starter={true}    growth={true}   business={true} />
                                    <Feature label="Priority Support"               starter={false}   growth={true}   business={true} />
                                    <Feature label="SSO"                            starter={false}   growth={false}  business={true} />
                                </Section>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Reassurance cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
                    {[
                        { icon: Shield, title: '60-Day Refund', body: "AppSumo's standard guarantee. Full refund within 60 days, no questions asked." },
                        { icon: Clock, title: '2 Years Hosting', body: 'Every code includes 2 years of hosting on venqore.com. After that, $9/month or self-host.' },
                        { icon: Layers, title: 'Stack Up to 3', body: 'Buy a second or third code within 60 days to upgrade your plan tier instantly.' },
                    ].map((c, i) => (
                        <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <c.icon size={22} className="text-indigo-400 mb-3" />
                            <p className="font-bold text-white mb-1">{c.title}</p>
                            <p className="text-slate-400 text-sm leading-relaxed">{c.body}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        href={route('appsumo.index')}
                        className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25"
                    >
                        <Tag size={16} /> Redeem Your Code <ArrowRight size={16} />
                    </Link>
                    <p className="text-slate-600 text-xs mt-4">
                        Already bought on AppSumo? Click above to activate your license.
                    </p>
                </div>
            </div>
        </div>
    );
}
