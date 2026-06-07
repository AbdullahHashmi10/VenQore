import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Shield, Clock, CreditCard, Mail, ArrowLeft } from 'lucide-react';

/**
 * RefundPolicy.jsx — Phase 7
 *
 * Required by AppSumo before campaign approval.
 * 60-day money-back guarantee per AppSumo's standard.
 * URL: /refund-policy
 */
export default function RefundPolicy() {
    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans">
            <Head>
                <title>Refund Policy — VenQore</title>
                <meta name="description" content="VenQore's refund policy for AppSumo Lifetime Deal purchases. 60-day money-back guarantee." />
            </Head>

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-15 mix-blend-overlay" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/images/logo.png" alt="VenQore" className="h-9 object-contain" />
                    <span className="font-black text-lg text-white">VenQore<span className="text-indigo-400">.</span></span>
                </Link>
                <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Back to Home
                </Link>
            </nav>

            <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Shield size={26} className="text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-white">Refund Policy</h1>
                        <p className="text-slate-500 text-sm mt-1">Last updated: April 2025</p>
                    </div>
                </div>

                {/* AppSumo highlight */}
                <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-10">
                    <div className="flex items-start gap-4">
                        <Clock size={22} className="text-orange-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-orange-300 mb-1">AppSumo Lifetime Deal — 60-Day Guarantee</p>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                All AppSumo purchases of VenQore are covered by AppSumo's standard 60-day money-back
                                guarantee. You may request a full refund within 60 days of your purchase through
                                AppSumo's platform — no questions asked.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Policy sections */}
                <div className="space-y-10 text-slate-300 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. AppSumo Purchases</h2>
                        <p>
                            VenQore participates in AppSumo's standard refund policy. For any AppSumo Lifetime Deal
                            (LTD) purchase, you are entitled to a full refund within <strong className="text-white">60 calendar days</strong> of
                            your original purchase date. To request a refund for an AppSumo purchase, visit your
                            AppSumo dashboard or contact AppSumo support directly at{' '}
                            <a href="mailto:hello@appsumo.com" className="text-indigo-400 hover:underline">hello@appsumo.com</a>.
                        </p>
                        <p className="mt-3">
                            If you have stacked multiple codes and request a refund, the refund applies per code.
                            Refunding a code will result in a plan downgrade to the next lower tier. Refunding all
                            codes will deactivate your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Monthly / Annual Subscriptions</h2>
                        <p>
                            For paid monthly or annual subscriptions (Starter $19/mo, Growth $39/mo, Business $79/mo),
                            you may cancel at any time. Cancellation takes effect at the end of the current billing
                            period — you will not be charged for the following period.
                        </p>
                        <p className="mt-3">
                            We do not offer prorated refunds for the remaining days of a billing period. If you
                            experience a technical issue that prevented you from using the service, contact support
                            within 7 days and we will review your case.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. Hosting After LTD Period</h2>
                        <p>
                            AppSumo LTD codes include <strong className="text-white">2 years of hosting</strong> on venqore.com.
                            After this period, you have two options:
                        </p>
                        <ul className="list-disc list-inside mt-3 space-y-2 text-slate-400">
                            <li><strong className="text-white">Continue hosted:</strong> $9/month (no feature limitations based on LTD tier)</li>
                            <li><strong className="text-white">Self-host:</strong> Export your data and run VenQore on your own server at no cost</li>
                        </ul>
                        <p className="mt-3">
                            The 2-year hosting clock starts at the time of code redemption, not purchase.
                            We will send reminder emails at 90 days and 30 days before hosting expiry.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Data Retention After Cancellation</h2>
                        <p>
                            After account cancellation or expiry, your data is retained for <strong className="text-white">30 days</strong> to
                            allow for data export. After 30 days, all data is permanently deleted. You may request
                            immediate deletion by emailing{' '}
                            <a href="mailto:privacy@venqore.com" className="text-indigo-400 hover:underline">privacy@venqore.com</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Contact</h2>
                        <div className="flex flex-col sm:flex-row gap-4 mt-2">
                            <a href="mailto:support@venqore.com" className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors">
                                <Mail size={18} className="text-indigo-400" />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Email</p>
                                    <p className="text-white text-sm font-medium">support@venqore.com</p>
                                </div>
                            </a>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                <Clock size={18} className="text-emerald-400" />
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Response Time</p>
                                    <p className="text-white text-sm font-medium">Within 12 hours</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-sm text-slate-600">
                    <p>© {new Date().getFullYear()} VenQore. All rights reserved.</p>
                    <Link href="/" className="hover:text-slate-400 transition-colors">venqore.com</Link>
                </div>
            </div>
        </div>
    );
}
