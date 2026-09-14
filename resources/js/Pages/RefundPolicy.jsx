import React from 'react';
import { Link } from '@inertiajs/react';
import { Shield, Clock, CreditCard, Mail } from 'lucide-react';
import MarketingLayout from '@/Pages/Marketing/Shared/MarketingLayout';

/**
 * RefundPolicy.jsx — Phase 7
 *
 * URL: /refund-policy
 * Subscriptions are the main policy. Lifetime licences sold through a
 * partner marketplace are covered in the fine print at the end — no
 * third-party site is named anywhere on this page, by decision (10 Sep 2026).
 */
export default function RefundPolicy() {
    return (
        <MarketingLayout
            title="Refund Policy — VenQore"
            description="How cancellations and refunds work for VenQore subscriptions, and what happens to your data after you cancel."
        >
            <section className="vq-section vq-mc-top vq-mc-top--flush">
                <div className="vq-container">
                    <div className="vq-mc-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Legal</span>
                        <h1 className="vq-h1 vq-mt-4">Refund Policy</h1>
                        <div className="vq-mc-meta vq-mt-4"><span className="vq-mc-meta__item">Last updated: April 2025</span></div>
                    </div>

                </div>
            </section>

            <section className="vq-section vq-mc-body" style={{ paddingTop: 'var(--vq-space-8)' }}>
                <div className="vq-container">
                    <div className="vq-mc-doc vq-mc-doc--toc" style={{ borderTop: '1px solid var(--vq-line)', paddingTop: 'var(--vq-space-12)' }}>
                        <nav className="vq-mc-rail vq-mc-toc" aria-label="On this page">
                            <span className="vq-eyebrow vq-mc-rail__label vq-mc-toc__title">On this page</span>
                            {[
                                    ['subscriptions', '1. Monthly & annual plans'],
                                    ['data-retention', '2. Your data after cancelling'],
                                    ['contact', '3. Contact'],
                                ].map(([id, label]) => (
                                <a key={id} href={`#${id}`} className="vq-mc-rail__link">{label}</a>
                            ))}
                        </nav>

                {/* Policy sections */}
                <article className="vq-read vq-mc-legal">
                    <section id="subscriptions" style={{ scrollMarginTop: '112px' }}>
                        <h2>1. Monthly &amp; annual plans</h2>
                        <p>
                            For paid monthly or annual subscriptions (Starter $49/mo, Core $99/mo, Scale $299/mo),
                            you may cancel at any time. Cancellation takes effect at the end of the current billing
                            period — you will not be charged for the following period.
                        </p>
                        <p>
                            We do not offer prorated refunds for the remaining days of a billing period. If you
                            experience a technical issue that prevented you from using the service, contact support
                            within 7 days and we will review your case.
                        </p>
                    </section>

                    <section id="data-retention" style={{ scrollMarginTop: '112px' }}>
                        <h2>2. Your data after cancelling</h2>
                        <p>
                            After account cancellation or expiry, your data is retained for <strong>30 days</strong> to
                            allow for data export. After 30 days, all data is permanently deleted. You may request
                            immediate deletion by emailing{' '}
                            <a href="mailto:privacy@venqore.com">privacy@venqore.com</a>.
                        </p>
                    </section>

                    <section id="contact" style={{ scrollMarginTop: '112px' }}>
                        <h2>3. Contact</h2>
                        <div className="vq-grid vq-grid--2">
                            <a href="mailto:support@venqore.com" className="vq-card vq-card--interactive vq-row vq-gap-4" style={{ textDecoration: 'none' }}>
                                <span className="vq-mc-icon"><Mail size={20} aria-hidden="true" /></span>
                                <span>
                                    <span className="vq-caption" style={{ display: 'block' }}>Email</span>
                                    <span style={{ display: 'block', color: 'var(--vq-text)', fontWeight: 600, fontSize: 'var(--vq-fs-small)' }}>support@venqore.com</span>
                                </span>
                            </a>
                            <div className="vq-card vq-row vq-gap-4">
                                <span className="vq-mc-icon" style={{ '--tone': 'var(--vq-success)' }}><Clock size={20} aria-hidden="true" /></span>
                                <span>
                                    <span className="vq-caption" style={{ display: 'block' }}>Response Time</span>
                                    <span style={{ display: 'block', color: 'var(--vq-text)', fontWeight: 600, fontSize: 'var(--vq-fs-small)' }}>Within 12 hours</span>
                                </span>
                            </div>
                        </div>
                    </section>


                    <section id="lifetime-licences" className="vq-fineprint" aria-label="Lifetime licences">
                        <p>
                            <strong>Lifetime licences.</strong> If you bought a one-time lifetime licence through a partner
                            marketplace rather than subscribing here, refunds for that purchase are handled by the
                            marketplace you bought from, within the refund window it showed at checkout. Refunding one of
                            several stacked codes moves the workspace down one tier; refunding every code closes it.
                            Lifetime licences include two years of hosting from the date the code is redeemed; after that
                            you can continue hosted at the plan rate shown to you at the time, or export your data. We
                            email reminders 90 and 30 days before hosting ends.
                        </p>
                    </section>
                    <div className="vq-mc-related">
                        <p>Related: read our{' '}
                            <Link href="/terms">Terms of Service</Link>{' '}and{' '}
                            <Link href="/privacy">Privacy Policy</Link>.
                        </p>
                        <Link href="/pricing">See plans &amp; pricing →</Link>
                    </div>
                </article>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
