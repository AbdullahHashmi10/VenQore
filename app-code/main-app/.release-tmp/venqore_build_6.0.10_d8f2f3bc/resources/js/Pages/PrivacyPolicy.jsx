import React from 'react';
import { Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import MarketingLayout from '@/Pages/Marketing/Shared/MarketingLayout';

const Section = ({ id, title, children }) => (
    <section id={id} style={{ scrollMarginTop: '112px' }}>
        <h2>{title}</h2>
        {children}
    </section>
);

/**
 * PrivacyPolicy.jsx — Pre-Launch Checklist §12
 *
 * GDPR/CAN-SPAM compliant privacy policy.
 * URL: /privacy
 */
export default function PrivacyPolicy() {
    const lastUpdated = 'September 2026';

    return (
        <MarketingLayout
            title="Privacy Policy — VenQore"
            description="VenQore Privacy Policy. How we collect, use, and protect your data, including AI processing and subprocessor disclosures."
        >
            <section className="vq-section vq-mc-top vq-mc-top--flush">
                <div className="vq-container">
                    <div className="vq-mc-head">
                        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Legal</span>
                        <h1 className="vq-h1 vq-mt-4">Privacy Policy</h1>
                        <div className="vq-mc-meta vq-mt-4"><span className="vq-mc-meta__item">Last updated: {lastUpdated}</span></div>
                        <p className="vq-lede vq-mt-6">
                            Your privacy matters to us. This policy explains exactly what data we collect, why we collect it, how our AI features process data under zero-training commitments, and how you can exercise full control over your business and personal records. We do not sell your data.
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
                                    ['data-we-collect', '1. What Data We Collect'],
                                    ['how-we-use-data', '2. How We Use Your Data'],
                                    ['ai-processing', '3. Artificial Intelligence & Machine Learning Processing'],
                                    ['data-sharing', '4. Subprocessors & Third-Party Service Providers'],
                                    ['data-retention', '5. Data Retention'],
                                    ['your-rights', '6. Your Rights (GDPR & Data Protection)'],
                                    ['security', '7. Security'],
                                    ['cookies', '8. Cookies'],
                                    ['dpa', '9. Data Processing Addendum (DPA)'],
                                    ['childrens-privacy', "10. Children's Privacy"],
                                    ['policy-changes', '11. Changes to This Policy'],
                                    ['contact', '12. Contact'],
                                ].map(([id, label]) => (
                                <a key={id} href={`#${id}`} className="vq-mc-rail__link">{label}</a>
                            ))}
                        </nav>

                        <article className="vq-read vq-mc-legal">

                <Section id="data-we-collect" title="1. What Data We Collect">
                    <p><strong>Account Data:</strong> Name, email address, business name, and password (hashed with bcrypt — we never store plain-text passwords).</p>
                    <p><strong>Business Data:</strong> Products, customers, sales records, invoices, accounting entries, and other data you create within the Service. This data belongs strictly to you.</p>
                    <p><strong>AI Input & Document Data:</strong> Business prompts entered into the Conversational Workspace Builder, documents or invoices uploaded to SmartCapture for optical character recognition, and queries submitted to the Vena assistant.</p>
                    <p><strong>Usage & Technical Data:</strong> IP address, browser type, device identifiers, pages visited, and timestamps. Used exclusively for security monitoring, fraud prevention, and session integrity.</p>
                    <p><strong>Payment Data:</strong> Payment processing and global merchant-of-record services are handled by Lemon Squeezy. We never see, process, or store full credit card numbers or CVVs. We receive only tokenized customer identifiers and transaction status.</p>
                    <p><strong>Communication Data:</strong> Inbound contact inquiries, support tickets, and email correspondence.</p>
                </Section>

                <Section id="how-we-use-data" title="2. How We Use Your Data">
                    <ul>
                        <li>To provide, maintain, and deliver the core POS and ERP Service</li>
                        <li>To assemble workspace configurations dynamically and parse uploaded invoices via SmartCapture</li>
                        <li>To send essential transactional notifications (account provisioning, invoices, payment notices, password resets)</li>
                        <li>To respond to technical support and customer care inquiries</li>
                        <li>To detect, investigate, and prevent fraud, abuse, or unauthorized access</li>
                        <li>To comply with statutory financial, accounting, and legal obligations</li>
                    </ul>
                    <p>We do <strong>not</strong> use your business data (products, customers, financial ledgers, or sales) for advertising or any purpose other than providing the Service to you.</p>
                </Section>

                <Section id="ai-processing" title="3. Artificial Intelligence & Machine Learning Processing">
                    <p>VenQore incorporates AI capabilities (including the Conversational Workspace Builder, SmartCapture document ingestion, and Vena assistant). We adhere to strict data-protection principles regarding AI processing:</p>
                    <ul>
                        <li><strong>Zero Model Training:</strong> Your business data, uploaded supplier invoices, ledger records, customer names, and chat prompts are <strong>NEVER used to train, retrain, or improve foundational AI models</strong> (whether by VenQore or third-party AI providers).</li>
                        <li><strong>Stateless Processing:</strong> Data transmitted to AI providers via enterprise API endpoints is processed ephemerally and discarded once the immediate structured response is generated.</li>
                        <li><strong>Bring Your Own Key (BYOK):</strong> VenQore supports BYOK configuration, allowing enterprise merchants to supply their own API keys directly to Google Gemini or OpenAI with their own direct contractual enterprise protections.</li>
                    </ul>
                </Section>

                <Section id="data-sharing" title="4. Subprocessors & Third-Party Service Providers">
                    <p>We share data with vetted third-party subprocessors strictly to the extent necessary to deliver the Service:</p>
                    <div className="vq-mc-tablewrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Provider / Entity</th>
                                    <th>Role &amp; Purpose</th>
                                    <th>Data Transferred</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['Google LLC', 'Gemini AI API (Conversational builder & OCR analysis)', 'Prompt text, document scan text', 'United States'],
                                    ['Lemon Squeezy, LLC', 'Merchant of Record, payment gateway & tax compliance', 'Billing details, email, subscription tier', 'United States'],
                                    ['Cloudflare, Inc.', 'Edge CDN, DDoS mitigation & Turnstile bot defense', 'IP address, HTTP request headers, security token', 'Global / US'],
                                    ['Functional Software, Inc. (Sentry)', 'Application performance & crash diagnostics', 'Error stack traces, anonymized tenant/user ID', 'United States'],
                                    ['Postmark / Resend', 'Transactional email delivery', 'Recipient email address, transactional message body', 'United States'],
                                ].map(([provider, purpose, data, location], i) => (
                                    <tr key={i}>
                                        <td>{provider}</td>
                                        <td>{purpose}</td>
                                        <td>{data}</td>
                                        <td>{location}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p>All international transfers from the UK/EEA to third countries are governed by European Commission Standard Contractual Clauses (SCCs) and International Data Transfer Addenda.</p>
                </Section>
 
                <Section id="data-retention" title="5. Data Retention">
                    <p><strong>Active accounts:</strong> Data retained for the duration of your subscription.</p>
                    <p><strong>Cancelled/expired accounts:</strong> Data retained for 30 days after cancellation to allow data export, then permanently deleted.</p>
                    <p><strong>Trial accounts (not converted):</strong> Data retained for 30 days after trial expiry, then permanently deleted.</p>
                    <p><strong>Backups:</strong> Backup snapshots may persist for up to 7 days after deletion for disaster recovery purposes.</p>
                </Section>

                <Section id="your-rights" title="6. Your Rights (GDPR & Data Protection)">
                    <p>If you are in the European Economic Area (EEA), UK, or applicable jurisdictions, you have the following rights:</p>
                    <ul>
                        <li><strong>Right to Access:</strong> Request a copy of all data we hold about you</li>
                        <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                        <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                        <li><strong>Right to Portability:</strong> Export your data in a machine-readable format</li>
                        <li><strong>Right to Object:</strong> Object to data processing for direct marketing</li>
                        <li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your data</li>
                    </ul>
                    <p>To exercise any of these rights, email <a href="mailto:privacy@venqore.com">privacy@venqore.com</a>. We will respond within 30 days.</p>
                </Section>

                <Section id="security" title="7. Security">
                    <p>We implement industry-standard security measures including:</p>
                    <ul>
                        <li>All data transmitted over HTTPS (TLS 1.2+)</li>
                        <li>Passwords hashed with bcrypt (cost factor 12)</li>
                        <li>Data encrypted at rest on production servers</li>
                        <li>Logical data isolation between tenants (separate namespaced data per business via strict multi-tenant scopes)</li>
                        <li>Regular security patching of server infrastructure</li>
                        <li>Access to production systems limited strictly to authorized personnel</li>
                    </ul>
                    <p>Despite these measures, no system is 100% secure. If you discover a security vulnerability, please disclose it responsibly to <a href="mailto:security@venqore.com">security@venqore.com</a>.</p>
                </Section>

                <Section id="cookies" title="8. Cookies">
                    <p>We use only essential cookies:</p>
                    <ul>
                        <li><strong>Session cookie:</strong> Keeps you logged in. Required for the Service to function.</li>
                        <li><strong>CSRF token:</strong> Protects against cross-site request forgery attacks.</li>
                    </ul>
                    <p>We do not use tracking cookies, advertising cookies, or third-party behavioral analytics cookies.</p>
                </Section>

                <Section id="dpa" title="9. Data Processing Addendum (DPA)">
                    <p>For merchants operating in the European Union, European Economic Area, or United Kingdom who act as Data Controllers under GDPR Art. 28, VenQore offers a standard Data Processing Addendum (DPA) incorporating European Commission Standard Contractual Clauses (SCCs). To execute a DPA, please contact <a href="mailto:legal@venqore.com">legal@venqore.com</a>.</p>
                </Section>

                <Section id="childrens-privacy" title="10. Children's Privacy">
                    <p>The Service is intended for business use only and is not directed at individuals under 16 years of age. If you believe a minor has created an account, contact us immediately.</p>
                </Section>

                <Section id="policy-changes" title="11. Changes to This Policy">
                    <p>We may update this Privacy Policy. We will notify you via email at least 14 days before significant changes take effect. The "Last updated" date at the top reflects the most recent revision.</p>
                </Section>

                <Section id="contact" title="12. Contact">
                    <p>For privacy-related inquiries or data subject access requests:</p>
                    <p><a href="mailto:privacy@venqore.com">privacy@venqore.com</a></p>
                </Section>

                <div className="vq-mc-related">
                    <p>Related: read our{' '}
                        <Link href="/terms">Terms of Service</Link>{' '}and{' '}
                        <Link href="/refund-policy">Refund Policy</Link>.
                    </p>
                    <Link href="/contact">Questions? Contact us →</Link>
                </div>
                        </article>
                    </div>
                </div>
            </section>
        </MarketingLayout>
    );
}
