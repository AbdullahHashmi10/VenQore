import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Eye } from 'lucide-react';

/**
 * PrivacyPolicy.jsx — Pre-Launch Checklist §12
 *
 * GDPR/CAN-SPAM compliant privacy policy.
 * URL: /privacy
 */
export default function PrivacyPolicy() {
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
                <title>Privacy Policy — VenQore</title>
                <meta name="description" content="VenQore Privacy Policy. How we collect, use, and protect your data." />
            </Head>

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-1/3 w-96 h-96 bg-purple-900/10 rounded-full blur-[120px]" />
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
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Eye size={26} className="text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
                        <p className="text-slate-500 text-sm mt-1">Last updated: {lastUpdated}</p>
                    </div>
                </div>

                <p className="text-slate-300 mb-10 p-4 rounded-xl bg-white/5 border border-white/10 text-sm leading-relaxed">
                    Your privacy matters to us. This policy explains exactly what data we collect, why we collect it, and how you can control it. We do not sell your data.
                </p>

                <Section title="1. What Data We Collect">
                    <p><strong className="text-white">Account Data:</strong> Name, email address, business name, and password (hashed — we never store plain-text passwords).</p>
                    <p><strong className="text-white">Business Data:</strong> Products, customers, sales records, invoices, accounting entries, and other data you create within the Service. This data belongs to you.</p>
                    <p><strong className="text-white">Usage Data:</strong> IP address, browser type, pages visited, and timestamps. Used for security monitoring and improving the Service.</p>
                    <p><strong className="text-white">Payment Data:</strong> Payment processing is handled entirely by Lemon Squeezy or AppSumo. We never see or store your full card number. We receive only a customer ID and subscription status.</p>
                    <p><strong className="text-white">Communication Data:</strong> Email addresses and your support ticket history if you contact us.</p>
                </Section>

                <Section title="2. How We Use Your Data">
                    <ul className="list-disc list-inside space-y-2 text-slate-400">
                        <li>To provide, maintain, and improve the Service</li>
                        <li>To send transactional emails (welcome, invoices, trial reminders)</li>
                        <li>To respond to support requests</li>
                        <li>To detect and prevent fraud or abuse</li>
                        <li>To comply with legal obligations</li>
                        <li>To send product updates (you can unsubscribe at any time)</li>
                    </ul>
                    <p>We do <strong className="text-white">not</strong> use your business data (products, customers, sales) for any purpose other than providing the Service to you.</p>
                </Section>

                <Section title="3. Data Sharing">
                    <p>We share your data with the following third-party service providers, only to the extent necessary to operate the Service:</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm mt-3">
                            <thead>
                                <tr className="text-slate-500 text-left border-b border-white/10">
                                    <th className="pb-2 pr-4">Provider</th>
                                    <th className="pb-2 pr-4">Purpose</th>
                                    <th className="pb-2">Data Shared</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-400">
                                {[
                                    ['Cloudflare', 'CDN, DDoS protection', 'IP address, request data'],
                                    ['DigitalOcean', 'Server hosting', 'All data (encrypted at rest)'],
                                    ['Cloudflare R2', 'File storage', 'Uploaded files (images, logos)'],
                                    ['Postmark', 'Transactional email', 'Email address, email content'],
                                    ['Lemon Squeezy', 'Payment processing', 'Email, subscription status'],
                                    ['AppSumo', 'LTD distribution', 'Email, license redemption'],
                                ].map(([provider, purpose, data], i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-2.5 pr-4 text-white font-medium">{provider}</td>
                                        <td className="py-2.5 pr-4">{purpose}</td>
                                        <td className="py-2.5">{data}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3">We do not sell, rent, or trade your data with third parties for marketing or advertising purposes.</p>
                </Section>

                <Section title="4. Data Retention">
                    <p><strong className="text-white">Active accounts:</strong> Data retained for the duration of your subscription.</p>
                    <p><strong className="text-white">Cancelled/expired accounts:</strong> Data retained for 30 days after cancellation to allow data export, then permanently deleted.</p>
                    <p><strong className="text-white">Trial accounts (not converted):</strong> Data retained for 30 days after trial expiry, then permanently deleted.</p>
                    <p><strong className="text-white">AppSumo LTD accounts:</strong> Data retained for the duration of your license. If you choose to stop using the Service, data is deleted upon request.</p>
                    <p><strong className="text-white">Backups:</strong> Backup snapshots may persist for up to 7 days after deletion for disaster recovery purposes.</p>
                </Section>

                <Section title="5. Your Rights (GDPR)">
                    <p>If you are in the European Economic Area (EEA), you have the following rights:</p>
                    <ul className="list-disc list-inside space-y-2 text-slate-400">
                        <li><strong className="text-white">Right to Access:</strong> Request a copy of all data we hold about you</li>
                        <li><strong className="text-white">Right to Rectification:</strong> Correct inaccurate data</li>
                        <li><strong className="text-white">Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                        <li><strong className="text-white">Right to Portability:</strong> Export your data in a machine-readable format</li>
                        <li><strong className="text-white">Right to Object:</strong> Object to data processing for direct marketing</li>
                        <li><strong className="text-white">Right to Restrict Processing:</strong> Request that we limit how we use your data</li>
                    </ul>
                    <p>To exercise any of these rights, email <a href="mailto:privacy@venqore.com" className="text-indigo-400 hover:underline">privacy@venqore.com</a>. We will respond within 30 days.</p>
                </Section>

                <Section title="6. Security">
                    <p>We implement industry-standard security measures including:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li>All data transmitted over HTTPS (TLS 1.2+)</li>
                        <li>Passwords hashed with bcrypt (cost factor 12)</li>
                        <li>Data encrypted at rest on DigitalOcean servers</li>
                        <li>Logical data isolation between tenants (separate namespaced data per business)</li>
                        <li>Regular security patching of server infrastructure</li>
                        <li>Access to production systems limited to authorized personnel</li>
                    </ul>
                    <p>Despite these measures, no system is 100% secure. If you discover a security vulnerability, please disclose it responsibly to <a href="mailto:security@venqore.com" className="text-indigo-400 hover:underline">security@venqore.com</a>.</p>
                </Section>

                <Section title="7. Cookies">
                    <p>We use only essential cookies:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                        <li><strong className="text-white">Session cookie:</strong> Keeps you logged in. Required for the Service to function.</li>
                        <li><strong className="text-white">CSRF token:</strong> Protects against cross-site request forgery attacks.</li>
                    </ul>
                    <p>We do not use tracking cookies, advertising cookies, or third-party analytics cookies. Cloudflare may set cookies for security purposes — see <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" className="text-indigo-400 hover:underline">Cloudflare's Privacy Policy</a>.</p>
                </Section>

                <Section title="8. Children's Privacy">
                    <p>The Service is intended for business use only and is not directed at individuals under 16 years of age. If you believe a minor has created an account, contact us immediately.</p>
                </Section>

                <Section title="9. Changes to This Policy">
                    <p>We may update this Privacy Policy. We will notify you via email at least 14 days before significant changes take effect. The "Last updated" date at the top reflects the most recent revision.</p>
                </Section>

                <Section title="10. Contact">
                    <p>For privacy-related inquiries:</p>
                    <p><a href="mailto:privacy@venqore.com" className="text-indigo-400 hover:underline">privacy@venqore.com</a></p>
                </Section>

                <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between text-sm text-slate-600">
                    <p>© {new Date().getFullYear()} VenQore. All rights reserved.</p>
                    <div className="flex gap-4">
                        <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
                        <Link href="/refund-policy" className="hover:text-slate-400 transition-colors">Refund Policy</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
