import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Scale, Shield } from 'lucide-react';

/**
 * TermsOfService.jsx — Pre-Launch Checklist §12
 *
 * Required before launch.
 * URL: /terms
 */
export default function TermsOfService() {
    const lastUpdated = 'April 2025';

    const Section = ({ title, children }) => (
        <section className="mb-10">
            <h2 className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/10">{title}</h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">{children}</div>
        </section>
    );

    return (
        <div className="min-h-screen bg-[#020010] text-white font-sans">
            <Head>
                <title>Terms of Service — VenQore</title>
                <meta name="description" content="VenQore Terms of Service. Read our terms before signing up." />
            </Head>

            {/* Subtle background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/3 w-96 h-96 bg-indigo-900/10 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('/images/noise.svg')] opacity-10 mix-blend-overlay" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/images/logo.png" alt="VenQore" className="h-9 object-contain" />
                    <span className="font-black text-lg">VenQore<span className="text-indigo-400">.</span></span>
                </Link>
                <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Back to Home
                </Link>
            </nav>

            <div className="relative z-10 max-w-3xl mx-auto px-6 py-14">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <Scale size={26} className="text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Terms of Service</h1>
                        <p className="text-slate-500 text-sm mt-1">Last updated: {lastUpdated}</p>
                    </div>
                </div>

                <p className="text-slate-300 mb-10 p-4 rounded-xl bg-white/5 border border-white/10 text-sm leading-relaxed">
                    Please read these Terms of Service carefully before using VenQore. By creating an account or using any part of the Service, you agree to be bound by these terms.
                </p>

                <Section title="1. Acceptance of Terms">
                    <p>By accessing or using VenQore ("the Service"), operated by VenQore ("we," "us," or "our"), you agree to these Terms of Service and our Privacy Policy. If you do not agree to these terms, do not use the Service.</p>
                    <p>These terms apply to all users, including free trial users, paid subscribers, and AppSumo lifetime deal holders.</p>
                </Section>

                <Section title="2. Description of Service">
                    <p>VenQore is a cloud-based Point of Sale (POS) and ERP platform designed for retail businesses. The Service includes inventory management, sales tracking, accounting, reporting, and related features.</p>
                    <p>We reserve the right to modify, suspend, or discontinue any part of the Service at any time. We will provide reasonable notice of material changes.</p>
                </Section>

                <Section title="3. Account Registration">
                    <p>You must provide accurate, complete, and current information when creating an account. You are responsible for maintaining the security of your account credentials.</p>
                    <p>You are responsible for all activity that occurs under your account. Notify us immediately at <a href="mailto:support@venqore.com" className="text-indigo-400 hover:underline">support@venqore.com</a> if you suspect unauthorized access.</p>
                    <p>One account per business entity. Sharing accounts between unrelated businesses is not permitted.</p>
                </Section>

                <Section title="4. Subscription & Payment">
                    <p>Paid subscriptions are billed monthly or annually through Lemon Squeezy. By subscribing, you authorize recurring charges to your payment method.</p>
                    <p>All prices are in USD unless otherwise stated. Taxes may apply depending on your jurisdiction.</p>
                    <p>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not provide prorated refunds for partial billing periods, except as required by applicable law.</p>
                    <p><strong className="text-white">AppSumo Lifetime Deal:</strong> Holders of AppSumo LTD codes receive a perpetual software license plus 2 years of hosting. After the 2-year hosting period, continued hosting requires a $9/month hosting fee, or you may self-host at no cost.</p>
                </Section>

                <Section title="5. Free Trial">
                    <p>New accounts receive a 14-day free trial with full access to the Service. No credit card is required during the trial period. At the end of the trial, you must subscribe to continue using the Service.</p>
                    <p>Trial accounts that are not converted will have their data retained for 30 days, after which it will be permanently deleted.</p>
                </Section>

                <Section title="6. Data Ownership & Privacy">
                    <p>You own your data. We do not claim any ownership over the business data you store in VenQore (products, customers, sales records, etc.).</p>
                    <p>We will not sell, rent, or share your business data with third parties except as required to operate the Service (e.g., cloud storage providers) or as required by law.</p>
                    <p>See our <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link> for full details on data handling.</p>
                </Section>

                <Section title="7. Acceptable Use">
                    <p>You agree not to use the Service to:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>Violate any applicable law or regulation</li>
                        <li>Store or transmit illegal, harmful, or fraudulent content</li>
                        <li>Attempt to gain unauthorized access to the Service or other accounts</li>
                        <li>Reverse engineer, decompile, or create derivative works of the Service</li>
                        <li>Use automated tools to scrape or stress-test the Service without permission</li>
                        <li>Interfere with other tenants' use of the Service</li>
                    </ul>
                    <p>We reserve the right to suspend or terminate accounts that violate these terms immediately and without notice.</p>
                </Section>

                <Section title="8. Multi-Tenant Architecture & Data Isolation">
                    <p>VenQore uses a shared-infrastructure multi-tenant architecture. Your data is logically isolated from other tenants through application-level controls. We implement technical measures to prevent cross-tenant data access.</p>
                    <p>However, you acknowledge that no system is infallible. You are responsible for maintaining appropriate backups of critical business data.</p>
                </Section>

                <Section title="9. Uptime & Service Levels">
                    <p>We target 99.5% monthly uptime for the Service. Scheduled maintenance windows will be announced at least 24 hours in advance via email.</p>
                    <p>We are not responsible for downtime caused by: Cloudflare outages, DigitalOcean infrastructure failures, your internet service provider, or force majeure events.</p>
                </Section>

                <Section title="10. Limitation of Liability">
                    <p>To the maximum extent permitted by applicable law, VenQore's total liability for any claims relating to the Service shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
                    <p>We are not liable for indirect, incidental, consequential, or punitive damages, including lost profits, data loss, or business interruption.</p>
                </Section>

                <Section title="11. Termination">
                    <p>Either party may terminate this agreement at any time. Upon termination:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>Your access to the Service will be revoked</li>
                        <li>Your data will be retained for 30 days to allow export</li>
                        <li>After 30 days, all data will be permanently deleted</li>
                    </ul>
                    <p>You can export your data at any time from the Settings → Data Export section.</p>
                </Section>

                <Section title="12. Changes to Terms">
                    <p>We may update these Terms of Service from time to time. We will notify you of significant changes via email at least 14 days before they take effect. Your continued use of the Service after the effective date constitutes acceptance of the updated terms.</p>
                </Section>

                <Section title="13. Governing Law">
                    <p>These Terms of Service shall be governed by and construed in accordance with applicable international commercial law. Any disputes shall be resolved through binding arbitration.</p>
                </Section>

                <Section title="14. Contact">
                    <p>For questions about these Terms of Service:</p>
                    <p><a href="mailto:legal@venqore.com" className="text-indigo-400 hover:underline">legal@venqore.com</a></p>
                    <p>VenQore · support@venqore.com</p>
                </Section>

                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-sm text-slate-600">
                    <p>© {new Date().getFullYear()} VenQore. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
                        <Link href="/refund-policy" className="hover:text-slate-400 transition-colors">Refund Policy</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
