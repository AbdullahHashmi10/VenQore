import React from 'react';
import { useForm } from '@inertiajs/react';
import useTurnstile from '@/Components/Builder/useTurnstile';
import MarketingLayout from './Shared/MarketingLayout';
import {
 ArrowRight, Send, Briefcase, Mail, ShieldAlert,
 CheckCircle2, Users, FileText, Globe, Code, Key, ChevronDown
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════
 PARTNERS PAGE — "Licensing & B2B Partnerships"
 Visual Concept: A highly professional, premium enterprise landing page.
 Draws directly from Phase 14 licensing ladder with clean B2B/reseller
 positioning. Includes B2B schema support.
 ═══════════════════════════════════════════════════════════════════════ */

export default function Partners() {
 const { data, setData, post, processing, wasSuccessful, reset, errors, transform } = useForm({
 name: '',
 email: '',
 company: '',
 partnership_type: 'White-Label Reseller',
 message: ''
 });

 // Bot check (2026-09-10): /partners-submit is guarded by the `turnstile`
 // middleware; the token rides along with the form fields.
 const getTurnstileToken = useTurnstile();

 const handleSubmit = async (e) => {
 e.preventDefault();
 const token = await getTurnstileToken();
 transform((d) => ({ ...d, turnstile_token: token || '' }));
 post(route('marketing.partners.store'), {
 onSuccess: () => reset(),
 });
 };

 const Tiers = [
 {
 icon: Globe,
 title: 'White-Label Reseller',
 type: 'Recurring Revenue Share',
 desc: 'Rebrand the entire offline-first VenQore platform under your own domain name and logo. The default answer for resellers and marketing agencies who want to offer SaaS tools without hosting, security, or maintenance overhead.',
 color: 'emerald'
 },
 {
 icon: Code,
 title: 'Source-Code License',
 type: 'Non-Exclusive Deployment',
 desc: 'Acquire a full source-code license to host and deploy VenQore on your own server infrastructure. Ideal for regional hardware distributors or software operators seeking full operational independence.',
 color: 'indigo'
 },
 {
 icon: Key,
 title: 'Vertical/Region Exclusivity',
 type: 'Exclusive IP Rights',
 desc: 'Secure exclusive rights to operate VenQore POS within a specific industry vertical (e.g. Pharmacy Chains) or geographical country. Governed by a dedicated B2B distribution contract and evaluated on a six-figure model.',
 color: 'violet'
 },
 {
 icon: Briefcase,
 title: 'Strategic Acquisition',
 type: 'Full Intellectual Property',
 desc: 'Complete IP, brand, and asset acquisition. We discuss full buyout proposals only with qualified strategic buyers under revenue-multiple valuations. VenQore does not participate in code-broker or lowball source code bids.',
 color: 'rose'
 }
 ];

 const toneBadge = {
 emerald: 'vq-badge--success',
 indigo: 'vq-badge--accent',
 violet: 'vq-badge--accent',
 rose: 'vq-badge--warning',
 };

 return (
 <MarketingLayout
 title="B2B Partnership & Licensing Programs — VenQore"
 description="Explore white-label reseller opportunities, non-exclusive source-code licensing, and regional exclusive partnerships for our offline-first Business OS."
 >
 {/* ── 1. HERO ─────────────────────────────────────── */}
 <section className="vq-section vq-mkt-hero">
 <div className="vq-container">
 <div className="vq-section-head vq-section-head--center" style={{ marginBottom: 0 }}>
 <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Licensing &amp; partnerships</span>
 <h1 className="vq-display vq-mt-4">The licensing ladder program</h1>
 <p className="vq-lede">
 VenQore licenses its double-entry retail operating system. The company is not for sale; serious partnership and licensing conversations are welcome.
 </p>
 </div>
 </div>
 </section>

 {/* ── 2. LICENSING LADDER GRID ────────────────────── */}
 <section className="vq-section" style={{ paddingTop: 0 }}>
 <div className="vq-container">
 <div className="vq-grid vq-grid--2">
 {Tiers.map((t, idx) => {
 const Icon = t.icon;
 return (
 <article key={idx} className="vq-card vq-card--xl vq-tile">
 <div className="vq-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
 <span className="vq-tile__icon"><Icon aria-hidden="true" /></span>
 <span className={`vq-badge ${toneBadge[t.color] || ''}`}>{t.type}</span>
 </div>
 <h2 className="vq-tile__title">{t.title}</h2>
 <p className="vq-tile__body">{t.desc}</p>
 </article>
 );
 })}
 </div>

 {/* ── 3. IP note ── */}
 <div className="vq-card vq-card--xl vq-mt-8 vq-mkt-note">
 <span className="vq-tile__icon vq-mkt-note__icon"><ShieldAlert aria-hidden="true" /></span>
 <div>
 <h2 className="vq-h3">IP &amp; technical moat integrity</h2>
 <p className="vq-small vq-text-2 vq-mt-2" style={{ lineHeight: 1.65 }}>
 VenQore is governed by strict developer-owner copyrights, no third-party contested intellectual property, and contains a locked database integrity engine tested under <strong>eight correctness laws run on every release</strong>. All partnership inquiries route directly to our founding team.
 </p>
 </div>
 </div>
 </div>
 </section>

 {/* ── 4. PARTNERSHIP CONTACT FORM ─────────────────── */}
 <section className="vq-section vq-section--alt">
 <div className="vq-container vq-container--narrow">
 <div className="vq-section-head vq-section-head--center">
 <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Talk to the founders</span>
 <h2 className="vq-h1 vq-mt-4">Partnership inquiry</h2>
 <p className="vq-lede">
 Select your licensing tier below. Qualified inquiries receive a response within one business day from our founders.
 </p>
 </div>

 <div className="vq-card vq-card--xl vq-mkt-form">
 {wasSuccessful ? (
 <div className="vq-center" style={{ paddingBlock: 'var(--vq-space-8)' }}>
 <span className="vq-lead__icon vq-lead__icon--ok"><CheckCircle2 size={28} aria-hidden="true" /></span>
 <h3 className="vq-h2 vq-mt-6">Inquiry submitted</h3>
 <p className="vq-body vq-text-2 vq-mt-3" style={{ marginInline: 'auto' }}>
 Thank you! Your partnership inquiry has been securely stored and routed to the founding team. We will review your company profile and respond shortly.
 </p>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="vq-mkt-form__grid">
 <div className="vq-field">
 <label htmlFor="pt-name" className="vq-label">Your name <span className="vq-accent-text">*</span></label>
 <input id="pt-name" type="text" required value={data.name} onChange={e => setData('name', e.target.value)} className="vq-input" placeholder="e.g. Alexander Wright" />
 {errors.name && <span className="vq-mkt-form__error">{errors.name}</span>}
 </div>

 <div className="vq-field">
 <label htmlFor="pt-email" className="vq-label">Business email <span className="vq-accent-text">*</span></label>
 <input id="pt-email" type="email" required value={data.email} onChange={e => setData('email', e.target.value)} className="vq-input" placeholder="e.g. alex@distributor.com" />
 {errors.email && <span className="vq-mkt-form__error">{errors.email}</span>}
 </div>

 <div className="vq-field">
 <label htmlFor="pt-company" className="vq-label">Company name <span className="vq-accent-text">*</span></label>
 <input id="pt-company" type="text" required value={data.company} onChange={e => setData('company', e.target.value)} className="vq-input" placeholder="e.g. Wright Retail Group" />
 {errors.company && <span className="vq-mkt-form__error">{errors.company}</span>}
 </div>

 <div className="vq-field">
 <label htmlFor="pt-type" className="vq-label">Licensing program <span className="vq-accent-text">*</span></label>
 <select id="pt-type" value={data.partnership_type} onChange={e => setData('partnership_type', e.target.value)} className="vq-select">
 <option>White-Label Reseller</option>
 <option>Source-Code License</option>
 <option>Vertical/Region Exclusivity</option>
 <option>Strategic Acquisition</option>
 </select>
 </div>

 <div className="vq-field vq-mkt-form__full">
 <label htmlFor="pt-message" className="vq-label">Inquiry &amp; use case description <span className="vq-accent-text">*</span></label>
 <textarea id="pt-message" required rows={5} value={data.message} onChange={e => setData('message', e.target.value)} className="vq-textarea" placeholder="Detail your target market, operating region, and why you are interested in licensing VenQore..." />
 {errors.message && <span className="vq-mkt-form__error">{errors.message}</span>}
 </div>

 <div className="vq-mkt-form__full vq-mkt-form__actions">
 <button type="submit" disabled={processing} className="vq-btn vq-btn--primary vq-btn--lg">
 {processing ? 'Submitting…' : 'Submit inquiry'}
 <Send size={16} aria-hidden="true" />
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 </section>
 </MarketingLayout>
 );
}
