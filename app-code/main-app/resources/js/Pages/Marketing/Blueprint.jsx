import React, { useEffect } from 'react';
import { useTheme } from '@/Contexts/ThemeContext';
import { Head, Link, usePage } from '@inertiajs/react';
import SiteHeader from '@/Components/Site/SiteHeader';
import SiteFooter from '@/Components/Site/SiteFooter';
import CookieConsent from '@/Components/CookieConsent';

export default function Blueprint() {
    const { isDarkMode, toggleTheme } = useTheme();
    const { auth = {}, flash = {}, ...props } = usePage().props;

    useEffect(() => {
        // Unlock document and body scrolling for marketing shell
        document.documentElement.setAttribute('data-vq-shell', 'marketing');
        document.documentElement.style.overflowY = 'auto';
        document.documentElement.style.overflowX = 'clip';
        document.body.style.overflow = 'visible';
        document.body.style.height = 'auto';
        const appRoot = document.getElementById('app');
        if (appRoot) {
            appRoot.style.height = 'auto';
            appRoot.style.overflow = 'visible';
        }

        let active = true;

        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const existing = document.querySelector(`script[src="${src}"]`);
                if (existing) {
                    existing.remove();
                }
                const script = document.createElement('script');
                script.src = src;
                script.async = false;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.body.appendChild(script);
            });
        };

        const initEngines = async () => {
            try {
                await loadScript('/v6/assets/venqore.js');
                await loadScript('/v6/assets/venqore-forms.js');
                
                window.dispatchEvent(new Event('resize'));
                window.dispatchEvent(new Event('scroll'));
            } catch (err) {
                console.warn('VenQore visual engines init notice:', err);
            }
        };

        const timer = setTimeout(() => {
            if (active) initEngines();
        }, 50);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, []);

    return (
        <>
            <Head>
                <title>Blueprint — the AI that builds your ERP | VenQore</title>
                <meta name="description" content="Describe your business in plain language. Blueprint drafts the system that runs it — modules, fields, roles, tax and reports — for you to approve." />
                <link rel="canonical" href="https://venqore.com/blueprint" />
                <meta property="og:title" content="Blueprint — the AI that builds your ERP | VenQore" />
                <meta property="og:description" content="Describe your business in plain language. Blueprint drafts the system that runs it — modules, fields, roles, tax and reports — for you to approve." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://venqore.com/blueprint" />
                <meta property="og:image" content="https://venqore.com/images/og/venqore-og.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Blueprint — the AI that builds your ERP | VenQore" />
                <meta name="twitter:description" content="Describe your business in plain language. Blueprint drafts the system that runs it — modules, fields, roles, tax and reports — for you to approve." />
                <meta name="twitter:image" content="https://venqore.com/images/og/venqore-og.png" />
            </Head>

            <div className="vq-site vq-app-body" style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)', overflow: 'visible', minHeight: '100vh' }}>



  <SiteHeader />

<main id="main">

<section className="vq-section" style={{"paddingTop":"clamp(140px,15vw,200px)","paddingBottom":"clamp(48px,6vw,72px)"}}>
  <div className="vq-amb"><span className="vq-amb__aurora" style={{"opacity":".30"}}></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div style={{"maxWidth":"820px"}}>
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Blueprint</span>
      <h1 className="vq-display vq-mt-4">Describe your business. <em className="vq-italic">Approve</em> the plan. It exists.</h1>
      <p className="vq-lede vq-mt-6">Blueprint is the part of VenQore that turns a description of your business into a working ERP and POS configuration: which of the 140+ modules you get, what each thing is called, who can see what, which tax rules apply and which of the 13 document types you issue. You review every line before anything becomes real, and you can rebuild it at any time.</p>
      <div className="vq-row vq-wrap vq-gap-3 vq-mt-8"><a className="vq-btn vq-btn--primary vq-btn--lg" href="/build-workspace">Start building <span className="vq-btn__arrow"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>
        <a className="vq-btn vq-btn--secondary vq-btn--lg" href="/onboarding"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3"/></svg> See a build</a></div>
    </div>
  </div>
</section>

<section className="vq-section" style={{"paddingTop":"0"}}>
  <div className="vq-container">
    <div className="vq-reveal">
<div className="vq-bp" data-bp>
  <div className="vq-bp__bar">
    <span className="vq-eyebrow" style={{"flex":"none"}}>Try one</span>
    <div className="vq-bp__tabs" role="tablist">
      <button className="vq-bp__tab" role="tab" data-bp-key="pharmacy"  aria-selected="true">Pharmacy</button>
      <button className="vq-bp__tab" role="tab" data-bp-key="wholesale" aria-selected="false">Wholesale</button>
      <button className="vq-bp__tab" role="tab" data-bp-key="cafe"      aria-selected="false">Café</button>
      <button className="vq-bp__tab" role="tab" data-bp-key="hardware"  aria-selected="false">Hardware store</button>
      <button className="vq-bp__tab" role="tab" data-bp-key="multi"     aria-selected="false">Multi-branch</button>
    </div>
  </div>
  <div className="vq-bp__body">
    <div className="vq-bp__in">
      <span className="vq-eyebrow">What the owner typed</span>
      <div className="vq-bp__prompt vq-mt-3" data-bp-prompt></div>
      <div className="vq-steps" data-bp-steps></div>
      <p className="vq-caption" style={{"marginTop":"auto","paddingTop":"var(--vq-space-6)","maxWidth":"none"}}>
        Blueprint cannot post a transaction. It cannot alter the accounting engine. It cannot
        change historical data. <b style={{"color":"var(--vq-text-2)"}}>It builds the room; it doesn't touch the safe.</b>
      </p>
    </div>
    <div className="vq-bp__out">
      <div className="vq-bp__result" data-bp-result></div>
    </div>
  </div>
</div></div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal">
      <span className="vq-eyebrow">What's in a Blueprint</span>
      <h2 className="vq-display">Six things, and you can edit all six.</h2>
    </div>
    <div className="vq-grid vq-grid--3">
      
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"/><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"/></svg></span>
        <h3 className="vq-tile__title">Modules</h3>
        <p className="vq-tile__body">Only the ones your business needs — and an explicit list of the ones it deliberately left off, with reasons. Not greyed out with an upsell badge. Absent.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 6V2H8"/><rect width="16" height="12" x="4" y="6" rx="2"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M15 11v2"/><path d="M9 11v2"/></svg></span>
        <h3 className="vq-tile__title">Your vocabulary</h3>
        <p className="vq-tile__body">If you call them jobs and not orders, the system says jobs. If your customers are patients, the menu says patients. It is one table, and it is yours to edit.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
        <h3 className="vq-tile__title">Roles &amp; approvals</h3>
        <p className="vq-tile__body">Who can discount, who can write off stock, what needs a second pair of eyes. Seven roles out of the box, and an approval chain shaped like your actual business.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></span>
        <h3 className="vq-tile__title">Tax &amp; compliance</h3>
        <p className="vq-tile__body">Set for how and where you actually sell. Inclusive or exclusive, per-item rates, the QR verification your receipts need.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg></span>
        <h3 className="vq-tile__title">Reports</h3>
        <p className="vq-tile__body">The ones your business is judged by, on the dashboard, not buried five levels into a menu you never open.</p>
      </article>
      <article className="vq-card vq-card--xl vq-tile vq-reveal vq-card--interactive">
        <span className="vq-tile__icon"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h4"/></svg></span>
        <h3 className="vq-tile__title">The ledger mapping</h3>
        <p className="vq-tile__body">Which accounts each kind of transaction posts to. Editable, and never bypassable — that is the one line the AI is not allowed to cross.</p>
      </article>
    </div>
  </div>
</section>

<section className="vq-section vq-band-dark">
  <div className="vq-amb"><span className="vq-amb__beams"><i></i><i></i><i></i></span><span className="vq-amb__grain"></span></div>
  <div className="vq-container" style={{"position":"relative"}}>
    <div className="vq-grid vq-grid--2" style={{"alignItems":"center","gap":"var(--vq-space-16)"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow">Guardrails</span>
        <h2 className="vq-display vq-mt-4">What the AI cannot do.</h2>
        <p className="vq-lede vq-mt-6">The single biggest objection to AI touching business software is
          "I don't trust it with my money." That objection deserves an answer made of architecture,
          not reassurance.</p>
        <ul className="vq-stack vq-gap-4 vq-mt-8">
          <li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-danger)","flex":"none","marginTop":"2px"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
            <span className="vq-body">Blueprint cannot post a transaction.</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-danger)","flex":"none","marginTop":"2px"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
            <span className="vq-body">It cannot alter the accounting engine.</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-danger)","flex":"none","marginTop":"2px"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
            <span className="vq-body">It cannot change historical data.</span></li><li className="vq-row vq-gap-3" style={{"alignItems":"flex-start"}}>
            <span style={{"color":"var(--vq-danger)","flex":"none","marginTop":"2px"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></span>
            <span className="vq-body">It cannot bypass an approval chain it configured.</span></li>
        </ul>
        <p className="vq-h3 vq-mt-8" style={{"color":"#fff"}}>It builds the room; it doesn't touch the safe.</p>
      </div>
      <div className="vq-reveal">
        <div className="vq-card vq-card--xl">
          <span className="vq-eyebrow">The proposal it writes</span>
          <div className="vq-mt-4" style={{"fontFamily":"var(--vq-font-numeric)","fontSize":"var(--vq-fs-caption)","lineHeight":"1.9","color":"rgb(237 242 239 / .82)","wordSpacing":"normal"}}>
            <div><span style={{"color":"var(--vq-teal-300)"}}>+</span> enable  <b>batch_expiry</b>          <span style={{"opacity":".5"}}>// "batch and expiry"</span></div>
            <div><span style={{"color":"var(--vq-teal-300)"}}>+</span> enable  <b>multi_branch</b>          <span style={{"opacity":".5"}}>// "two branches"</span></div>
            <div><span style={{"color":"var(--vq-teal-300)"}}>+</span> enable  <b>supplier_credit</b>       <span style={{"opacity":".5"}}>// "30-day credit"</span></div>
            <div><span style={{"color":"var(--vq-teal-300)"}}>+</span> enable  <b>products</b>              <span style={{"opacity":".5"}}>// required by batch_expiry</span></div>
            <div><span style={{"color":"var(--vq-coral-400)"}}>−</span> disable <b>recipes_bom</b>           <span style={{"opacity":".5"}}>// not a kitchen</span></div>
            <div><span style={{"color":"var(--vq-coral-400)"}}>−</span> disable <b>table_service</b>         <span style={{"opacity":".5"}}>// not a kitchen</span></div>
            <div className="vq-mt-3" style={{"opacity":".5"}}>rename  customers → "Patients"</div>
            <div style={{"opacity":".5"}}>rename  suppliers → "Distributors"</div>
            <div className="vq-mt-3" style={{"color":"var(--vq-teal-300)"}}>✓ dependencies satisfied · 0 conflicts · within plan</div>
          </div>
          <div className="vq-hr" style={{"marginBlock":"var(--vq-space-5)"}}></div>
          <p className="vq-caption" style={{"maxWidth":"none","color":"rgb(237 242 239 / .6)"}}>
            Every proposal is validated before you see it, applied only on approval, and snapshotted
            so it can be rolled back. Enabling one thing enables what it requires — Cookbook requires
            Products, Khata requires Parties.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

<section className="vq-section">
  <div className="vq-container">
    <div className="vq-grid vq-grid--2" style={{"alignItems":"center","gap":"var(--vq-space-16)"}}>
      <div className="vq-reveal">
        <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Change it later</span>
        <h2 className="vq-display vq-mt-4">A change request is a sentence.</h2>
        <p className="vq-lede vq-mt-6">Businesses change faster than implementations. Describe what's
          different and Blueprint shows you a diff — what's added, what changes, what's affected.
          Approve it or don't.</p>
      </div>
      <div className="vq-table-wrap vq-reveal">
        <table className="vq-table">
          <thead><tr><th>The old way</th><th>With Blueprint</th></tr></thead>
          <tbody>
          <tr><td className="vq-text-3">Discovery call</td><td className="vq-table__win">A text box</td></tr><tr><td className="vq-text-3">Statement of work</td><td className="vq-table__win">A plan you can read in two minutes</td></tr><tr><td className="vq-text-3">Configuration phase</td><td className="vq-table__win">Editing a line</td></tr><tr><td className="vq-text-3">Change request</td><td className="vq-table__win">A sentence</td></tr><tr><td className="vq-text-3">Go-live date</td><td className="vq-table__win">Today</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container vq-container--wide">
    <div className="vq-section-head vq-section-head--center vq-reveal">
      <span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">And then</span>
      <h2 className="vq-display">You approve, and the system exists.</h2>
      <p className="vq-lede">Not a demo. Your live system, with your data model, ready for your first transaction.</p>
    </div>
    <div className="vq-reveal">
<div className="vq-app">
  <div className="vq-app__bar">
    <div className="vq-app__dots"><i></i><i></i><i></i></div>
    <div className="vq-app__omni"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Ask your business a question…</div>
    <div style={{"marginLeft":"auto","display":"flex","alignItems":"center","gap":"10px"}}>
      <span className="vq-badge vq-badge--accent">Pharmacy · 2 branches</span>
    </div>
  </div>
  <div className="vq-app__body">
    <nav className="vq-app__rail" aria-label="Product navigation (illustration)">
      <span className="vq-app__nav" aria-current="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg> Dashboard</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg> Sell</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> Stock</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg> Buy</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M9 7h6"/><path d="M9 11h4"/></svg> Money</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> People</span>
      <span className="vq-app__nav"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> Reports</span>
      <span className="vq-app__nav" style={{"marginTop":"auto"}}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2"/><circle cx="12" cy="12" r="3"/></svg> Settings</span>
    </nav>
    <div className="vq-app__main">
      <div className="vq-app__title">
        <div><h3 className="vq-h3" style={{"fontSize":"19px"}}>Today</h3>
          <span className="vq-caption">Wednesday, 4 September</span></div>
        <span className="vq-status vq-status--ok"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Ledger balanced</span>
      </div>
      <div className="vq-cards">

        <div className="vq-dcard vq-dcard--accent c5 r2">
          <div className="vq-stat">
            <span className="vq-stat__label">Sales today</span>
            <span className="vq-stat__value">184.2<span className="vq-stat__unit">k PKR</span></span>
          </div>
          <div className="vq-row vq-gap-2">
            <span className="vq-delta">▲ 8.2%</span>
            <span className="vq-stat__note">vs last Wednesday</span>
          </div>
        </div>

        <div className="vq-dcard c4 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Gross margin</span></div>
          <div className="vq-stat">
            <span className="vq-stat__value vq-stat__value--sm">31.4<span className="vq-stat__unit">%</span></span>
          </div>
          <div className="vq-row vq-gap-2">
            <span className="vq-delta vq-delta--down">▼ 1.1pt</span>
            <span className="vq-stat__note">vs last month</span>
          </div>
        </div>

        <div className="vq-dcard c3 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Expiring ≤30 days</span></div>
          <div className="vq-stat">
            <span className="vq-stat__value vq-stat__value--sm">27<span className="vq-stat__unit">batches</span></span>
          </div>
          <span className="vq-status vq-status--warn"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Review</span>
        </div>

        <div className="vq-dcard c7 r3">
          <div className="vq-dcard__head">
            <span className="vq-dcard__title">Sales, last 14 days</span>
            <span className="vq-badge">Branch: all</span>
          </div>
          <div style={{"marginTop":"auto"}}><div className="vq-chart" style={{"height":"108px"}}>
    <svg viewBox="0 0 320 108" preserveAspectRatio="none" role="img" aria-label="Trend, last 14 periods">
      <defs><linearGradient id="vqFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--vq-series-1-ink)" stopOpacity=".22"/>
        <stop offset="100%" stopColor="var(--vq-series-1-ink)" stopOpacity="0"/>
      </linearGradient></defs>
      <path className="area" d="M0.0 101.7 L24.6 91.8 L49.2 105.0 L73.8 78.7 L98.5 68.8 L123.1 82.0 L147.7 58.9 L172.3 65.5 L196.9 45.8 L221.5 52.4 L246.2 32.6 L270.8 42.5 L295.4 16.2 L320.0 3.0 L320 108 L0 108 Z"/><path className="line" d="M0.0 101.7 L24.6 91.8 L49.2 105.0 L73.8 78.7 L98.5 68.8 L123.1 82.0 L147.7 58.9 L172.3 65.5 L196.9 45.8 L221.5 52.4 L246.2 32.6 L270.8 42.5 L295.4 16.2 L320.0 3.0"/>
    </svg></div></div>
        </div>

        <div className="vq-dcard c5 r3">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Top lines by margin</span></div>
          <div className="vq-mt-4"><div className="vq-rank">
  <div className="vq-rank__row"><span className="vq-rank__name">Panadol 500mg</span><span className="vq-rank__val">41.2%</span>
    <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"92%"}}></span></span>
  </div>
  <div className="vq-rank__row"><span className="vq-rank__name">Augmentin 625</span><span className="vq-rank__val">33.8%</span>
    <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"76%"}}></span></span>
  </div>
  <div className="vq-rank__row"><span className="vq-rank__name">Surgical masks</span><span className="vq-rank__val">28.1%</span>
    <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"63%"}}></span></span>
  </div>
  <div className="vq-rank__row"><span className="vq-rank__name">Glucose strips</span><span className="vq-rank__val">19.4%</span>
    <span className="vq-rank__track"><span className="vq-rank__fill" style={{"--w":"44%"}}></span></span>
  </div></div></div>
        </div>

        <div className="vq-dcard c4 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Cash vs card</span></div>
          <div style={{"marginTop":"auto"}}><div className="vq-chart" style={{"height":"78px"}}>
    <svg viewBox="0 0 260 78" preserveAspectRatio="none" role="img" aria-label="Comparison by period"><line className="grid" x1="0" x2="260" y1="21.12" y2="21.12"/><line className="grid" x1="0" x2="260" y1="42.24" y2="42.24"/><line className="grid" x1="0" x2="260" y1="64" y2="64"/><rect className="bar" x="0.0" y="27.1" width="32.0" height="36.9"/><rect className="bar" x="38.0" y="19.2" width="32.0" height="44.8"/><rect className="bar" x="76.0" y="30.6" width="32.0" height="33.4"/><rect className="bar" x="114.0" y="11.3" width="32.0" height="52.7"/><rect className="bar" x="152.0" y="22.7" width="32.0" height="41.3"/><rect className="bar is-on" x="190.0" y="6.0" width="32.0" height="58.0"/><rect className="bar" x="228.0" y="13.0" width="32.0" height="51.0"/><text className="lbl" x="16.0" y="76" textAnchor="middle">M</text><text className="lbl" x="54.0" y="76" textAnchor="middle">T</text><text className="lbl" x="92.0" y="76" textAnchor="middle">W</text><text className="lbl" x="130.0" y="76" textAnchor="middle">T</text><text className="lbl" x="168.0" y="76" textAnchor="middle">F</text><text className="lbl" x="206.0" y="76" textAnchor="middle">S</text><text className="lbl" x="244.0" y="76" textAnchor="middle">S</text></svg></div></div>
        </div>

        <div className="vq-dcard c4 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">Owed to you</span></div>
          <div className="vq-stat">
            <span className="vq-stat__value vq-stat__value--sm">612<span className="vq-stat__unit">k</span></span>
            <span className="vq-stat__note">Rs 84k over 60 days</span>
          </div>
        </div>

        <div className="vq-dcard c4 r2">
          <div className="vq-dcard__head"><span className="vq-dcard__title">You owe</span></div>
          <div className="vq-stat">
            <span className="vq-stat__value vq-stat__value--sm">(438)<span className="vq-stat__unit">k</span></span>
            <span className="vq-stat__note">4 distributors · next due Fri</span>
          </div>
        </div>

      </div>
    </div>
  </div>
</div></div>
  </div>
</section>

<section className="vq-section vq-section--alt">
  <div className="vq-container">
    <div className="vq-section-head vq-reveal"><span className="vq-eyebrow vq-eyebrow--accent vq-eyebrow--dot">Keep reading</span><h2 className="vq-h2 vq-mt-4">Once it is built</h2></div>
    <div className="vq-grid vq-grid--3"><a className="vq-card vq-card--interactive vq-reveal" href="/onboarding"><h3 className="vq-h3">See a build end to end</h3><p className="vq-tile__body vq-mt-3">Four minutes, description to live system.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/solutions"><h3 className="vq-h3">The six industry starting points</h3><p className="vq-tile__body vq-mt-3">Retail, wholesale, pharmacy, grocery, apparel, multi-branch.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><a className="vq-card vq-card--interactive vq-reveal" href="/pricing"><h3 className="vq-h3">What it costs to run</h3><p className="vq-tile__body vq-mt-3">From $49/month or free, every module included.</p><span className="vq-link vq-mt-4">Read on <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a></div>
  </div>
</section>
</main>

  <SiteFooter />
  <CookieConsent />





{/*  Privacy-first cookieless analytics  */}


            </div>
        </>
    );
}
