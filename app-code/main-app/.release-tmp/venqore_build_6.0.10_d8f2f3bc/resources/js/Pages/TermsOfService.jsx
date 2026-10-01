import React from 'react';
import { Link } from '@inertiajs/react';
import { Scale, Shield } from 'lucide-react';
import MarketingLayout from '@/Pages/Marketing/Shared/MarketingLayout';

/**
 * TermsOfService.jsx — Pre-Launch Checklist §12
 *
 * Required before launch.
 * URL: /terms
 */
export default function TermsOfService() {
    const lastUpdated = 'September 2026';

    const Section = ({ id, title, children }) => (
        <section id={id} style={{ scrollMarginTop: '112px' }}>
            <h2>{title}</h2>
            {children}
        </section>
    );

    return (
        <MarketingLayout
            title="Terms of Service — VenQore"
            description="VenQore Terms of Service. Read our legal terms and conditions governing service use, Merchant of Record disclosures, warranty disclaimers, and data protection."
        >
            <section className="vq-section vq-mc-top vq-mc-top--flush">
                <div className="vq-container">
                    <div className="vq-mc-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Legal</span>
                        <h1 className="vq-h1 vq-mt-4">Terms of Service</h1>
                        <div className="vq-mc-meta vq-mt-4"><span className="vq-mc-meta__item">Last updated: {lastUpdated}</span></div>
                        <p className="vq-lede vq-mt-6">
                            Please read these Terms of Service carefully before accessing or using VenQore. By creating an account, initiating a subscription, or using any part of the Service, you acknowledge that you have read, understood, and agreed to be legally bound by these Terms and our Privacy Policy.
                        </p>
                    </div>
                </div>
            </section>

            <section className="vq-section vq-mc-body" style={{ paddingTop: 'var(--vq-space-8)' }}>
                <div className="vq-container">
                    <div className="vq-mc-doc vq-mc-doc--toc" style={{ borderTop: '1px solid var(--vq-line)', paddingTop: 'var(--vq-space-12)' }}>
                        <nav className="vq-mc-rail vq-mc-toc" aria-label="On this page">
                            <span className="vq-eyebrow vq-mc-rail__label vq-mc-toc__title">On this page</span>
                            {[
                                    ['acceptance', '1. Legal Entity & Acceptance of Terms'],
                                    ['service-description', '2. Description of the Service'],
                                    ['account-registration', '3. Account Registration & Security'],
                                    ['subscriptions-billing', '4. Subscriptions, Payments & Merchant of Record'],
                                    ['free-trial', '5. Free Trial & Workspace Provisioning'],
                                    ['data-ownership-dpa', '6. Data Ownership & Data Processing Agreement (DPA)'],
                                    ['acceptable-use', '7. Acceptable Use Policy'],
                                    ['tenancy-isolation', '8. Multi-Tenant Architecture & Data Isolation'],
                                    ['service-availability', '9. Uptime & Service Levels'],
                                    ['warranty-disclaimer', '10. Express Disclaimer of Warranties'],
                                    ['limitation-liability', '11. Limitation of Liability & Liability Cap'],
                                    ['shared-catalogue', '12. Shared Product Catalogue (Optional Community Knowledge Base)'],
                                    ['termination', '13. Termination & Data Export'],
                                    ['governing-law', '14. Governing Law & Dispute Resolution'],
                                    ['modifications', '15. Changes to Terms'],
                                    ['contact', '16. Contact & Legal Notices'],
                                ].map(([id, label]) => (
                                <a key={id} href={`#${id}`} className="vq-mc-rail__link">{label}</a>
                            ))}
                        </nav>

                        <article className="vq-read vq-mc-legal">

                <Section id="acceptance" title="1. Legal Entity & Acceptance of Terms">
                    <p>These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;Customer,&quot; &quot;you,&quot; or &quot;your&quot;) and <strong>VenQore Technologies (Private) Limited</strong> (&quot;VenQore,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a private company incorporated and operating under the laws of the Islamic Republic of Pakistan.</p>
                    <p>If you are agreeing to these Terms on behalf of a company, partnership, or other legal entity, you represent and warrant that you have the authority to bind such entity to these Terms. If you do not have such authority, or if you do not agree with any provision of these Terms, you must not access or use the Service.</p>
                    <p>These Terms govern all users, including trial accounts, active monthly and annual subscribers, and authorized staff members accessing the platform.</p>
                </Section>

                <Section id="service-description" title="2. Description of the Service">
                    <p>VenQore provides a multi-tenant cloud-based Point of Sale (POS), Enterprise Resource Planning (ERP), and business operations platform designed for retail, wholesale, pharmacy, restaurant, and service businesses. The Service includes point of sale processing, inventory control, double-entry financial ledger accounting, customer relationship management, analytics, artificial intelligence assistance, and multi-channel synchronization.</p>
                    <p>We continuously evolve the platform. We reserve the right to enhance, modify, or deprecate features of the Service. Material modifications that significantly degrade core platform functionality will be communicated with reasonable prior notice.</p>
                </Section>

                <Section id="account-registration" title="3. Account Registration & Security">
                    <p>To access the Service, you must register for an account by providing complete, accurate, and current business and contact details. You agree to promptly update your information to maintain its accuracy.</p>
                    <p>You are solely responsible for safeguarding the credentials of all accounts created under your tenant workspace. You are fully responsible for all activities and transactions executed under your credentials. You must notify us immediately at <a href="mailto:security@venqore.com">security@venqore.com</a> if you discover or suspect any unauthorized access or breach of security.</p>
                    <p>Each tenant workspace is provisioned for a single merchant entity. Sharing account credentials across unrelated legal businesses is strictly prohibited.</p>
                </Section>

                <Section id="subscriptions-billing" title="4. Subscriptions, Payments & Merchant of Record">
                    <p><strong>Merchant of Record:</strong> Our international order processing, subscription billing, payment handling, and tax remittance (including VAT, GST, and sales tax) are managed exclusively by our authorized online reseller and Merchant of Record, <strong>Lemon Squeezy, LLC</strong> (&quot;Lemon Squeezy&quot;). When you purchase a subscription or add-on internationally, your transaction is processed by Lemon Squeezy and subject to Lemon Squeezy&apos;s Terms of Service and Privacy Policy, in addition to these Terms.</p>
                    <p><strong>Local Pakistani Payments:</strong> For eligible customers operating in Pakistan billed directly in Pakistani Rupees (PKR), subscriptions and direct bank transfers are managed through our authorized local corporate accounts in Pakistan.</p>
                    <p><strong>Recurring Billing:</strong> Paid subscriptions are billed in advance on a recurring monthly or annual basis. By initiating a subscription, you authorize Lemon Squeezy (or our direct local payment gateway) to automatically charge your designated payment method at each renewal interval until cancelled.</p>
                    <p><strong>Cancellations & Refunds:</strong> You may cancel your subscription at any time via the Tenant Billing settings. Cancellation takes effect at the end of the current paid billing period. Subscriptions are non-refundable for partial billing periods except as expressly detailed in our <Link href="/refund-policy">Refund Policy</Link> or required by applicable consumer law.</p>
                </Section>

                <Section id="free-trial" title="5. Free Trial & Workspace Provisioning">
                    <p>Eligible new accounts receive a 14-day free trial granting full functional access to evaluate the platform. You may cancel at any time during the trial without incurring charges.</p>
                    <p>At the conclusion of the trial period, your workspace will require an active paid subscription to maintain write access. Unconverted trial tenant workspaces and associated operational data are retained for thirty (30) days following trial expiration, after which they are permanently and irreversibly purged from our active databases in accordance with our automated lifecycle policies.</p>
                </Section>

                <Section id="data-ownership-dpa" title="6. Data Ownership & Data Processing Agreement (DPA)">
                    <p><strong>Customer Ownership:</strong> You retain all right, title, and interest, including all intellectual property rights, in and to the proprietary business data, inventory records, financial transactions, customer lists, and documents you input or store within the Service (&quot;Customer Data&quot;). VenQore claims no ownership over your Customer Data.</p>
                    <p><strong>Data Processing Agreement (GDPR Art. 28):</strong> To the extent that Customer Data contains Personal Data protected under the General Data Protection Regulation (EU GDPR) or UK Data Protection Act 2018, the parties agree that you are the Data Controller and VenQore is the Data Processor. Our standard Data Processing Agreement (DPA), incorporating Standard Contractual Clauses (SCCs), is incorporated by reference into these Terms and available upon request at <a href="mailto:legal@venqore.com">legal@venqore.com</a>.</p>
                    <p>For complete information regarding data handling practices and subprocessors, review our <Link href="/privacy">Privacy Policy</Link>.</p>
                </Section>

                <Section id="acceptable-use" title="7. Acceptable Use Policy">
                    <p>You agree not to misuse the Service or assist any other party in misusing it. Prohibited activities include, but are not limited to:</p>
                    <ul>
                        <li>Violating applicable local, state, national, or international statutes or trade regulations</li>
                        <li>Storing, processing, or transmitting fraudulent financial records or illicit materials</li>
                        <li>Attempting to probe, scan, or compromise the security, authentication, or boundaries of the Service or other tenant workspaces</li>
                        <li>Reverse engineering, decompiling, disassembling, or extracting the source code of the platform</li>
                        <li>Employing automated bots, scrapers, or scripts to stress-test or scrape the Service without our prior written consent</li>
                        <li>Interfering with or disrupting the integrity, performance, or availability of the shared infrastructure</li>
                    </ul>
                    <p>We reserve the right to immediately suspend or terminate any account or tenant workspace found in violation of this Acceptable Use Policy without liability.</p>
                </Section>

                <Section id="tenancy-isolation" title="8. Multi-Tenant Architecture & Data Isolation">
                    <p>VenQore operates as a software-as-a-service application utilizing a shared multi-tenant database infrastructure. Your Customer Data is logically isolated from all other tenants through enforced tenant-scoping controls, session validation, and database constraints.</p>
                    <p>While we enforce defense-in-depth architectural safeguards, you acknowledge that no networked system is 100% immune to unforeseen hardware, telecommunication, or software anomalies. You remain responsible for exporting periodic backups of critical financial and accounting records via the platform&apos;s Data Export tools.</p>
                </Section>

                <Section id="service-availability" title="9. Uptime & Service Levels">
                    <p>We strive to provide 99.5% monthly availability for core POS and operational APIs. Scheduled maintenance windows will be announced at least 24 hours in advance via dashboard notifications or email.</p>
                    <p>Our service availability commitment does not apply to interruptions caused by: third-party upstream providers (including Cloudflare or hosting datacenter outages), internet service provider disruptions, customer-side networking or hardware issues, or events beyond our reasonable control (force majeure).</p>
                </Section>

                <Section id="warranty-disclaimer" title="10. Express Disclaimer of Warranties">
                    <div className="vq-mc-callout vq-mc-callout--plain vq-mc-legal__caps">
                        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE, DOCUMENTATION, SOFTWARE, AND ALL FEATURES ARE PROVIDED STRICTLY ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS. VENQORE TECHNOLOGIES (PRIVATE) LIMITED AND ITS AFFILIATES, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS EXPRESSLY DISCLAIM ALL WARRANTIES AND CONDITIONS OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, ACCURACY OF FINANCIAL CALCULATIONS OR TAX COMPUTATIONS, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, ACCURATE, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
                    </div>
                </Section>

                <Section id="limitation-liability" title="11. Limitation of Liability & Liability Cap">
                    <p className="vq-mc-legal__caps" style={{ fontWeight: 600, color: 'var(--vq-text)' }}>
                        PLEASE READ THIS SECTION CAREFULLY AS IT LIMITS THE REMEDIES AVAILABLE TO YOU.
                    </p>
                    <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL VENQORE TECHNOLOGIES (PRIVATE) LIMITED, ITS OFFICERS, DIRECTORS, EMPLOYEES, AFFILIATES, AGENTS, SUPPLIERS, OR RESELLERS (INCLUDING LEMON SQUEEZY, LLC) BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA (INCLUDING CORRUPTION OR LOSS OF ACCOUNTING OR FINANCIAL LEDGER RECORDS), BUSINESS INTERRUPTION, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH THE USE OF, OR INABILITY TO USE, THE SERVICE.</p>
                    <p><strong>AGGREGATE MONETARY LIABILITY CAP:</strong> TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VENQORE&apos;S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE, UNDER ANY LEGAL OR EQUITABLE THEORY (WHETHER IN CONTRACT, TORT INCLUDING NEGLIGENCE, STRICT LIABILITY, STATUTE, OR OTHERWISE), SHALL NOT EXCEED THE TOTAL FEES ACTUALLY PAID BY YOU TO VENQORE (OR ITS AUTHORIZED RESELLER LEMON SQUEEZY) IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE OCCURRENCE GIVING RISE TO LIABILITY, OR ONE HUNDRED UNITED STATES DOLLARS ($100.00 USD), WHICHEVER IS GREATER.</p>
                </Section>

                <Section id="shared-catalogue" title="12. Shared Product Catalogue (Optional Community Knowledge Base)">
                    <p>VenQore offers an optional, privacy-engineered shared product catalogue to enable merchants to populate standardized product descriptions and barcode metadata without manual entry.</p>
                    <p><strong>What is shared:</strong> Anonymous product titles, brand names, and barcode numbers. Global catalogue publication occurs only after a product listing has been independently verified across multiple distinct merchants.</p>
                    <p><strong>What is NEVER shared:</strong> We never share, expose, or pool your sales figures, retail pricing, cost prices, inventory quantities, margins, profit, supplier names, customer records, or business identity.</p>
                    <p><strong>Opt-out:</strong> Participation in the shared catalogue is optional and may be disabled at any time under Settings → Data. Opting out immediately halts all metadata contribution from your workspace.</p>
                </Section>

                <Section id="termination" title="13. Termination & Data Export">
                    <p>You may terminate your account at any time via the Tenant Workspace settings. VenQore may terminate or suspend your access for material breach of these Terms, non-payment, or upon court order.</p>
                    <p>Upon termination, your right to use the Service immediately ceases. You may export your complete data records using the platform&apos;s standard data export tools prior to cancellation. Inactive accounts are maintained for thirty (30) days to facilitate data retrieval before scheduled permanent deletion.</p>
                </Section>

                <Section id="governing-law" title="14. Governing Law & Dispute Resolution">
                    <p>These Terms of Service, their interpretation, and any dispute, controversy, or claim arising out of or relating to them or the Service (including non-contractual disputes) shall be governed by, and construed in accordance with, the laws of the <strong>Islamic Republic of Pakistan</strong>, without regard to its conflict of law principles.</p>
                    <p>The parties agree that any legal suit, action, or proceeding arising out of or related to these Terms or the Service shall be instituted exclusively in the competent courts located in <strong>Lahore, Punjab, Pakistan</strong>. Each party irrevocably submits to the exclusive personal jurisdiction of such courts.</p>
                </Section>

                <Section id="modifications" title="15. Changes to Terms">
                    <p>We may revise and update these Terms of Service from time to time. When changes are made, we will update the &quot;Last updated&quot; date at the top of this page. If we make material modifications, we will notify you through the dashboard or via email at least fourteen (14) days before the changes take effect. Your continued use of the Service following the effective date constitutes your binding acceptance of the revised Terms.</p>
                </Section>

                <Section id="contact" title="16. Contact & Legal Notices">
                    <p>Legal notices, inquiries, or communications regarding these Terms should be directed to:</p>
                    <p><strong>VenQore Technologies (Private) Limited</strong></p>
                    <p>Email: <a href="mailto:legal@venqore.com">legal@venqore.com</a> · Support: <a href="mailto:support@venqore.com">support@venqore.com</a></p>
                    <p>Lahore, Punjab, Pakistan</p>
                </Section>

                <div className="vq-mc-related">
                    <p>Related: read our{' '}
                        <Link href="/privacy">Privacy Policy</Link>{' '}and{' '}
                        <Link href="/refund-policy">Refund Policy</Link>.
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
