/**
 * SiteFooter — the one public footer. Links come from siteMap.js; nothing is
 * typed here. The band is dark in both themes (it is the page's floor), so it
 * declares data-tone="dark" for the header's tone sampler.
 */
import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';
import { FOOTER_COLUMNS, LEGAL, CONTACT, PRIMARY_CTA, isCurrent } from './siteMap';
import { BUSINESS_TYPE_CLAIM } from './sectorCatalog';

export default function SiteFooter({ showCta = true }) {
    const page = usePage();
    const path = (page?.url || '/').split('?')[0];
    const [email, setEmail] = useState('');
    const year = new Date().getFullYear();

    const start = (e) => {
        e.preventDefault();
        const v = email.trim();
        window.location.href = v ? `${PRIMARY_CTA.href}?email=${encodeURIComponent(v)}` : PRIMARY_CTA.href;
    };

    return (
        <footer className="vq-sf" data-tone="dark" data-site-footer="">
            <div className="vq-sf__floor" aria-hidden="true" />

            {showCta && (
                <div className="vq-sf__wrap vq-sf__cta-wrap">
                    <div className="vq-sf__cta">
                        <div className="vq-sf__cta-copy">
                            <h2 className="vq-sf__cta-title">Describe your business. See what it becomes.</h2>
                            <p className="vq-sf__cta-lede">
                                14-day free trial. Full access. You see your whole system before you decide anything.
                            </p>
                        </div>
                        <form className="vq-sf__cta-form" onSubmit={start}>
                            <label className="vq-sr-only" htmlFor="vq-sf-email">Work email</label>
                            <input
                                id="vq-sf-email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                className="vq-sf__input"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <button type="submit" className="vq-btn vq-btn--lg vq-btn--light">
                                {PRIMARY_CTA.label}
                                <span className="vq-btn__arrow"><ArrowRight size={16} aria-hidden="true" /></span>
                            </button>
                            <p className="vq-sf__fine">Takes about four minutes. Nothing goes live until you approve it.</p>
                        </form>
                    </div>
                </div>
            )}

            <div className="vq-sf__wrap vq-sf__main">
                <div className="vq-sf__brandcol">
                    <a className="vq-btn-plain vq-sf__brand" href="/" aria-label="VenQore home">
                        <img src="/v6/assets/logo.png" alt="" width="30" height="30" />
                        <span>VenQore</span>
                    </a>
                    <p className="vq-sf__about">
                        The AI ERP builder for {BUSINESS_TYPE_CLAIM} kinds of business. Describe how you operate;
                        VenQore assembles the system — point of sale, stock, jobs, purchasing, invoicing — on one
                        double-entry ledger.
                    </p>
                    <ul className="vq-sf__contact">
                        <li>
                            <a className="vq-btn-plain" href={CONTACT.whatsapp.href} target="_blank" rel="noopener noreferrer">
                                <MessageCircle size={16} aria-hidden="true" /> {CONTACT.whatsapp.label}
                            </a>
                        </li>
                        <li>
                            <a className="vq-btn-plain" href={CONTACT.email.href}>
                                <Mail size={16} aria-hidden="true" /> {CONTACT.email.label}
                            </a>
                        </li>
                    </ul>
                </div>

                <nav className="vq-sf__cols" aria-label="Footer">
                    {FOOTER_COLUMNS.map((col) => (
                        <div key={col.heading} className="vq-sf__col">
                            <h3 className="vq-sf__head">{col.heading}</h3>
                            <ul>
                                {col.links.map((l) => (
                                    <li key={l.href}>
                                        <a className="vq-btn-plain" href={l.href} aria-current={isCurrent(l.href, path) ? 'page' : undefined}>{l.label}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </div>

            <div className="vq-sf__wrap vq-sf__base">
                <p>© {year} VenQore. The AI ERP builder.</p>
                <ul className="vq-sf__legal">
                    {LEGAL.map((l) => (
                        <li key={l.href}><a className="vq-btn-plain" href={l.href}>{l.label}</a></li>
                    ))}
                    <li>
                        <button type="button" className="vq-sf__linkbtn" onClick={() => window.dispatchEvent(new Event('open-cookie-preferences'))}>
                            Cookie settings
                        </button>
                    </li>
                </ul>
            </div>

            <div className="vq-sf__mark" aria-hidden="true"><span>VenQore</span></div>
        </footer>
    );
}
